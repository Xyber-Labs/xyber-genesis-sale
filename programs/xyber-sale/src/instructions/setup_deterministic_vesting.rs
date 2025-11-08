use anchor_lang::prelude::*;

use crate::{
    constants::SEED_ROOT,
    data::{BucketData, SaleConfig, VestingConfig, VestingType},
    errors::CustomError,
};

pub fn setup_deterministic_vesting(
    ctx: Context<SetupDeterministicVesting>,
    _bucket_name: String,
    new_allocation: u64,
    vesting_plan: Option<String>,
    tokens_claimed: u64,
    tokens_burnt: u64,
) -> Result<()> {
    if let Some(ref vesting_plan) = vesting_plan {
        require!(
            ctx.accounts.bucket_data.vesting_plan.contains(vesting_plan),
            CustomError::UnexpectedVestingPlan
        );
    }

    let vesting_config = &mut ctx.accounts.vesting_config;
    let bucket_data = &mut ctx.accounts.bucket_data;

    let old_allocation = match vesting_config.vesting_type {
        Some(VestingType::Deterministic { allocation }) => allocation,
        Some(VestingType::DepositBased { .. }) => {
            panic!("DepositBased vesting cannot be modified via setup_deterministic_vesting")
        }
        None => 0,
    };

    let new_bucket_supply = bucket_data.registered_supply - old_allocation + new_allocation;
    require!(
        new_bucket_supply <= bucket_data.bucket_supply,
        CustomError::BucketSupplyExceeded
    );
    bucket_data.registered_supply = new_bucket_supply;

    vesting_config.vesting_type = Some(VestingType::Deterministic {
        allocation: new_allocation,
    });
    vesting_config.vesting_plan = vesting_plan;
    vesting_config.tokens_claimed = tokens_claimed;
    vesting_config.tokens_burnt = tokens_burnt;

    Ok(())
}

#[derive(Accounts)]
#[instruction(bucket_name: String)]
pub struct SetupDeterministicVesting<'info> {
    #[account(signer, mut, constraint = admin.key() == config.admin @ CustomError::InvalidAdmin)]
    pub admin: Signer<'info>,
    #[account(seeds = [SEED_ROOT, b"CONFIG"], bump)]
    pub config: Box<Account<'info, SaleConfig>>,
    /// CHECK: Participant pubkey used only for PDA derivation
    pub participant: UncheckedAccount<'info>,
    #[account(mut, seeds = [SEED_ROOT, b"BUCKET", bucket_name.as_bytes()], bump)]
    pub bucket_data: Box<Account<'info, BucketData>>,
    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + VestingConfig::INIT_SPACE,
        seeds = [SEED_ROOT, b"VESTING_CONFIG", bucket_name.as_bytes(), participant.key().as_ref()],
        bump
    )]
    pub vesting_config: Box<Account<'info, VestingConfig>>,
    pub system_program: Program<'info, System>,
}
