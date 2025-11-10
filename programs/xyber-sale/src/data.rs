use anchor_lang::prelude::*;

use crate::vesting_calculator::VestingCalculator;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq, InitSpace)]
pub enum Round {
    #[default]
    Public,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum BucketVestingType {
    Deterministic,
    DepositBased,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VestingType {
    Deterministic { allocation: u64 },
    DepositBased { deposit: u64 },
}

impl Round {
    pub fn as_bytes(&self) -> &[u8] {
        match self {
            Round::Public => b"public",
        }
    }
}

#[account]
#[derive(Default, InitSpace)]
pub struct SaleConfig {
    pub admin: Pubkey,
    pub backend: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub multisig: Option<Pubkey>,
}

#[account]
#[derive(Default, InitSpace)]
pub struct RoundConfig {
    pub start_time: i64,
    pub end_time: i64,
}

#[account]
#[derive(Default, InitSpace)]
pub struct VestingConfig {
    #[max_len(40)]
    pub vesting_plan: Option<String>,
    pub vesting_type: Option<VestingType>,
    pub tokens_claimed: u64,
    pub tokens_burnt: u64,
}

#[account]
#[derive(Default, InitSpace)]
pub struct BucketData {
    pub vesting_type: Option<BucketVestingType>,
    pub total_deposit: u64,
    pub bucket_supply: u64,
    pub registered_supply: u64,
    pub claimed_supply: u64,
    pub burnt_supply: u64,
    #[max_len(10, 40)]
    pub vesting_plan: Vec<String>,
}

#[account]
#[derive(Default, InitSpace)]
pub struct VestingPeriod {
    pub start_timestamp: u64,
    pub claim_ratio: f64,
    pub burn_ratio: f64,
    pub base_period_index: Option<u8>,
}

#[account]
#[derive(InitSpace)]
pub struct VestingPlan {
    #[max_len(24)]
    pub periods: Vec<VestingPeriod>,
}

impl VestingCalculator {
    pub(super) fn new(
        vesting_config: &VestingConfig,
        vesting_plan: &VestingPlan,
        bucket_data: &BucketData,
    ) -> Self {
        let participant_allocation = Self::get_participant_allocation(vesting_config, bucket_data);

        let mut calculator = VestingCalculator::builder()
            .claimed(vesting_config.tokens_claimed)
            .burnt(vesting_config.tokens_burnt)
            .total_allocation(participant_allocation)
            .vesting_plan(vesting_plan.periods.clone())
            .build();

        calculator.recalculate_plan(vesting_plan.periods.clone());
        calculator
    }

    pub(super) fn get_participant_allocation(
        vesting_config: &VestingConfig,
        bucket_data: &BucketData,
    ) -> u64 {
        match vesting_config.vesting_type {
            Some(VestingType::DepositBased { deposit }) => deposit
                .checked_div(bucket_data.total_deposit)
                .and_then(|mul| mul.checked_mul(bucket_data.bucket_supply))
                .expect("Overflow calculating allocation"),
            Some(VestingType::Deterministic { allocation }) => allocation,
            None => panic!("Vesting is not possible vesting type is not set"),
        }
    }
}

#[event]
pub struct DepositEvent {
    pub buyer: Pubkey,
    pub round: Round,
    pub quote_amount: u64,
    pub base_allocation: u64,
}

#[event]
pub struct ClaimEvent {
    pub buyer: Pubkey,
    pub bucket: String,
    pub vesting_plan: String,
    pub claim: u64,
    pub burn: u64,
}
