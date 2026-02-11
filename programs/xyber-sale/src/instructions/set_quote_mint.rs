use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants::{BUCKET_POOL_SEED, CONFIG_SEED, QUOTE_SEED, SALE_BUCKET_SEED, SEED_ROOT},
    data::{QuoteConfig, SaleConfig},
    errors::CustomError,
};

use super::{MAX_EXPO, MAX_PRICE, MIN_EXPO};

const COOLDOWN_PERIOD: i64 = 24 * 60 * 60;

#[derive(Accounts)]
pub struct SetQuoteMint<'info> {
    #[account(signer, mut, address = config.multisig @ CustomError::InvalidAdmin)]
    pub multisig: Signer<'info>,

    #[account(seeds = [SEED_ROOT, CONFIG_SEED], bump)]
    pub config: Box<Account<'info, SaleConfig>>,

    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = multisig,
        space = 8 + QuoteConfig::INIT_SPACE,
        seeds = [SEED_ROOT, QUOTE_SEED, quote_mint.key().as_ref()],
        bump,
        constraint =
            quote_config.update_allowed_at == 0 ||
            Clock::get()?.unix_timestamp >= quote_config.update_allowed_at @
            CustomError::CooldownPeriodNotPassed)]
    pub quote_config: Box<Account<'info, QuoteConfig>>,

    /// CHECK: Bucket pool PDA
    #[account(seeds = [SEED_ROOT, BUCKET_POOL_SEED, SALE_BUCKET_SEED], bump)]
    pub bucket_pool: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = multisig,
        associated_token::mint = quote_mint,
        associated_token::authority = bucket_pool,
        associated_token::token_program = token_program,
    )]
    pub quote_pool_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn set_quote_mint(
    ctx: Context<SetQuoteMint>,
    price: i64,
    expo: i32,
    is_enabled: bool,
) -> Result<()> {
    require!(price > 0 && price <= MAX_PRICE, CustomError::BadParams);
    require!((MIN_EXPO..=MAX_EXPO).contains(&expo), CustomError::BadParams);
    let quote_config = &mut ctx.accounts.quote_config;
    let clock = Clock::get()?;

    quote_config.price = price;
    quote_config.expo = expo;
    quote_config.update_allowed_at = clock.unix_timestamp + COOLDOWN_PERIOD;
    quote_config.is_enabled = is_enabled;

    Ok(())
}
