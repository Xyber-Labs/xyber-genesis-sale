use anchor_lang::prelude::*;

use crate::{
    constants::SEED_ROOT,
    data::{Round, RoundConfig, SaleConfig},
    errors::CustomError,
};

#[derive(Accounts)]
#[instruction(round: Round)]
pub struct SetupRound<'info> {
    #[account(signer, mut, address = config.admin @ CustomError::InvalidAdmin)]
    pub admin: Signer<'info>,

    #[account(seeds = [SEED_ROOT, b"CONFIG"], bump)]
    pub config: Box<Account<'info, SaleConfig>>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + RoundConfig::INIT_SPACE,
        seeds = [SEED_ROOT, b"ROUND", round.as_bytes()],
        bump
    )]
    pub round_config: Box<Account<'info, RoundConfig>>,

    pub system_program: Program<'info, System>,
}

pub fn setup_round(ctx: Context<SetupRound>, _round: Round, start_time: i64, end_time: i64) -> Result<()> {
    let round_config = &mut ctx.accounts.round_config;
    round_config.start_time = start_time;
    round_config.end_time = end_time;

    Ok(())
}
