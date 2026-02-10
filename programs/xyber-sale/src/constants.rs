use anchor_lang::prelude::*;

#[constant]
pub const SEED_ROOT: &[u8] = b"ROOT";

#[constant]
pub const SALE_BUCKET_SEED: &[u8] = b"SALE";

#[constant]
pub const BUCKET_SEED: &[u8] = b"BUCKET";

#[constant]
pub const BUCKET_POOL_SEED: &[u8] = b"BUCKET_POOL";

#[constant]
pub const QUOTE_SEED: &[u8] = b"QUOTE";

#[cfg(feature = "localnet")]
#[constant]
pub const DEPLOYER: Pubkey = pubkey!("ANikp9qHf2CFyEdgvh9iuZRMw6eLaTaEbCKB8i1nbfNg");

#[cfg(not(feature = "localnet"))]
#[constant]
pub const DEPLOYER: Pubkey = pubkey!("keeppCujRWx7HW8AgCL3F9CfaAM2hRKvWvNVo6iGToE");
