use anchor_lang::prelude::*;

pub use claim::*;
pub use deposit_asset::*;
pub use deposit_sol::*;
pub use initialize::*;
pub use set_quote_mint::*;
pub use setup_bucket::*;
pub use setup_deterministic_vesting::*;
pub use setup_round::*;
pub use setup_vesting_plan::*;
pub use transfer_multisig::*;
pub use withdraw::*;

use crate::data::{BucketData, VestingConfig, VestingType};

mod claim;
mod deposit_asset;
mod deposit_sol;
mod initialize;
mod set_quote_mint;
mod setup_bucket;
mod setup_deterministic_vesting;
mod setup_round;
mod setup_vesting_plan;
mod transfer_multisig;
mod withdraw;

pub(super) fn update_allocation(
    vesting_config: &mut VestingConfig,
    bucket_data: &mut BucketData,
    payment_amount: u64,
) -> Result<()> {
    bucket_data.total_deposit += payment_amount;
    match vesting_config.vesting_type.as_mut() {
        None => {
            vesting_config.vesting_type = Some(VestingType::Priceless {
                deposit: payment_amount,
            })
        }
        Some(VestingType::Priceless { deposit }) => *deposit += payment_amount,
        Some(VestingType::Deterministic { .. }) => panic!("Deterministic not supported in deposit"),
    }
    Ok(())
}

const MIN_EXPO: i32 = -12;
const MAX_EXPO: i32 = 0;
const MAX_PRICE: i64 = 1_000_000_000_000_000;
