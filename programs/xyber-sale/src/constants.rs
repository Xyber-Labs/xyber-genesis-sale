use anchor_lang::prelude::*;

#[constant]
pub const SEED_ROOT: &[u8] = b"ROOT-0";

#[constant]
pub const CONFIG_SEED: &[u8] = b"CONFIG";

#[constant]
pub const BUCKET_DATA_SEED: &[u8] = b"BUCKET";

#[constant]
pub const BUCKET_POOL_SEED: &[u8] = b"BUCKET_POOL";

#[constant]
pub const QUOTE_SEED: &[u8] = b"QUOTE";

#[constant]
pub const ROUND_SEED: &[u8] = b"ROUND";

#[constant]
pub const VESTING_CONFIG_SEED: &[u8] = b"VESTING_CONFIG";

#[constant]
pub const VESTING_PLAN_SEED: &[u8] = b"VESTING_PLAN";

#[constant]
pub const SALE_BUCKET_SEED: &[u8] = b"SALE";

#[cfg(feature = "localnet")]
#[constant]
pub const DEPLOYER: Pubkey = pubkey!("ANikp9qHf2CFyEdgvh9iuZRMw6eLaTaEbCKB8i1nbfNg");

#[cfg(not(feature = "localnet"))]
#[constant]
pub const DEPLOYER: Pubkey = pubkey!("keeppCujRWx7HW8AgCL3F9CfaAM2hRKvWvNVo6iGToE");

#[cfg(feature = "check-mint")]
#[constant]
pub const XYBER_MINT: Pubkey = pubkey!("xybERnaFYSEYwfmqcCT3k3X6EpBG1Kz5rCJwmrcyCCL");

#[cfg(not(feature = "check-mint"))]
#[constant]
pub const XYBER_MINT: Pubkey = Pubkey::new_from_array([0u8; 32]);
