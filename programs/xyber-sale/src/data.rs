use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Round {
    Public,
}

impl Default for Round {
    fn default() -> Self {
        Round::Public
    }
}

impl Round {
    pub fn as_bytes(&self) -> &[u8] {
        match self {
            Round::Public => b"PUBLIC",
        }
    }
}

#[account]
#[derive(Default, InitSpace)]
pub struct SaleConfig {
    pub admin: Pubkey,
    pub backend: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub multisig: Option<Pubkey>,
}

#[account]
#[derive(Default, InitSpace)]
pub struct RoundConfig {
    pub start_time: i64,
    pub end_time: i64,
}
