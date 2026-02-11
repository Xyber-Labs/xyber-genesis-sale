use anchor_lang::{prelude::*, system_program::System};

use crate::{
    constants::{CONFIG_SEED, SEED_ROOT, VESTING_PLAN_SEED},
    data::{SaleConfig, VestingPlan},
    errors::CustomError,
};

#[derive(Accounts)]
#[instruction(vesting_plan_name: String)]
pub struct SetupVestingPlan<'info> {
    #[account(signer, mut, constraint = admin.key() == config.admin @ CustomError::InvalidAdmin)]
    pub admin: Signer<'info>,

    #[account(seeds = [SEED_ROOT, CONFIG_SEED], bump)]
    pub config: Box<Account<'info, SaleConfig>>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + VestingPlan::INIT_SPACE,
        seeds = [SEED_ROOT, VESTING_PLAN_SEED, vesting_plan_name.as_bytes()],
        bump
    )]
    pub vesting_plan: Box<Account<'info, VestingPlan>>,

    pub system_program: Program<'info, System>,
}

pub fn setup_vesting_plan(
    ctx: Context<SetupVestingPlan>,
    _vesting_plan_name: String,
    plan: VestingPlan,
) -> Result<()> {
    require!(plan.is_valid(), CustomError::BadParams);
    ctx.accounts.vesting_plan.set_inner(plan);
    Ok(())
}
