use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct SaleConfig {
    pub admin: Pubkey,
    // pub backend: Pubkey,
    // pub token_mint: Pubkey,
    // pub asset_mint: Pubkey,
    pub owner: Option<Pubkey>,
}
