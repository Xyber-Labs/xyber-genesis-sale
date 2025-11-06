use anchor_lang::prelude::*;

use crate::{
    constants::{DEPLOYER, SEED_ROOT},
    data::SaleConfig,
    errors::CustomError,
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(signer, mut, constraint = config.owner.is_some() && config.owner == Some(admin.key()) || config.owner.is_none() && admin.key() == DEPLOYER @ CustomError::InvalidAdmin)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + SaleConfig::INIT_SPACE,
        seeds = [SEED_ROOT, b"CONFIG"],
        bump
    )]
    pub config: Box<Account<'info, SaleConfig>>,
    // base_mint: Box<InterfaceAccount<'info, Mint>>,
    // quote_mint: Box<InterfaceAccount<'info, Mint>>,
    //
    // /// CHECK
    // #[account(
    //     init_if_needed,
    //     payer = admin,
    //     space = 0,
    //     seeds = [SEED_ROOT, b"BUCKET_POOL", SALE_BUCKET_SEED],
    //     owner = System::id(),
    //     bump
    // )]
    // bucket_pool: UncheckedAccount<'info>,
    //
    // #[account(
    //     init_if_needed,
    //     payer = admin,
    //     associated_token::mint = asset_mint,
    //     associated_token::authority = bucket_pool,
    //     associated_token::token_program = token_program,
    // )]
    // bucket_pool_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    //
    pub system_program: Program<'info, System>,
    // token_program: Interface<'info, TokenInterface>,
    // associated_token_program: Program<'info, AssociatedToken>,
}

pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey, owner: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = new_admin;
    config.owner = Some(owner);
    Ok(())
}
