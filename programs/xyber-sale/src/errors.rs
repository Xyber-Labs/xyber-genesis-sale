use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Invalid admin account is provided")]
    InvalidAdmin,
    #[msg("Invalid backend account is provided")]
    InvalidBackend,
    #[msg("Invalid base mint is provided")]
    InvalidBaseMint,
    #[msg("Invalid quote mint is provided")]
    InvalidQuoteMint,
    #[msg("Bucket supply exceeded")]
    BucketSupplyExceeded,
    #[msg("Signature is expired")]
    SignatureExpired,
    #[msg("Round is not started")]
    RoundNotStarted,
    #[msg("Round is finished")]
    RoundFinished,
}
