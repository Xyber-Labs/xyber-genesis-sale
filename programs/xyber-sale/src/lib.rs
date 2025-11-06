use anchor_lang::prelude::*;

use instructions::*;

mod constants;
mod data;
mod errors;
mod events;
mod instructions;

declare_id!("XYBGKPCgL6Twhdjo6LFt9niCgyxnbxN3tacXypc6SSt");

#[program]
pub mod xyber_sale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey, backend: Pubkey, multisig: Pubkey) -> Result<()> {
        instructions::initialize(ctx, new_admin, backend, multisig)
    }
}
