use anchor_lang::{prelude::*, system_program, system_program::Transfer};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    constants::{BUCKET_POOL_SEED, BUCKET_SEED, SALE_BUCKET_SEED, SEED_ROOT},
    data::{BucketData, SaleConfig},
    errors::CustomError,
};

pub fn withdraw_sol(ctx: Context<WithdrawSol>) -> Result<()> {
    let bucket_pool_balance = ctx.accounts.bucket_pool.get_lamports();
    let rent_exempt_minimum = Rent::get()?.minimum_balance(0);

    let lamports_to_withdraw = bucket_pool_balance
        .checked_sub(rent_exempt_minimum)
        .ok_or(CustomError::InsufficientFunds)?;

    require!(lamports_to_withdraw > 0, CustomError::InsufficientFunds);

    let bump = [ctx.bumps.bucket_pool];
    let seeds = [SEED_ROOT, BUCKET_POOL_SEED, SALE_BUCKET_SEED, &bump[..]];
    let binding = [&seeds[..]];
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.bucket_pool.to_account_info(),
            to: ctx.accounts.address_to_withdraw_to.to_account_info(),
        },
        &binding,
    );
    system_program::transfer(cpi_context, lamports_to_withdraw)
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(signer, mut, constraint = Some(multisig.key()) == config.multisig @ CustomError::InvalidAdmin)]
    multisig: Signer<'info>,

    #[account(seeds = [SEED_ROOT, b"CONFIG"], bump)]
    config: Box<Account<'info, SaleConfig>>,

    /// CHECK
    #[account(mut, seeds = [SEED_ROOT, BUCKET_POOL_SEED, SALE_BUCKET_SEED], bump)]
    bucket_pool: UncheckedAccount<'info>,

    /// CHECK: Destination for SOL withdrawal
    #[account(mut)]
    address_to_withdraw_to: UncheckedAccount<'info>,

    system_program: Program<'info, System>,
}

pub fn withdraw_asset(ctx: Context<WithdrawAsset>) -> Result<()> {
    let asset_to_withdraw = ctx.accounts.quote_pool_ata.amount;
    require!(asset_to_withdraw > 0, CustomError::InsufficientFunds);

    let asset_decimals = ctx.accounts.quote_mint.decimals;
    let bump = [ctx.bumps.bucket_pool];
    let seeds = [SEED_ROOT, BUCKET_POOL_SEED, SALE_BUCKET_SEED, &bump[..]];
    let binding = [&seeds[..]];
    let cpi = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
            from: ctx.accounts.quote_pool_ata.to_account_info(),
            mint: ctx.accounts.quote_mint.to_account_info(),
            to: ctx.accounts.withdraw_ata.to_account_info(),
            authority: ctx.accounts.bucket_pool.to_account_info(),
        },
        &binding,
    );
    transfer_checked(cpi, asset_to_withdraw, asset_decimals)
}

#[derive(Accounts)]
pub struct WithdrawAsset<'info> {
    #[account(signer, mut, constraint = Some(multisig.key()) == config.multisig @ CustomError::InvalidAdmin)]
    multisig: Signer<'info>,

    #[account(seeds = [SEED_ROOT, b"CONFIG"], bump)]
    config: Box<Account<'info, SaleConfig>>,

    #[account(seeds = [SEED_ROOT, BUCKET_POOL_SEED, SALE_BUCKET_SEED], bump)]
    bucket_pool: SystemAccount<'info>,

    #[account(mut)]
    quote_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = quote_mint,
        associated_token::authority = bucket_pool,
        associated_token::token_program = token_program
    )]
    quote_pool_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    withdraw_owner: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = multisig,
        associated_token::mint = quote_mint,
        associated_token::authority = withdraw_owner,
        associated_token::token_program = token_program,
    )]
    withdraw_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    token_program: Interface<'info, TokenInterface>,
    associated_token_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
}

pub fn withdraw_unsold_tokens(
    ctx: Context<WithdrawUnsold>,
    _bucket_name: String,
    amount: u64,
) -> Result<()> {
    let bucket_data = &mut ctx.accounts.bucket_data;
    require_gte!(bucket_data.bucket_supply, amount, CustomError::InsufficientBucketSupply);
    bucket_data.bucket_supply -= amount;
    require_gte!(
        bucket_data.bucket_supply,
        bucket_data.registered_supply,
        CustomError::InsufficientBucketSupply
    );

    let base_decimals = ctx.accounts.base_mint.decimals;
    let bump = [ctx.bumps.bucket_data];
    let seeds = [SEED_ROOT, BUCKET_SEED, _bucket_name.as_bytes(), &bump[..]];
    let binding = [&seeds[..]];
    let cpi = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
            from: ctx.accounts.bucket_base_ata.to_account_info(),
            mint: ctx.accounts.base_mint.to_account_info(),
            to: ctx.accounts.withdraw_ata.to_account_info(),
            authority: ctx.accounts.bucket_data.to_account_info(),
        },
        &binding,
    );
    transfer_checked(cpi, amount, base_decimals)
}

#[derive(Accounts)]
#[instruction(bucket_name: String, amount: u64)]
pub struct WithdrawUnsold<'info> {
    #[account(signer, mut, constraint = Some(multisig.key()) == config.multisig @ CustomError::InvalidAdmin)]
    multisig: Signer<'info>,

    #[account(seeds = [SEED_ROOT, b"CONFIG"], bump)]
    config: Box<Account<'info, SaleConfig>>,

    #[account(mut, seeds = [SEED_ROOT, BUCKET_SEED, bucket_name.as_bytes()], bump)]
    bucket_data: Box<Account<'info, BucketData>>,

    #[account(
        mut,
        associated_token::mint = base_mint,
        associated_token::authority = bucket_data,
        associated_token::token_program = token_program,
        constraint = bucket_base_ata.amount >= amount @ CustomError::InsufficientFunds
    )]
    bucket_base_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    withdraw_owner: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = multisig,
        associated_token::mint = base_mint,
        associated_token::authority = withdraw_owner,
        associated_token::token_program = token_program,
    )]
    withdraw_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(address = config.base_mint @ CustomError::InvalidBaseMint)]
    base_mint: Box<InterfaceAccount<'info, Mint>>,

    token_program: Interface<'info, TokenInterface>,
    associated_token_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
}
