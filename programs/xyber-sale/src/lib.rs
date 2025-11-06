use anchor_lang::prelude::*;

use instructions::*;

mod constants;
mod data;
mod errors;
mod events;
mod instructions;

declare_id!("XYBGKPCgL6Twhdjo6LFt9niCgyxnbxN3tacXypc6SSt");

#[program]
pub mod xyber_sale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey, backend: Pubkey, multisig: Pubkey) -> Result<()> {
        instructions::initialize(ctx, new_admin, backend, multisig)
    }

    pub fn setup_round(ctx: Context<SetupRound>, round: data::Round, price: u64, start_time: i64, end_time: i64) -> Result<()> {
        instructions::setup_round(ctx, round, price, start_time, end_time)
    }

    pub fn setup_bucket(ctx: Context<SetupBucket>, bucket_name: String, bucket_data: data::BucketData) -> Result<()> {
        instructions::setup_bucket(ctx, bucket_name, bucket_data)
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, round: data::Round, sol_price: u128, base_allocation: u64, expiration: i64) -> Result<()> {
        instructions::deposit_sol(ctx, round, sol_price, base_allocation, expiration)
    }

    pub fn deposit_asset(ctx: Context<DepositAsset>, round: data::Round, base_allocation: u64, expiration: i64) -> Result<()> {
        instructions::deposit_asset(ctx, round, base_allocation, expiration)
    }
}
