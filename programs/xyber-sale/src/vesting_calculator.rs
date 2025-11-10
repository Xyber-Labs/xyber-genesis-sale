use crate::data::{BucketData, VestingConfig, VestingPeriod, VestingPlan, VestingType};

#[derive(Debug)]
pub struct VestingCalculator {
    pub vesting_dates: Vec<u64>,
    pub allocation_plan: Vec<u64>,
    pub burn_plan: Vec<u64>,

    pub total_allocation: u64,
    pub tokens_claimed: u64,
    pub tokens_burnt: u64,
}

#[derive(Default)]
pub struct VestingConfigBuilder {
    pub vesting_plan: Vec<VestingPeriod>,
    pub total_allocation: u64,
    pub burnt: u64,
    pub claimed: u64,
    pub precision: u8,
}

#[cfg(test)]
#[derive(Default)]
struct VestingPlanBuilder {
    periods: Vec<VestingPeriod>,
}

impl VestingCalculator {
    pub fn builder() -> VestingConfigBuilder {
        VestingConfigBuilder::default()
    }

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
            Some(VestingType::Priceless { deposit }) => deposit
                .checked_div(bucket_data.total_deposit)
                .and_then(|mul| mul.checked_mul(bucket_data.bucket_supply))
                .expect("Overflow calculating allocation"),
            Some(VestingType::Deterministic { allocation }) => allocation,
            None => panic!("Vesting is not possible vesting type is not set"),
        }
    }

    pub fn recalculate_plan(&mut self, vesting_plan: Vec<VestingPeriod>) {
        let len = vesting_plan.len();
        let mut calc_base = vec![0; len];
        let mut to_allocate_sum = 0;
        let mut to_burn_sum = 0;
        for (i, period) in vesting_plan.iter().enumerate() {
            let b =
                period.base_period_index.map_or(self.total_allocation, |i| calc_base[i as usize]);

            to_allocate_sum += Self::mul_corrected(b, period.claim_ratio);
            to_burn_sum += Self::mul_corrected(b, period.burn_ratio);

            if i == len - 1 {
                if period.burn_ratio < period.claim_ratio {
                    to_allocate_sum += self
                        .total_allocation
                        .saturating_sub(to_allocate_sum)
                        .saturating_sub(to_burn_sum);
                } else {
                    to_burn_sum += self
                        .total_allocation
                        .saturating_sub(to_allocate_sum)
                        .saturating_sub(to_burn_sum);
                };
                calc_base[i] = 0;
            }

            calc_base[i] =
                self.total_allocation.saturating_sub(to_allocate_sum).saturating_sub(to_burn_sum);

            self.allocation_plan[i] = to_allocate_sum;
            self.burn_plan[i] = to_burn_sum;
        }
    }

    fn mul_corrected(value: u64, ratio: f64) -> u64 {
        static EPS: f64 = 1e-7;
        let mut mul = value as f64 * ratio;
        if (mul.round() - mul).abs() < EPS {
            mul = mul.round();
        }
        mul as u64
    }

    pub fn claim(&mut self, date: u64) -> u64 {
        let to_claim_at = self.to_claim_at(date);
        self.tokens_claimed += to_claim_at;
        to_claim_at
    }

    pub fn burn(&mut self, date: u64) -> u64 {
        let to_burn = self.to_burn_at(date);
        self.tokens_burnt += to_burn;
        to_burn
    }

    pub fn to_claim_at(&self, date: u64) -> u64 {
        self.allocation_plan
            .iter()
            .zip(self.vesting_dates.iter())
            .rfind(|(_, start_timestamp)| date >= **start_timestamp)
            .map_or(0, |(allowance, _)| allowance.saturating_sub(self.tokens_claimed))
    }

    pub fn to_burn_at(&self, date: u64) -> u64 {
        self.burn_plan
            .iter()
            .zip(self.vesting_dates.iter())
            .rfind(|(_, period)| date >= **period)
            .map_or(0, |(burn, _)| burn.saturating_sub(self.tokens_burnt))
    }
}

impl VestingConfigBuilder {
    pub fn total_allocation(mut self, allowed: u64) -> Self {
        self.total_allocation = allowed;
        self
    }

    pub fn vesting_plan(mut self, plan: Vec<VestingPeriod>) -> Self {
        self.vesting_plan = plan;
        self
    }

    pub fn build(self) -> VestingCalculator {
        let mut config = VestingCalculator {
            tokens_claimed: self.claimed,
            tokens_burnt: self.burnt,
            allocation_plan: vec![0; self.vesting_plan.len()],
            burn_plan: vec![0; self.vesting_plan.len()],
            total_allocation: self.total_allocation * 10_u64.pow(self.precision as u32),
            vesting_dates: self.vesting_plan.iter().map(|p| p.start_timestamp).collect(),
        };
        config.recalculate_plan(self.vesting_plan);
        config
    }

    pub fn claimed(mut self, claimed: u64) -> Self {
        self.claimed = claimed;
        self
    }

    pub fn burnt(mut self, burnt: u64) -> Self {
        self.burnt = burnt;
        self
    }
}

#[cfg(test)]
impl VestingPlanBuilder {
    fn new() -> VestingPlanBuilder {
        VestingPlanBuilder::default()
    }

    fn period(mut self, date: u64, claim: f64, burn: f64, base: Option<u8>) -> Self {
        self.periods.push(VestingPeriod {
            start_timestamp: date,
            claim_ratio: claim,
            burn_ratio: burn,
            base_period_index: base,
        });
        self
    }

    fn build(self) -> Vec<VestingPeriod> {
        self.periods
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_availability_at() {
        let mut vesting_config = VestingCalculator::builder()
            .vesting_plan(
                VestingPlanBuilder::new()
                    .period(1736967600, 0.300000, 0.0, None)
                    .period(1736977600, 0.3333333333, 0.0, Some(0))
                    .period(1736987600, 0.3333333333, 0.0, Some(0))
                    .period(1736997600, 0.3333333333, 0.0, Some(0))
                    .build(),
            )
            .total_allocation(1000)
            .build();

        assert_eq!(0, vesting_config.to_claim_at(1736900000));
        assert_eq!(0, vesting_config.to_claim_at(1736967599));
        assert_eq!(300, vesting_config.to_claim_at(1736967600));
        assert_eq!(300, vesting_config.to_claim_at(1736977599));
        assert_eq!(533, vesting_config.to_claim_at(1736977600));
        assert_eq!(533, vesting_config.to_claim_at(1736987599));
        assert_eq!(766, vesting_config.to_claim_at(1736987600));
        assert_eq!(766, vesting_config.to_claim_at(1736997599));
        assert_eq!(1000, vesting_config.to_claim_at(1736997600));
        assert_eq!(1000, vesting_config.to_claim_at(2736997599));

        assert_eq!(533, vesting_config.claim(1736987599));

        assert_eq!(0, vesting_config.to_claim_at(1736900000));
        assert_eq!(0, vesting_config.to_claim_at(1736967599));
        assert_eq!(0, vesting_config.to_claim_at(1736967600));
        assert_eq!(0, vesting_config.to_claim_at(1736977599));
        assert_eq!(233, vesting_config.to_claim_at(1736987600));
        assert_eq!(233, vesting_config.to_claim_at(1736997599));
        assert_eq!(467, vesting_config.to_claim_at(1736997600));
        assert_eq!(467, vesting_config.to_claim_at(2736997599));

        assert_eq!(0, vesting_config.claim(1736967550));
        assert_eq!(0, vesting_config.claim(1736977599));

        assert_eq!(233, vesting_config.claim(1736995000));

        assert_eq!(0, vesting_config.claim(1736997599));
        assert_eq!(234, vesting_config.to_claim_at(1736997600));
        assert_eq!(234, vesting_config.to_claim_at(2737007599));
        assert_eq!(234, vesting_config.claim(2737007599));
    }

    #[test]
    fn test_burn_at() {
        let mut vesting_config = VestingCalculator::builder()
            .vesting_plan(
                VestingPlanBuilder::new()
                    .period(1736967600, 0.0, 0.3, None)
                    .period(1736977600, 0.0, 0.33333333, Some(0))
                    .period(1736987600, 0.0, 0.33333333, Some(0))
                    .period(1736997600, 0.0, 0.33333333, Some(0))
                    .build(),
            )
            .total_allocation(1000)
            .build();

        assert_eq!(0, vesting_config.to_claim_at(1736967600));
        assert_eq!(300, vesting_config.to_burn_at(1736967600));

        assert_eq!(0, vesting_config.to_burn_at(1736900000));
        assert_eq!(0, vesting_config.to_burn_at(1736967599));
        assert_eq!(300, vesting_config.to_burn_at(1736967600));
        assert_eq!(300, vesting_config.to_burn_at(1736977599));
        assert_eq!(533, vesting_config.to_burn_at(1736977600));
        assert_eq!(533, vesting_config.to_burn_at(1736987599));
        assert_eq!(766, vesting_config.to_burn_at(1736987600));
        assert_eq!(766, vesting_config.to_burn_at(1736997599));
        assert_eq!(1000, vesting_config.to_burn_at(1736997600));
        assert_eq!(1000, vesting_config.to_burn_at(2736997599));

        assert_eq!(0, vesting_config.to_claim_at(1736977599));
        assert_eq!(0, vesting_config.to_claim_at(1736977600));
        assert_eq!(0, vesting_config.to_claim_at(1736987599));
        assert_eq!(0, vesting_config.to_claim_at(1736987600));
        assert_eq!(0, vesting_config.to_claim_at(1736997599));
        assert_eq!(0, vesting_config.to_claim_at(1736997600));

        assert_eq!(533, vesting_config.burn(1736987599));

        assert_eq!(0, vesting_config.to_burn_at(1736967600));
        assert_eq!(0, vesting_config.to_burn_at(1736977599));
        assert_eq!(0, vesting_config.to_burn_at(1736977600));
        assert_eq!(0, vesting_config.to_burn_at(1736987599));

        assert_eq!(233, vesting_config.to_burn_at(1736987600));
        assert_eq!(233, vesting_config.to_burn_at(1736997599));
        assert_eq!(467, vesting_config.to_burn_at(1736997600));
        assert_eq!(467, vesting_config.to_burn_at(2736997599));
    }

    #[test]
    fn test_once_65() {
        let mut vesting_config = VestingCalculator::builder()
            .vesting_plan(
                VestingPlanBuilder::new()
                    .period(1737313201, 0.3, 0.0, None)
                    .period(1739991600, 0.65, 0.35, Some(0))
                    .build(),
            )
            .total_allocation(1000)
            .build();

        assert_eq!(300, vesting_config.to_claim_at(1737313201));
        assert_eq!(0, vesting_config.to_burn_at(1737313201));
        assert_eq!(300, vesting_config.claim(1737313201));
        assert_eq!(455, vesting_config.to_claim_at(1739991600));
        assert_eq!(245, vesting_config.to_burn_at(1739991600));
    }

    #[test]
    fn test_team33() {
        let mut vesting_config = VestingCalculator::builder()
            .vesting_plan(
                VestingPlanBuilder::new()
                    .period(1738230676, 0.333333333333, 0.0, None)
                    .period(1738230686, 0.333333333333, 0.0, None)
                    .period(1738230696, 0.333333333333, 0.0, None)
                    .build(),
            )
            .total_allocation(10000000000000)
            .build();

        assert_eq!(3333333333330, vesting_config.claim(1738230683));
        assert_eq!(0, vesting_config.claim(1738230683));
        assert_eq!(3333333333330, vesting_config.claim(1738230693));
        assert_eq!(0, vesting_config.claim(1738230693));
        assert_eq!(3333333333340, vesting_config.claim(1738230703));
        assert_eq!(0, vesting_config.claim(1738230703));
    }

    #[test]
    fn test_team33_after_reload() {
        let mut vesting_config = VestingCalculator::builder()
            .vesting_plan(
                VestingPlanBuilder::new()
                    .period(1738232368, 0.333333333333, 0.0, None)
                    .period(1738232383, 0.333333333333, 0.0, None)
                    .period(1738232403, 0.333333333333, 0.0, None)
                    .build(),
            )
            .total_allocation(10000000000000)
            .claimed(6666666666666)
            .build();
        assert_eq!(3333333333334, vesting_config.claim(1738232405));
    }
}
