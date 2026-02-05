use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{
    constants::{DEPLOYER, SALE_BUCKET_SEED, SEED_ROOT},
    data::SaleConfig,
    errors::CustomError,
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(signer, mut, constraint = config.multisig != Pubkey::default() && config.multisig == admin.key() || config.multisig == Pubkey::default() && admin.key() == DEPLOYER @ CustomError::InvalidAdmin)]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + SaleConfig::INIT_SPACE,
        seeds = [SEED_ROOT, b"CONFIG"],
        bump
    )]
    pub config: Box<Account<'info, SaleConfig>>,
    pub base_mint: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK
    #[account(
        init_if_needed,
        payer = admin,
        space = 0,
        seeds = [SEED_ROOT, b"BUCKET_POOL", SALE_BUCKET_SEED],
        owner = System::id(),
        bump
    )]
    pub bucket_pool: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey, multisig: Pubkey) -> Result<()> {
    require!(multisig != Pubkey::default(), CustomError::BadParams);
    require!(new_admin != Pubkey::default(), CustomError::BadParams);
    let config = &mut ctx.accounts.config;
    config.admin = new_admin;
    config.multisig = multisig;
    config.base_mint = ctx.accounts.base_mint.key();

    Ok(())
}
