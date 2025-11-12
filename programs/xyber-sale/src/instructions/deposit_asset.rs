use anchor_lang::{prelude::*, system_program::System};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked},
};

use crate::{
    constants::{QUOTE_SEED, SALE_BUCKET_SEED, SEED_ROOT},
    data::{BucketData, DepositEvent, QuoteConfig, Round, RoundConfig, SaleConfig, VestingConfig},
    errors::CustomError,
};

use super::update_allocation;

#[derive(Accounts)]
#[instruction(round: Round)]
pub struct DepositAsset<'info> {
    #[account(signer, mut)]
    pub buyer: Signer<'info>,

    #[account(seeds = [SEED_ROOT, b"CONFIG"], bump)]
    pub config: Box<Account<'info, SaleConfig>>,

    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(seeds = [SEED_ROOT, QUOTE_SEED, quote_mint.key().as_ref()], bump, constraint = quote_config.is_enabled @ CustomError::InvalidQuoteMint)]
    pub quote_config: Box<Account<'info, QuoteConfig>>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + VestingConfig::INIT_SPACE,
        seeds = [SEED_ROOT, b"VESTING_CONFIG", round.as_bytes(), buyer.key().as_ref()],
        bump
    )]
    pub vesting_config: Box<Account<'info, VestingConfig>>,

    #[account(seeds = [SEED_ROOT, b"ROUND", round.as_bytes()], bump)]
    pub round_config: Box<Account<'info, RoundConfig>>,

    #[account(
        mut,
        associated_token::mint = quote_mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_quote_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: Bucket pool PDA
    #[account(mut, seeds = [SEED_ROOT, b"BUCKET_POOL", SALE_BUCKET_SEED], bump)]
    pub bucket_pool: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = quote_mint,
        associated_token::authority = bucket_pool,
        associated_token::token_program = token_program,
    )]
    pub quote_pool_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, seeds = [SEED_ROOT, b"BUCKET", round.as_bytes()], bump)]
    pub bucket_data: Box<Account<'info, BucketData>>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn deposit_asset(ctx: Context<DepositAsset>, _round: Round, payment_amount: u64) -> Result<()> {
    let round_config = &ctx.accounts.round_config;
    let now = Clock::get()?.unix_timestamp;
    require!(now >= round_config.start_time, CustomError::RoundNotStarted);
    require!(round_config.end_time >= now, CustomError::RoundFinished);

    let transfer_accounts = TransferChecked {
        from: ctx.accounts.buyer_quote_ata.to_account_info(),
        mint: ctx.accounts.quote_mint.to_account_info(),
        to: ctx.accounts.quote_pool_ata.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    };

    let cpi = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts);
    transfer_checked(cpi, payment_amount, ctx.accounts.quote_mint.decimals)?;

    let sol_equivalent = convert_quote_to_sol(
        payment_amount,
        ctx.accounts.quote_config.price,
        ctx.accounts.quote_config.expo,
        ctx.accounts.quote_mint.decimals,
    );

    update_allocation(
        &mut ctx.accounts.vesting_config,
        &mut ctx.accounts.bucket_data,
        sol_equivalent,
    )?;

    emit!(DepositEvent {
        buyer: ctx.accounts.buyer.key(),
        round: _round,
        sol_amount: sol_equivalent,
    });

    Ok(())
}

fn convert_quote_to_sol(quote_amount: u64, price: i64, expo: i32, quote_decimals: u8) -> u64 {
    const SOL_DECIMALS: u32 = 9;
    let price_abs = price.unsigned_abs() as u128;
    let expo_abs = expo.unsigned_abs();

    let numerator = (quote_amount as u128)
        .checked_mul(10u128.pow(expo_abs))
        .and_then(|v| v.checked_mul(10u128.pow(SOL_DECIMALS)))
        .expect("Overflow in numerator");

    let denominator =
        price_abs.checked_mul(10u128.pow(quote_decimals as u32)).expect("Overflow in denominator");

    let sol_equivalent =
        numerator.checked_div(denominator).expect("Error in convert_quote_to_sol calculation");

    u64::try_from(sol_equivalent).expect("Overflow in convert_quote_to_sol")
}
