# Deployment and Setup Guide

This document contains the complete deployment flow for the Xyber Sale program.

## Prerequisites

- Solana CLI configured with the deployer wallet
- Keypairs generated for admin, backend, buyer
- Base and quote token mints created
- Anchor CLI installed

## Deployment Steps

### 1. Deploy the Program

```bash
anchor build
anchor deploy --provider.cluster localnet --program-name xyber-sale --program-keypair keys/xyber_sale-keypair.json 
anchor idl init --provider.cluster localnet --filepath target/idl/xyber_sale.json XYBGKPCgL6Twhdjo6LFt9niCgyxnbxN3tacXypc6SSt
```

### 2. Airdrop SOL to Admin and Buyer

```bash
solana airdrop 100 $(solana address -k keys/admin.json) -u localhost
solana airdrop 100 $(solana address -k keys/buyer.json) -u localhost
solana airdrop 100 $(solana address -k keys/multisig.json) -u localhost
solana airdrop 100 $(solana address -k keys/participant.json) -u localhost
```

### 3. Create Token Mints

```bash
spl-token create-token --decimals 6 keys/base-mint.json -u localhost
spl-token create-token --decimals 6 keys/quote-mint.json -u localhost
```

### 4. Initialize Sale Configuration

```bash
anchor run initialize --provider.cluster localnet -- \
  --admin ANikp9qHf2CFyEdgvh9iuZRMw6eLaTaEbCKB8i1nbfNg \
  --backend 7CZqeCAnSnoQtNhAowspmUYTYMinAoxKDyzUq5umkyRG \
  --multisig 2StawVzybhciXgXxumcU8r1ZQNdcEu73cuq6VF5uQUP9 \
  --base-mint 9ww1Rt2KEycANggPZ7hmZ99kM6m8jRBDbUBzU3MeUA96 \
  --quote-mint 8D7xtj83FmfqXRGGefBaMZ2UeAhYdsaEBR8FVJohU2tW
```

### 5. Setup Sale Round

```bash
anchor run setup-round --provider.cluster localnet -- \
  --admin-keypair ./keys/admin.json \
  --start-time $(date +%s) \
  --end-time $(date -d "+30 days" +%s)
```

### 6. Setup Vesting Plan

For **public sale** (100% unlock at TGE):

```bash
TGE_DATE=$(date +%s)

anchor run setup-vesting-plan --provider.cluster localnet -- \
  --admin-keypair ./keys/admin.json \
  --vesting-plan-name public \
  --period ${TGE_DATE},1.0,0.0
```

Format: `--period START_TIME,CLAIM_RATIO,BURN_RATIO[,BASE_PERIOD_INDEX]`

- Multiple `--period` options can be specified for gradual vesting
- `CLAIM_RATIO`: Portion of tokens to claim (0.0 to 1.0)
- `BURN_RATIO`: Portion of tokens to burn (0.0 to 1.0)
- `BASE_PERIOD_INDEX`: Optional, references a previous period's remaining balance

### 7. Setup Token Bucket

For **public sale** (priceless):

```bash
anchor run setup-bucket --provider.cluster localnet -- \
  --admin-keypair ./keys/admin.json \
  --bucket-name public \
  --bucket-supply 100000000000000 \
  --vesting-type priceless \
  --vesting-plan public
```

### 8. Mint Base Tokens to Bucket

Mint base tokens to bucket for claim distribution:

```bash
anchor run mint-to-bucket --provider.cluster localnet -- \
  --bucket-name public \
  --amount 100000000000000
```

### 9. Deposit SOL to Purchase Tokens

```bash
anchor run deposit-sol --provider.cluster localnet -- \
  --buyer-keypair ./keys/buyer.json \
  --backend-keypair ./keys/backend.json \
  --round public \
  --sol-price 250000000000000000000 \
  --payment-amount 4000000 \
  --expiration $(date -d "+10 minutes" +%s)
```

### 10. Mint Quote Tokens to Buyer (for SPL deposit)

Create token account and mint quote tokens to buyer for testing SPL deposit:

```bash
spl-token create-account $(solana address -k keys/quote-mint.json) \
  --owner $(solana address -k keys/buyer.json) \
  --fee-payer ~/.config/solana/id.json \
  -u localhost

spl-token mint $(solana address -k keys/quote-mint.json) 10000000 --recipient-owner keys/buyer.json -u localhost
```

### 11. Deposit Tokens (SPL) to Purchase Tokens

```bash
anchor run deposit-asset --provider.cluster localnet -- \
  --buyer-keypair ./keys/buyer.json \
  --backend-keypair ./keys/backend.json \
  --round public \
  --payment-amount 4000000 \
  --expiration $(date -d "+10 minutes" +%s)
```

### 12. Claim Purchased Tokens

After TGE (Token Generation Event) or when vesting period starts, buyers can claim their tokens:

```bash
anchor run claim --provider.cluster localnet -- \
  --buyer-keypair ./keys/buyer.json \
  --bucket-name public \
  --vesting-plan public
```

**Note:** Tokens are claimed according to the vesting schedule configured in the vesting plan.

## Withdraw Operations (Admin Only)

These operations can only be performed by the multisig account to withdraw accumulated funds from the sale.

### 13. Withdraw SOL from Bucket Pool

Withdraw all accumulated SOL (except rent reserve) from the bucket pool:

```bash
anchor run withdraw-sol --provider.cluster localnet -- \
  --multisig-keypair ./keys/multisig.json \
  --address-to-withdraw-to $(solana address)
```

**Note:** Automatically leaves rent-exempt minimum in bucket_pool.

### 14. Withdraw Quote Tokens (Asset) from Bucket Pool

Withdraw all accumulated quote tokens (USDT/USDC) from the bucket pool:

```bash
anchor run withdraw-asset --provider.cluster localnet -- \
  --multisig-keypair ./keys/multisig.json \
  --withdraw-owner $(solana address)
```

**Note:** Creates an associated token account for withdraw-owner if needed.

## Deterministic Vesting Flow (Team, Advisors, Partners)

This section describes how to set up deterministic vesting for participants with pre-defined token allocations (team,
advisors, partners, etc.).

### 1. Setup Bucket with Deterministic Vesting

```bash
anchor run setup-bucket --provider.cluster localnet -- \
  --admin-keypair ./keys/admin.json \
  --bucket-name team \
  --bucket-supply 10000000000000 \
  --vesting-type deterministic \
  --vesting-plan vesting-24m
```

### 2. Setup 24-Month Linear Vesting Plan

Create a vesting plan with 24 equal monthly unlocks (0% TGE):

```bash
anchor run setup-24m-vesting-plan --provider.cluster localnet -- \
  --admin-keypair ./keys/admin.json \
  --vesting-plan-name vesting-24m
```

**Note:** Each period unlocks 1/24 ≈ 4.17% of allocation monthly over 24 months.

### 3. Setup Deterministic Vesting for Participant

Assign fixed allocation to a participant:

```bash
anchor run setup-deterministic-vesting --provider.cluster localnet -- \
  --admin-keypair ./keys/admin.json \
  --participant $(solana address -k keys/participant.json) \
  --bucket-name team \
  --new-allocation 50000000000 \
  --vesting-plan vesting-24m
```

### 4. Mint Base Tokens to Bucket

```bash
anchor run mint-to-bucket --provider.cluster localnet -- \
  --bucket-name team \
  --amount 10000000000000
```

### 5. Claim Tokens

Participant can claim unlocked tokens according to vesting schedule:

```bash
anchor run claim --provider.cluster localnet -- \
  --buyer-keypair ./keys/participant.json \
  --bucket-name team \
  --vesting-plan vesting-24m
```

**Important Notes:**

- Deterministic vesting uses **fixed allocations** set by admin
- No deposits required - allocation is predetermined
- First claim happens immediately (month 0), subsequent claims unlock monthly
- Can only claim unlocked portion based on elapsed time
- Bucket vesting type (deterministic) must match user vesting type

### 6. Withdraw Tokens from Bucket

Withdraw base tokens from a **deterministic** bucket:

```bash
anchor run withdraw-unsold-tokens --provider.cluster localnet -- \
  --multisig-keypair ./keys/multisig.json \
  --bucket-name team \
  --amount 50000000 \
  --withdraw-owner $(solana address)
```

**Note:**

- Only available for **deterministic** buckets (not priceless)
- For priceless buckets, entire supply is distributed proportionally
- Amount must not exceed `bucket_supply - registered_supply`

## Testing

Run the complete test suite:

```bash
anchor test
```

Run specific test file:

```bash
anchor test --skip-build --skip-deploy -- --grep "deposit"
```

## Notes

- All prices use 18 decimals for precision (PRICE_DECIMALS)
- Token amounts use mint decimals (typically 6 or 9)
- SOL amounts are in lamports (1 SOL = 10^9 lamports)
- Round must be active (current time between start_time and end_time)
- Bucket supply must be sufficient for allocation requests
- Backend signature is required for all deposits
