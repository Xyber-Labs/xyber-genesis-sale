use anchor_lang::{prelude::*, system_program::System};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked},
};

use crate::{
    constants::{SALE_BUCKET_SEED, SEED_ROOT},
    data::{BucketData, DepositEvent, Round, RoundConfig, SaleConfig, VestingConfig},
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

    #[account(address = config.base_mint @ CustomError::InvalidBaseMint)]
    pub base_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(address = config.quote_mint @ CustomError::InvalidQuoteMint)]
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = quote_mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_quote_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK
    #[account(mut, seeds = [SEED_ROOT, b"BUCKET_POOL", SALE_BUCKET_SEED], bump)]
    pub bucket_pool: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = quote_mint,
        associated_token::authority = bucket_pool,
        associated_token::token_program = token_program,
    )]
    pub bucket_pool_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, seeds = [SEED_ROOT, b"BUCKET", round.as_bytes()], bump)]
    pub bucket_data: Box<Account<'info, BucketData>>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn deposit_asset(
    ctx: Context<DepositAsset>,
    _round: Round,
    payment_amount: u64,
) -> Result<()> {
    let round_config = &ctx.accounts.round_config;
    let now = Clock::get()?.unix_timestamp;
    require!(now >= round_config.start_time, CustomError::RoundNotStarted);
    require!(round_config.end_time >= now, CustomError::RoundFinished);

    let transfer_accounts = TransferChecked {
        from: ctx.accounts.buyer_quote_ata.to_account_info(),
        mint: ctx.accounts.quote_mint.to_account_info(),
        to: ctx.accounts.bucket_pool_ata.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    };

    let cpi = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts);
    transfer_checked(cpi, payment_amount, ctx.accounts.quote_mint.decimals)?;

    update_allocation(
        &mut ctx.accounts.vesting_config,
        &mut ctx.accounts.bucket_data,
        payment_amount,
    )?;

    emit!(DepositEvent {
        buyer: ctx.accounts.buyer.key(),
        round: _round,
        quote_amount: payment_amount,
    });

    Ok(())
}
