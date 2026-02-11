use anchor_lang::prelude::*;

use instructions::*;

mod constants;
mod data;
mod errors;
mod instructions;
mod vesting_calculator;

#[cfg(feature = "localnet")]
declare_id!("XYBGKPCgL6Twhdjo6LFt9niCgyxnbxN3tacXypc6SSt");

#[cfg(not(feature = "localnet"))]
declare_id!("xicod59noqHeMsTqBjrmHQBbqrzHhw1v92CTmguPWag");

#[program]
pub mod xyber_sale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey) -> Result<()> {
        instructions::initialize(ctx, new_admin)
    }

    pub fn propose_multisig(ctx: Context<ProposeMultisig>, new_multisig: Pubkey) -> Result<()> {
        instructions::propose_multisig(ctx, new_multisig)
    }

    pub fn accept_multisig(ctx: Context<AcceptMultisig>) -> Result<()> {
        instructions::accept_multisig(ctx)
    }

    pub fn set_quote_mint(
        ctx: Context<SetQuoteMint>,
        price: i64,
        expo: i32,
        is_enabled: bool,
    ) -> Result<()> {
        instructions::set_quote_mint(ctx, price, expo, is_enabled)
    }

    pub fn setup_round(
        ctx: Context<SetupRound>,
        round: data::Round,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        instructions::setup_round(ctx, round, start_time, end_time)
    }

    pub fn setup_bucket(
        ctx: Context<SetupBucket>,
        bucket_name: String,
        bucket_data: data::BucketData,
    ) -> Result<()> {
        instructions::setup_bucket(ctx, bucket_name, bucket_data)
    }

    pub fn deposit_sol(
        ctx: Context<DepositSol>,
        round: data::Round,
        payment_amount: u64,
    ) -> Result<()> {
        instructions::deposit_sol(ctx, round, payment_amount)
    }

    pub fn deposit_asset(
        ctx: Context<DepositAsset>,
        round: data::Round,
        payment_amount: u64,
    ) -> Result<()> {
        instructions::deposit_asset(ctx, round, payment_amount)
    }

    pub fn setup_vesting_plan(
        ctx: Context<SetupVestingPlan>,
        vesting_plan_name: String,
        plan: data::VestingPlan,
    ) -> Result<()> {
        instructions::setup_vesting_plan(ctx, vesting_plan_name, plan)
    }

    pub fn setup_deterministic_vesting(
        ctx: Context<SetupDeterministicVesting>,
        bucket_name: String,
        new_allocation: u64,
        vesting_plan: Option<String>,
        tokens_claimed: u64,
        tokens_burnt: u64,
    ) -> Result<()> {
        instructions::setup_deterministic_vesting(
            ctx,
            bucket_name,
            new_allocation,
            vesting_plan,
            tokens_claimed,
            tokens_burnt,
        )
    }

    pub fn claim(ctx: Context<Claim>, bucket_name: String, vesting_plan: String) -> Result<()> {
        instructions::claim(ctx, bucket_name, vesting_plan)
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>) -> Result<()> {
        instructions::withdraw_sol(ctx)
    }

    pub fn withdraw_asset(ctx: Context<WithdrawAsset>) -> Result<()> {
        instructions::withdraw_asset(ctx)
    }

    pub fn withdraw_unsold_tokens(
        ctx: Context<WithdrawUnsold>,
        bucket_name: String,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_unsold_tokens(ctx, bucket_name, amount)
    }
}
