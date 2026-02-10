use anchor_lang::{prelude::*, system_program};

use crate::{
    constants::{SALE_BUCKET_SEED, SEED_ROOT},
    data::{
        BucketData, BucketVestingType, DepositEvent, Round, RoundConfig, SaleConfig, VestingConfig,
    },
    errors::CustomError,
};

use super::update_allocation;

#[derive(Accounts)]
#[instruction(round: Round)]
pub struct DepositSol<'info> {
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

    /// CHECK: Bucket pool PDA
    #[account(mut, seeds = [SEED_ROOT, b"BUCKET_POOL", SALE_BUCKET_SEED], bump)]
    pub bucket_pool: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [SEED_ROOT, b"BUCKET", round.as_bytes()],
        bump,
        constraint = bucket_data.vesting_type == Some(BucketVestingType::Priceless) @ CustomError::InvalidBucketVestingType
    )]
    pub bucket_data: Box<Account<'info, BucketData>>,

    pub system_program: Program<'info, System>,
}

pub fn deposit_sol(ctx: Context<DepositSol>, _round: Round, payment_amount: u64) -> Result<()> {
    let round_config = &ctx.accounts.round_config;
    let now = Clock::get()?.unix_timestamp;
    require!(now >= round_config.start_time, CustomError::RoundNotStarted);
    require!(round_config.end_time >= now, CustomError::RoundFinished);

    let transfer_accounts = system_program::Transfer {
        from: ctx.accounts.buyer.to_account_info(),
        to: ctx.accounts.bucket_pool.to_account_info(),
    };
    let cpi = CpiContext::new(ctx.accounts.system_program.to_account_info(), transfer_accounts);
    system_program::transfer(cpi, payment_amount)?;

    update_allocation(
        &mut ctx.accounts.vesting_config,
        &mut ctx.accounts.bucket_data,
        payment_amount,
    )?;

    emit!(DepositEvent {
        buyer: ctx.accounts.buyer.key(),
        round: _round,
        sol_amount: payment_amount,
    });

    Ok(())
}
