use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Invalid admin account is provided")]
    InvalidAdmin,
    #[msg("Invalid base mint is provided")]
    InvalidBaseMint,
    #[msg("Invalid quote mint is provided")]
    InvalidQuoteMint,
    #[msg("Bucket supply exceeded")]
    BucketSupplyExceeded,
    #[msg("Round is not started")]
    RoundNotStarted,
    #[msg("Round is finished")]
    RoundFinished,
    #[msg("Unexpected vesting plan for bucket")]
    UnexpectedVestingPlan,
    #[msg("Claim unavailable")]
    ClaimUnavailable,
    #[msg("Allocation overflowed")]
    AllocationOverflowed,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Insufficient bucket supply")]
    InsufficientBucketSupply,
    #[msg("Cooldown period not passed")]
    CooldownPeriodNotPassed,
    #[msg("Bad params")]
    BadParams,
    #[msg("Invalid bucket vesting type")]
    InvalidBucketVestingType,
}
