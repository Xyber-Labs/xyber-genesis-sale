use anchor_lang::{prelude::*, system_program::System};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked},
};

use crate::{
    constants::{
        BUCKET_DATA_SEED, BUCKET_POOL_SEED, CONFIG_SEED, QUOTE_SEED, ROUND_SEED, SALE_BUCKET_SEED,
        SEED_ROOT, VESTING_CONFIG_SEED,
    },
    data::{
        BucketData, BucketVestingType, DepositEvent, QuoteConfig, Round, RoundConfig, SaleConfig,
        VestingConfig,
    },
    errors::CustomError,
};

use super::{MAX_EXPO, MAX_PRICE, MIN_EXPO, update_allocation};

#[derive(Accounts)]
#[instruction(round: Round)]
pub struct DepositAsset<'info> {
    #[account(signer, mut)]
    pub buyer: Signer<'info>,

    #[account(seeds = [SEED_ROOT, CONFIG_SEED], bump)]
    pub config: Box<Account<'info, SaleConfig>>,

    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(seeds = [SEED_ROOT, QUOTE_SEED, quote_mint.key().as_ref()], bump, constraint = quote_config.is_enabled @ CustomError::InvalidQuoteMint)]
    pub quote_config: Box<Account<'info, QuoteConfig>>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + VestingConfig::INIT_SPACE,
        seeds = [SEED_ROOT, VESTING_CONFIG_SEED, round.as_bytes(), buyer.key().as_ref()],
        bump
    )]
    pub vesting_config: Box<Account<'info, VestingConfig>>,

    #[account(seeds = [SEED_ROOT, ROUND_SEED, round.as_bytes()], bump)]
    pub round_config: Box<Account<'info, RoundConfig>>,

    #[account(
        mut,
        associated_token::mint = quote_mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_quote_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: Bucket pool PDA
    #[account(mut, seeds = [SEED_ROOT, BUCKET_POOL_SEED, SALE_BUCKET_SEED], bump)]
    pub bucket_pool: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = quote_mint,
        associated_token::authority = bucket_pool,
        associated_token::token_program = token_program,
    )]
    pub quote_pool_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_ROOT, BUCKET_DATA_SEED, round.as_bytes()],
        bump,
        constraint = bucket_data.vesting_type == Some(BucketVestingType::Priceless) @ CustomError::InvalidBucketVestingType
    )]
    pub bucket_data: Box<Account<'info, BucketData>>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn deposit_asset(ctx: Context<DepositAsset>, _round: Round, payment_amount: u64) -> Result<()> {
    let round_config = &ctx.accounts.round_config;
    let now = Clock::get()?.unix_timestamp;
    require!(now >= round_config.start_time, CustomError::RoundNotStarted);
    require!(round_config.end_time >= now, CustomError::RoundFinished);

    let transfer_accounts = TransferChecked {
        from: ctx.accounts.buyer_quote_ata.to_account_info(),
        mint: ctx.accounts.quote_mint.to_account_info(),
        to: ctx.accounts.quote_pool_ata.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    };

    let cpi = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts);
    transfer_checked(cpi, payment_amount, ctx.accounts.quote_mint.decimals)?;

    let sol_equivalent = convert_quote_to_sol(
        payment_amount,
        ctx.accounts.quote_config.price,
        ctx.accounts.quote_config.expo,
        ctx.accounts.quote_mint.decimals,
    );

    update_allocation(
        &mut ctx.accounts.vesting_config,
        &mut ctx.accounts.bucket_data,
        sol_equivalent,
    )?;

    emit!(DepositEvent {
        buyer: ctx.accounts.buyer.key(),
        round: _round,
        sol_amount: sol_equivalent,
    });

    Ok(())
}

fn convert_quote_to_sol(quote_amount: u64, price: i64, expo: i32, quote_decimals: u8) -> u64 {
    assert!(price > 0 && price <= MAX_PRICE, "price must be in range (0, {MAX_PRICE}]");
    assert!((MIN_EXPO..=MAX_EXPO).contains(&expo), "expo must be in range (-12, 0]");

    const SOL_DECIMALS: u32 = 9;
    let price_abs = price.unsigned_abs() as u128;
    let expo_abs = expo.unsigned_abs();

    let numerator = (quote_amount as u128)
        .checked_mul(10u128.pow(expo_abs))
        .and_then(|v| v.checked_mul(10u128.pow(SOL_DECIMALS)))
        .expect("Overflow in numerator");

    let denominator =
        price_abs.checked_mul(10u128.pow(quote_decimals as u32)).expect("Overflow in denominator");

    let sol_equivalent =
        numerator.checked_div(denominator).expect("Error in convert_quote_to_sol calculation");

    u64::try_from(sol_equivalent).expect("Overflow in convert_quote_to_sol")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decimals_6_expo_0_price_200() {
        // 1000 USDT (decimals=6), price=200, expo=0 → $200/SOL → 5 SOL
        let result = convert_quote_to_sol(1_000_000_000, 200, 0, 6);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn decimals_0_expo_0_price_200() {
        // 1000 tokens (decimals=0), price=200, expo=0 → $200/SOL → 5 SOL
        let result = convert_quote_to_sol(1_000, 200, 0, 0);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn decimals_9_expo_0_price_200() {
        // 1000 tokens (decimals=9), price=200, expo=0 → $200/SOL → 5 SOL
        let result = convert_quote_to_sol(1_000_000_000_000, 200, 0, 9);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn decimals_6_expo_neg8_pyth_200usd() {
        // 1000 USDT (decimals=6), Pyth: price=20_000_000_000, expo=-8 → $200/SOL → 5 SOL
        let result = convert_quote_to_sol(1_000_000_000, 20_000_000_000, -8, 6);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn decimals_6_expo_neg2() {
        // 1000 USDT (decimals=6), price=20_000, expo=-2 → $200/SOL → 5 SOL
        let result = convert_quote_to_sol(1_000_000_000, 20_000, -2, 6);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn decimals_0_expo_neg2() {
        // 1000 tokens (decimals=0), price=20_000, expo=-2 → $200/SOL → 5 SOL
        let result = convert_quote_to_sol(1_000, 20_000, -2, 0);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn decimals_0_expo_neg8_pyth_200usd() {
        // 1000 tokens (decimals=0), Pyth: price=20_000_000_000, expo=-8 → $200/SOL → 5 SOL
        let result = convert_quote_to_sol(1_000, 20_000_000_000, -8, 0);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn decimals_9_expo_neg4() {
        // 1000 tokens (decimals=9), price=2_000_000, expo=-4 → $200/SOL → 5 SOL
        let result = convert_quote_to_sol(1_000_000_000_000, 2_000_000, -4, 9);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn decimals_9_expo_neg8_pyth_200usd() {
        // 1000 tokens (decimals=9), Pyth: price=20_000_000_000, expo=-8 → $200/SOL → 5 SOL
        let result = convert_quote_to_sol(1_000_000_000_000, 20_000_000_000, -8, 9);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn decimals_6_expo_neg8_high_price() {
        // 100 USDT (decimals=6), Pyth: price=10_000_000_000, expo=-8 → $100/SOL → 1 SOL
        let result = convert_quote_to_sol(100_000_000, 10_000_000_000, -8, 6);
        assert_eq!(result, 1_000_000_000);
    }

    #[test]
    fn decimals_6_expo_neg8_low_price() {
        // 100 USDT (decimals=6), Pyth: price=1_000_000_000, expo=-8 → $10/SOL → 10 SOL
        let result = convert_quote_to_sol(100_000_000, 1_000_000_000, -8, 6);
        assert_eq!(result, 10_000_000_000);
    }

    #[test]
    fn small_deposit_decimals_6_expo_neg8() {
        // 1 USDT (decimals=6), Pyth: price=20_000_000_000, expo=-8 → $200/SOL → 0.005 SOL
        let result = convert_quote_to_sol(1_000_000, 20_000_000_000, -8, 6);
        assert_eq!(result, 5_000_000);
    }

    #[test]
    fn tiny_deposit_decimals_6_expo_neg8() {
        // 0.000001 USDT (1 smallest unit, decimals=6), $200/SOL → 5 lamports
        // 1 * 10^8 * 10^9 / (20_000_000_000 * 10^6) = 10^17 / (2*10^16) = 5
        let result = convert_quote_to_sol(1, 20_000_000_000, -8, 6);
        assert_eq!(result, 5);
    }

    #[test]
    fn expo_neg12_boundary() {
        // decimals=6, expo=-12 boundary: price=20_000_000_000_000_000, expo=-12 → $200/SOL
        // 1000 USDT → 5 SOL
        let result = convert_quote_to_sol(1_000_000_000, 200_000_000_000_000, -12, 6);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    fn expo_neg1_boundary() {
        // decimals=6, expo=-1 boundary: price=2000, expo=-1 → $200/SOL
        // 1000 USDT → 5 SOL
        let result = convert_quote_to_sol(1_000_000_000, 2_000, -1, 6);
        assert_eq!(result, 5_000_000_000);
    }

    #[test]
    #[should_panic(expected = "expo must be in range (-12, 0]")]
    fn positive_expo_panics() {
        convert_quote_to_sol(1_000_000_000, 2, 2, 6);
    }

    #[test]
    fn expo_0_large_deposit_no_overflow() {
        // expo=0: numerator = quote_amount * 10^0 * 10^9 = quote_amount * 10^9
        // max u64 ~1.8*10^19 → numerator ~1.8*10^28, fits u128
        // 10B USDT (decimals=6), price=200, expo=0 → 50M SOL
        let result = convert_quote_to_sol(10_000_000_000_000_000, 200, 0, 6);
        assert_eq!(result, 50_000_000_000_000_000);
    }

    #[test]
    fn expo_0_max_price_no_overflow() {
        // expo=0, MAX_PRICE=10^15, decimals=9
        // 1000 tokens (decimals=9), price=10^15, expo=0 → very small result
        // numerator = 10^12 * 1 * 10^9 = 10^21
        // denominator = 10^15 * 10^9 = 10^24
        // result = 10^21 / 10^24 = 0 (truncated)
        let result = convert_quote_to_sol(1_000_000_000_000, 1_000_000_000_000_000, 0, 9);
        assert_eq!(result, 0);
    }

    #[test]
    fn expo_neg12_large_deposit_no_overflow() {
        // expo=-12: numerator = quote_amount * 10^12 * 10^9
        // 1M USDT (decimals=6) = 10^12 smallest units
        // numerator = 10^12 * 10^12 * 10^9 = 10^33, fits u128 (max ~3.4*10^38)
        // price=200_000_000_000_000 (expo=-12 → $200)
        // denominator = 2*10^14 * 10^6 = 2*10^20
        // result = 10^33 / (2*10^20) = 5*10^12 = 5M SOL
        let result = convert_quote_to_sol(1_000_000_000_000, 200_000_000_000_000, -12, 6);
        assert_eq!(result, 5_000_000_000_000);
    }
}
