use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke, system_instruction},
    system_program::System,
};
use anchor_spl::token_interface::Mint;

use crate::{
    constants::{SALE_BUCKET_SEED, SEED_ROOT},
    data::{BucketData, DepositEvent, Round, RoundConfig, SaleConfig, VestingConfig},
    errors::CustomError,
};

use super::{get_order_price, update_vesting_config, validate_round};

#[derive(Accounts)]
#[instruction(round: Round)]
pub struct DepositSol<'info> {
    #[account(signer, mut)]
    pub buyer: Signer<'info>,

    #[account(signer, address = config.backend @ CustomError::InvalidBackend)]
    pub backend: Signer<'info>,

    #[account(seeds = [SEED_ROOT, b"CONFIG"], bump)]
    pub config: Box<Account<'info, SaleConfig>>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + VestingConfig::INIT_SPACE,
        seeds = [SEED_ROOT, b"VESTING_CONFIG", round.as_bytes(), buyer.key().as_ref()],
        bump
    )]
    pub vesting_config: Box<Account<'info, VestingConfig>>,

    #[account(seeds = [SEED_ROOT, b"ROUND", round.as_bytes()], bump)]
    pub round_config: Box<Account<'info, RoundConfig>>,

    /// CHECK
    #[account(mut, seeds = [SEED_ROOT, b"BUCKET_POOL", SALE_BUCKET_SEED], bump)]
    pub bucket_pool: UncheckedAccount<'info>,

    #[account(address = config.base_mint @ CustomError::InvalidBaseMint)]
    pub base_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(address = config.quote_mint @ CustomError::InvalidQuoteMint)]
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut, seeds = [SEED_ROOT, b"BUCKET", round.as_bytes()], bump)]
    pub bucket_data: Box<Account<'info, BucketData>>,

    pub system_program: Program<'info, System>,
}

pub fn deposit_sol(
    ctx: Context<DepositSol>,
    _round: Round,
    sol_price: u128,
    base_allocation: u64,
    expiration: i64,
) -> Result<()> {
    let round_config = &ctx.accounts.round_config;
    validate_round(round_config, expiration)?;

    let base_decimals = ctx.accounts.base_mint.decimals as u32;
    let order_price = get_order_price(round_config.price, base_allocation, base_decimals);
    let lamports = get_order_lamports(order_price, sol_price, ctx.accounts.quote_mint.decimals);

    let buyer = ctx.accounts.buyer.key();
    invoke(
        &system_instruction::transfer(&buyer, &ctx.accounts.bucket_pool.key(), lamports),
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.bucket_pool.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    update_vesting_config(
        &mut ctx.accounts.vesting_config,
        &mut ctx.accounts.bucket_data,
        base_allocation,
        order_price,
    )?;

    emit!(DepositEvent {
        buyer: ctx.accounts.buyer.key(),
        round: _round,
        quote_amount: order_price,
        base_allocation,
    });

    Ok(())
}

const SOL_DECIMALS: u8 = 9;
const PRICE_DECIMALS: u8 = 18;

fn get_order_lamports(order_price: u64, sol_price: u128, quote_decimals: u8) -> u64 {
    let adjustment_decimals = PRICE_DECIMALS + SOL_DECIMALS - quote_decimals;
    let adjustment_value = 10_u128.pow(adjustment_decimals.into());

    let order_price_lamports = (order_price as u128)
        .checked_mul(adjustment_value)
        .and_then(|v| v.checked_div(sol_price))
        .expect("Error in get_order_lamports calculation");

    u64::try_from(order_price_lamports).expect("Overflow in get_order_lamports")
}
