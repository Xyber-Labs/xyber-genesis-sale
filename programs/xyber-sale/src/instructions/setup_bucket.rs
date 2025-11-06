use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants::SEED_ROOT,
    data::{BucketData, SaleConfig},
    errors::CustomError,
};

#[derive(Accounts)]
#[instruction(bucket_name: String)]
pub struct SetupBucket<'info> {
    #[account(signer, mut, address = config.admin @ CustomError::InvalidAdmin)]
    pub admin: Signer<'info>,

    #[account(seeds = [SEED_ROOT, b"CONFIG"], bump)]
    pub config: Box<Account<'info, SaleConfig>>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + BucketData::INIT_SPACE,
        seeds = [SEED_ROOT, b"BUCKET", bucket_name.as_bytes()],
        bump
    )]
    pub bucket: Box<Account<'info, BucketData>>,

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = base_mint,
        associated_token::authority = bucket,
        associated_token::token_program = token_program,
    )]
    pub bucket_base_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, address = config.base_mint @ CustomError::InvalidBaseMint)]
    pub base_mint: Box<InterfaceAccount<'info, Mint>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn setup_bucket(
    ctx: Context<SetupBucket>,
    _bucket_name: String,
    bucket_data: BucketData,
) -> Result<()> {
    ctx.accounts.bucket.set_inner(bucket_data);
    Ok(())
}
