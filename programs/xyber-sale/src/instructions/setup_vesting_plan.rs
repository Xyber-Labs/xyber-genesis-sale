use anchor_lang::{prelude::*, system_program::System};

use crate::{
    constants::SEED_ROOT,
    data::{SaleConfig, VestingPlan},
    errors::CustomError,
};

#[derive(Accounts)]
#[instruction(vesting_plan_name: String)]
pub struct SetupVestingPlan<'info> {
    #[account(signer, mut, constraint = admin.key() == config.admin @ CustomError::InvalidAdmin)]
    pub admin: Signer<'info>,

    #[account(seeds = [SEED_ROOT, b"CONFIG"], bump)]
    pub config: Box<Account<'info, SaleConfig>>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + VestingPlan::INIT_SPACE,
        seeds = [SEED_ROOT, b"VESTING_PLAN", vesting_plan_name.as_bytes()],
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
    ctx.accounts.vesting_plan.set_inner(plan);
    Ok(())
}
