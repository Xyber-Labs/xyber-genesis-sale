use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        burn, Burn, Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked,
    },
};

use crate::{
    constants::SEED_ROOT,
    data::{
        BucketData, BucketVestingType, ClaimEvent, SaleConfig, VestingConfig, VestingPlan,
        VestingType,
    },
    errors::CustomError,
    vesting_calculator::VestingCalculator,
};

pub fn claim(ctx: Context<Claim>, bucket_name: String, vesting_plan_name: String) -> Result<()> {
    require!(
        ctx.accounts.bucket_data.vesting_plan.contains(&vesting_plan_name),
        CustomError::UnexpectedVestingPlan
    );
    let bucket_data = &mut ctx.accounts.bucket_data;
    let vesting_config = &mut ctx.accounts.vesting_config;
    let vesting_plan_account = &ctx.accounts.vesting_plan;

    if let Some(ref current_name) = vesting_config.vesting_plan {
        require!(current_name == &vesting_plan_name, CustomError::UnexpectedVestingPlan);
    }

    vesting_config.vesting_plan.get_or_insert(vesting_plan_name.clone());

    match (bucket_data.vesting_type, vesting_config.vesting_type) {
        (Some(BucketVestingType::Deterministic), Some(VestingType::Deterministic { .. })) => {}
        (Some(BucketVestingType::DepositBased), Some(VestingType::DepositBased { .. })) => {}
        _ => panic!("Vesting types must match"),
    }

    let mut vesting_calculator =
        VestingCalculator::new(vesting_config, vesting_plan_account, bucket_data);

    let unixtime = ctx.accounts.clock.unix_timestamp as u64;
    let to_claim = vesting_calculator.claim(unixtime);
    let to_burn = vesting_calculator.burn(unixtime);

    require!(to_claim != 0 || to_burn != 0, CustomError::ClaimUnavailable);

    vesting_config.tokens_claimed += to_claim;
    vesting_config.tokens_burnt += to_burn;

    let participant_allocation =
        VestingCalculator::get_participant_allocation(vesting_config, bucket_data);

    require!(
        vesting_config.tokens_claimed + vesting_config.tokens_burnt <= participant_allocation,
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

        let cpi = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts)
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
        vesting_plan: vesting_config
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
