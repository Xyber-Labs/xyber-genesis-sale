use anchor_lang::prelude::*;

mod constants;
mod data;
pub mod errors;
mod events;
mod instructions;

use instructions::*;

declare_id!("XYBGKPCgL6Twhdjo6LFt9niCgyxnbxN3tacXypc6SSt");

#[program]
pub mod xyber_sale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey, owner: Pubkey) -> Result<()> {
        instructions::initialize(ctx, new_admin, owner)
    }
}
