use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants::{DEPLOYER, SALE_BUCKET_SEED, SEED_ROOT},
    data::SaleConfig,
    errors::CustomError,
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(signer, mut, constraint = config.multisig.is_some() && config.multisig == Some(admin.key()) || config.multisig.is_none() && admin.key() == DEPLOYER @ CustomError::InvalidAdmin)]
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
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

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

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = quote_mint,
        associated_token::authority = bucket_pool,
        associated_token::token_program = token_program,
    )]
    pub bucket_pool_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey, backend: Pubkey, multisig: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = new_admin;
    config.multisig = Some(multisig);

    config.base_mint = ctx.accounts.base_mint.key();
    config.quote_mint = ctx.accounts.quote_mint.key();
    config.backend = backend;

    Ok(())
}
