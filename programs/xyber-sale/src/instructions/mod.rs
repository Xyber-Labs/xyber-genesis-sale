use anchor_lang::prelude::*;

pub use claim::*;
pub use deposit_asset::*;
pub use deposit_sol::*;
pub use initialize::*;
pub use setup_bucket::*;
pub use setup_deterministic_vesting::*;
pub use setup_round::*;
pub use setup_vesting_plan::*;
pub use withdraw::*;

use crate::{
    data::{BucketData, RoundConfig, VestingConfig, VestingType},
    errors::CustomError,
};

mod claim;
mod deposit_asset;
mod deposit_sol;
mod initialize;
mod setup_bucket;
mod setup_deterministic_vesting;
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

pub fn update_vesting_config(
    vesting_config: &mut VestingConfig,
    bucket_data: &mut BucketData,
    _base_allocation: u64,
    order_price: u64,
) -> Result<()> {
    bucket_data.total_deposit += order_price;
    match vesting_config.vesting_type.as_mut() {
        None => {
            vesting_config.vesting_type = Some(VestingType::DepositBased {
                deposit: order_price,
            })
        }
        Some(VestingType::DepositBased { deposit }) => *deposit += order_price,
        Some(VestingType::Deterministic { .. }) => panic!("Deterministic not supported in deposit"),
    }
    Ok(())
}
