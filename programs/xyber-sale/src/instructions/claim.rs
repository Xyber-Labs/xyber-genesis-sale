use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{burn, transfer_checked, Burn, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    constants::SEED_ROOT,
    data::{BucketData, ClaimEvent, SaleConfig, VestingConfig, VestingPlan},
    errors::CustomError,
    vesting_calculator::VestingCalculator,
};

pub fn claim(ctx: Context<Claim>, bucket_name: String, vesting_plan: String) -> Result<()> {
    require!(
        ctx.accounts.bucket_data.vesting_plan.contains(&vesting_plan),
        CustomError::UnexpectedVestingPlan
    );

    let vesting_config_account = &mut ctx.accounts.vesting_config;

    if let Some(ref current_vesting_plan) = vesting_config_account.vesting_plan {
        require!(current_vesting_plan == &vesting_plan, CustomError::UnexpectedVestingPlan);
    }

    vesting_config_account.vesting_plan.get_or_insert(vesting_plan.clone());
    let vesting_plan_acc = &ctx.accounts.vesting_plan;

    let vesting_settings =
        (&vesting_config_account.clone().into_inner(), &vesting_plan_acc.clone().into_inner());
    let mut vesting_calculator = VestingCalculator::from(vesting_settings);

    let unixtime = ctx.accounts.clock.unix_timestamp as u64;
    let to_claim = vesting_calculator.claim(unixtime);
    let to_burn = vesting_calculator.burn(unixtime);

    require!(to_claim != 0 || to_burn != 0, CustomError::ClaimUnavailable);

    vesting_config_account.tokens_claimed += to_claim;
    vesting_config_account.tokens_burnt += to_burn;
    require!(
        vesting_config_account.tokens_claimed + vesting_config_account.tokens_burnt
            <= vesting_config_account.total_allocation,
        CustomError::AllocationOverflowed
    );

    let seeds_on_bucket = [
        SEED_ROOT,
        b"BUCKET",
        bucket_name.as_bytes(),
        &[ctx.bumps.bucket_data] as &[u8],
    ];
    let pda_signature = [&seeds_on_bucket as &[&[u8]]];
    if to_claim > 0 {
        let transfer_accounts = TransferChecked {
            from: ctx.accounts.bucket_pool_ata.to_account_info(),
            mint: ctx.accounts.base_mint.to_account_info(),
            to: ctx.accounts.buyer_base_ata.to_account_info(),
            authority: ctx.accounts.bucket_data.to_account_info(),
        };

        let cpi =
            CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts)
                .with_signer(&pda_signature);
        transfer_checked(cpi, to_claim, ctx.accounts.base_mint.decimals)?;
        ctx.accounts.bucket_data.claimed_supply += to_claim;
        msg!("Tokens claimed: {}", to_claim);
    }

    if to_burn > 0 {
        let burn_accounts = Burn {
            from: ctx.accounts.bucket_pool_ata.to_account_info(),
            mint: ctx.accounts.base_mint.to_account_info(),
            authority: ctx.accounts.bucket_data.to_account_info(),
        };
        let cpi = CpiContext::new(ctx.accounts.token_program.to_account_info(), burn_accounts)
            .with_signer(&pda_signature);
        burn(cpi, to_burn)?;
        ctx.accounts.bucket_data.burnt_supply += to_burn;
        msg!("Tokens burnt: {}", to_burn);
    }

    emit!(ClaimEvent {
        buyer: *ctx.accounts.buyer.key,
        bucket: bucket_name,
        vesting_plan: vesting_config_account
            .vesting_plan
            .clone()
            .expect("vesting_plan expected to be set up"),
        claim: to_claim,
        burn: to_burn,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(bucket_name: String, vesting_plan_name: String)]
pub struct Claim<'info> {
    #[account(signer, mut)]
    pub buyer: Signer<'info>,
    #[account(
        seeds = [SEED_ROOT, b"CONFIG"],
        bump
    )]
    pub config: Box<Account<'info, SaleConfig>>,
    #[account(seeds = [SEED_ROOT, b"VESTING_PLAN", vesting_config.vesting_plan.as_ref().unwrap_or(&vesting_plan_name).as_bytes()], bump)]
    pub vesting_plan: Box<Account<'info, VestingPlan>>,

    #[account(
        mut,
        seeds = [SEED_ROOT, b"VESTING_CONFIG", bucket_name.as_bytes(), buyer.key().as_ref()],
        bump
    )]
    pub vesting_config: Box<Account<'info, VestingConfig>>,
    #[account(mut, seeds = [SEED_ROOT, b"BUCKET", bucket_name.as_bytes()], bump)]
    pub bucket_data: Box<Account<'info, BucketData>>,
    #[account(
        mut,
        associated_token::mint = base_mint,
        associated_token::authority = bucket_data,
        associated_token::token_program = token_program,
    )]
    pub bucket_pool_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, constraint = (base_mint.key() == config.base_mint) @ CustomError::InvalidBaseMint)]
    pub base_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = base_mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_base_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
