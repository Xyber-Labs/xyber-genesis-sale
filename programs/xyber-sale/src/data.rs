use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq, InitSpace)]
pub enum Round {
    #[default]
    Public,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum BucketVestingType {
    Deterministic,
    Priceless,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VestingType {
    Deterministic { allocation: u64 },
    Priceless { deposit: u64 },
}

impl Round {
    pub fn as_bytes(&self) -> &[u8] {
        match self {
            Round::Public => b"PUBLIC",
        }
    }
}

#[account]
#[derive(Default, InitSpace)]
pub struct SaleConfig {
    pub admin: Pubkey,
    pub base_mint: Pubkey,
    pub multisig: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct QuoteConfig {
    pub price: i64,
    pub expo: i32,
    pub update_allowed_at: i64,
    pub is_enabled: bool,
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

#[event]
pub struct DepositEvent {
    pub buyer: Pubkey,
    pub round: Round,
    pub sol_amount: u64,
}

#[event]
pub struct ClaimEvent {
    pub buyer: Pubkey,
    pub bucket: String,
    pub vesting_plan: String,
    pub claim: u64,
    pub burn: u64,
}
