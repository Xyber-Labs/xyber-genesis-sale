use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Invalid admin account is provided")]
    InvalidAdmin,
    #[msg("Invalid base mint is provided")]
    InvalidBaseMint,
}
