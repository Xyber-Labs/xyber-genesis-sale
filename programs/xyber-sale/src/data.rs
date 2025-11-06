use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Round {
    Public,
}

impl Default for Round {
    fn default() -> Self {
        Round::Public
    }
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
    pub price: u64,
    pub start_time: i64,
    pub end_time: i64,
}

#[account]
#[derive(InitSpace)]
pub struct VestingConfig {
    #[max_len(40)]
    pub vesting_plan: Option<String>,
    pub total_allocation: u64,
    pub tokens_claimed: u64,
    pub tokens_burnt: u64,
}

#[account]
#[derive(Default, InitSpace)]
pub struct BucketData {
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
    #[max_len(12)]
    pub periods: Vec<VestingPeriod>,
}

#[event]
pub struct DepositEvent {
    pub buyer: Pubkey,
    pub round: Round,
    pub quote_amount: u64,
    pub base_allocation: u64,
}
