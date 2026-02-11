use anchor_lang::prelude::*;

use crate::{
    constants::{CONFIG_SEED, DEPLOYER, SEED_ROOT},
    data::SaleConfig,
    errors::CustomError,
};

#[derive(Accounts)]
pub struct ProposeMultisig<'info> {
    #[account(
        signer,
        mut,
        constraint = config.multisig != Pubkey::default() && config.multisig == authority.key() ||
                     config.multisig == Pubkey::default() && authority.key() == DEPLOYER @ CustomError::InvalidAdmin
    )]
    pub authority: Signer<'info>,

    #[account(mut, seeds = [SEED_ROOT, CONFIG_SEED], bump)]
    pub config: Box<Account<'info, SaleConfig>>,
}

pub fn propose_multisig(ctx: Context<ProposeMultisig>, new_multisig: Pubkey) -> Result<()> {
    require!(new_multisig != Pubkey::default(), CustomError::InvalidPendingMultisig);
    let config = &mut ctx.accounts.config;
    config.pending_multisig = new_multisig;

    Ok(())
}

#[derive(Accounts)]
pub struct AcceptMultisig<'info> {
    #[account(signer, address = config.pending_multisig @ CustomError::InvalidPendingMultisig)]
    pub new_multisig: Signer<'info>,

    #[account(mut, seeds = [SEED_ROOT, CONFIG_SEED], bump)]
    pub config: Box<Account<'info, SaleConfig>>,
}

pub fn accept_multisig(ctx: Context<AcceptMultisig>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.multisig = config.pending_multisig;
    config.pending_multisig = Pubkey::default();

    Ok(())
}
