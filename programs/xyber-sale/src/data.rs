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
    pub pending_multisig: Pubkey,
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

impl VestingPlan {
    pub fn is_valid(&self) -> bool {
        let periods = &self.periods;
        if periods.len() > 24 || periods.is_empty() {
            return false;
        }

        let mut prev_base: Option<u8> = None;
        for (i, p) in periods.iter().enumerate() {
            if p.claim_ratio + p.burn_ratio == 0.0 {
                return false;
            }
            if p.base_period_index < prev_base {
                return false;
            }
            if let Some(base_period) = p.base_period_index {
                if prev_base.is_none() && base_period != 0 {
                    return false;
                }
                if usize::from(base_period) >= i {
                    return false;
                }
            }
            prev_base = p.base_period_index;
        }

        let last_base = periods.last().expect("Expected to have one period").base_period_index;
        let sum: f64 = periods
            .iter()
            .filter(|p| p.base_period_index == last_base)
            .map(|p| p.claim_ratio + p.burn_ratio)
            .sum();
        if (sum - 1.0).abs() > 1e-6 {
            return false;
        }

        true
    }
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

#[cfg(test)]
mod tests {
    use super::{VestingPeriod, VestingPlan};

    fn period(base: Option<u8>) -> VestingPeriod {
        VestingPeriod {
            start_timestamp: 1_000_000,
            claim_ratio: 0.5,
            burn_ratio: 0.4,
            base_period_index: base,
        }
    }

    fn period_r(claim: f64, burn: f64, base: Option<u8>) -> VestingPeriod {
        VestingPeriod {
            start_timestamp: 1_000_000,
            claim_ratio: claim,
            burn_ratio: burn,
            base_period_index: base,
        }
    }

    fn plan(periods: Vec<VestingPeriod>) -> VestingPlan {
        VestingPlan { periods }
    }

    #[test]
    fn valid_single_period() {
        let p = plan(vec![period_r(0.6, 0.4, None)]);
        assert!(p.is_valid());
    }

    #[test]
    fn valid_multiple_periods() {
        let p = plan(vec![
            period_r(0.3, 0.0, None),
            period_r(0.5, 0.1, Some(0)),
            period_r(0.2, 0.2, Some(0)),
        ]);
        assert!(p.is_valid());
    }

    #[test]
    fn invalid_empty() {
        let p = plan(vec![]);
        assert!(!p.is_valid());
    }

    #[test]
    fn invalid_exceeds_max_periods() {
        let mut periods = vec![period(None)];
        for _ in 0..24 {
            periods.push(period(Some(0)));
        }
        assert_eq!(periods.len(), 25);
        let p = plan(periods);
        assert!(!p.is_valid());
    }

    #[test]
    fn valid_at_max_periods() {
        let r = 1.0 / 23.0;
        let mut periods = vec![period_r(0.3, 0.0, None)];
        for _ in 0..23 {
            periods.push(period_r(r, 0.0, Some(0)));
        }
        assert_eq!(periods.len(), 24);
        let p = plan(periods);
        assert!(p.is_valid());
    }

    #[test]
    fn invalid_first_period_has_base() {
        // base_period_index Some(0) at index 0 means base >= i, invalid
        let p = plan(vec![period(Some(0)), period(Some(0))]);
        assert!(!p.is_valid());
    }

    #[test]
    fn valid_multiple_none_periods() {
        let p = plan(vec![
            period_r(0.3, 0.0, None),
            period_r(0.3, 0.0, None),
            period_r(0.2, 0.2, None),
        ]);
        assert!(p.is_valid());
    }

    #[test]
    fn valid_none_then_some() {
        let p = plan(vec![
            period_r(0.3, 0.0, None),
            period_r(0.3, 0.0, None),
            period_r(0.6, 0.4, Some(0)),
        ]);
        assert!(p.is_valid());
    }

    #[test]
    fn invalid_some_then_none() {
        // Some(0) -> None breaks ascending order
        let p = plan(vec![period(None), period(Some(0)), period(None)]);
        assert!(!p.is_valid());
    }

    #[test]
    fn invalid_base_period_equals_own_index() {
        let p = plan(vec![period(None), period(Some(1))]);
        assert!(!p.is_valid());
    }

    #[test]
    fn invalid_base_period_greater_than_own_index() {
        let p = plan(vec![period(None), period(Some(5))]);
        assert!(!p.is_valid());
    }

    #[test]
    fn valid_chain_of_references() {
        let p = plan(vec![
            period_r(0.3, 0.0, None),
            period_r(0.5, 0.0, Some(0)),
            period_r(0.5, 0.0, Some(1)),
            period_r(0.6, 0.4, Some(2)),
        ]);
        assert!(p.is_valid());
    }

    #[test]
    fn invalid_base_period_not_ascending() {
        let p = plan(vec![
            period(None),
            period(Some(0)),
            period(Some(1)),
            period(Some(0)),
        ]);
        assert!(!p.is_valid());
    }

    #[test]
    fn invalid_first_period_not_none() {
        let p = plan(vec![period(Some(0)), period(Some(0))]);
        assert!(!p.is_valid());
    }

    #[test]
    fn invalid_some_skips_zero_after_none() {
        let p = plan(vec![period(None), period(None), period(Some(1))]);
        assert!(!p.is_valid());
    }

    #[test]
    fn valid_last_period_ratio_sums_to_one() {
        let p = plan(vec![
            period_r(0.3, 0.0, None),
            period_r(0.5, 0.0, Some(0)),
            period_r(0.4, 0.1, Some(0)),
        ]);
        assert!(p.is_valid());
    }

    #[test]
    fn invalid_last_period_ratio_not_one() {
        let p = plan(vec![
            period_r(0.3, 0.0, None),
            period_r(0.3, 0.0, Some(0)),
            period_r(0.3, 0.0, Some(0)),
        ]);
        assert!(!p.is_valid());
    }

    #[test]
    fn invalid_zero_ratio_period() {
        let p = plan(vec![
            period_r(0.3, 0.0, None),
            period_r(0.0, 0.0, Some(0)),
            period_r(0.6, 0.4, Some(0)),
        ]);
        assert!(!p.is_valid());
    }
}
