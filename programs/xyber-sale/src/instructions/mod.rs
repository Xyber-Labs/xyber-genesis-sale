use anchor_lang::prelude::*;

use crate::{
    data::{BucketData, RoundConfig, VestingConfig},
    errors::CustomError,
};

pub use claim::*;
pub use deposit_asset::*;
pub use deposit_sol::*;
pub use initialize::*;
pub use setup_bucket::*;
pub use setup_round::*;
pub use setup_vesting_plan::*;
pub use withdraw::*;

mod claim;
mod deposit_asset;
mod deposit_sol;
mod initialize;
mod setup_bucket;
mod setup_round;
mod setup_vesting_plan;
mod withdraw;

pub fn validate_round(round_config: &Account<RoundConfig>, expiration: i64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(expiration >= now, CustomError::SignatureExpired);
    require!(now >= round_config.start_time, CustomError::RoundNotStarted);
    require!(round_config.end_time >= now, CustomError::RoundFinished);

    Ok(())
}

pub fn get_order_price(price: u64, base_amount: u64, base_decimals: u32) -> u64 {
    let adjustment_value = 10_u64.pow(base_decimals);

    price
        .checked_mul(base_amount)
        .and_then(|v| v.checked_div(adjustment_value))
        .expect("Error in get_order_price calculation")
}

pub fn update_allocation(
    vesting_config: &mut VestingConfig,
    bucket_data: &mut BucketData,
    base_allocation: u64,
) -> Result<()> {
    vesting_config.total_allocation += base_allocation;
    bucket_data.registered_supply += base_allocation;

    require!(
        bucket_data.bucket_supply >= bucket_data.registered_supply,
        CustomError::BucketSupplyExceeded
    );

    Ok(())
}

