use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct SaleConfig {
    pub admin: Pubkey,
    pub backend: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub multisig: Option<Pubkey>,
}
