# Deployment and Setup Guide

This document contains the complete deployment flow for the Xyber Sale program.

## Prerequisites

- Solana CLI configured with the deployer wallet
- Keypairs generated for admin, multisig, buyer
- Base token mint created
- Quote token mints created (USDT, USDC, etc.)
- Anchor CLI installed

## Deployment Steps

```bash
solana-test-validator --reset
```

### 1. Deploy the Program

```bash
anchor build -- --features localnet,reset-allowed
cp target/idl/xyber_sale.json target/types/xyber_sale.ts ts-sdk/idl/ && cd ts-sdk && yarn build && cd .. && yarn install --force
anchor deploy --provider.cluster localnet --program-name xyber-sale --program-keypair keys/xyber_sale-keypair.json
sleep 2
anchor idl init --provider.cluster localnet --filepath target/idl/xyber_sale.json XYBGKPCgL6Twhdjo6LFt9niCgyxnbxN3tacXypc6SSt
```

### 2. Airdrop SOL to Admin and Buyer

```bash
solana airdrop 100 $(solana address -k keys/admin.json) -u localhost
solana airdrop 100 $(solana address -k keys/buyer.json) -u localhost
solana airdrop 100 $(solana address -k keys/multisig.json) -u localhost
solana airdrop 100 $(solana address -k keys/participant.json) -u localhost
solana airdrop 100 8wLChQAmWJy7ESQHSnZ5ZEhQGSoACfC6PNKpsFDVdex -u localhost
```

### 3. Create Token Mints

```bash
spl-token create-token --mint-authority keys/admin.json --fee-payer keys/admin.json --decimals 6 keys/base-mint.json -u localhost
spl-token create-token --mint-authority keys/admin.json --fee-payer keys/admin.json --decimals 6 keys/quote-mint.json -u localhost
```

### 4. Initialize Sale Configuration

```bash
anchor run initialize --provider.wallet mainnet/keeper.json --provider.cluster mainnet -- \
  --authority-keypair keys/deployer.json \
  --admin 8wLChQAmWJy7ESQHSnZ5ZEhQGSoACfC6PNKpsFDVdex \
  --base-mint BjudgcBdfhaRk54nMYdM2dJ2AvMUFaJuUPVm9x7jGp9d
```

### 4a. Propose Multisig

```bash
anchor run propose-multisig --provider.cluster mainnet -- \
  --authority-keypair ./keys/admin.json \
  --new-multisig ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP
```

### 4b. Accept Multisig

```bash
anchor run accept-multisig --provider.cluster mainnet -- \
  --new-multisig ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP --base58
```

### 5. Configure Quote Token (USDT, USDC, etc.)

Configure quote token that will be accepted for payment with its price in SOL:

```bash
anchor run set-quote-mint --provider.cluster localnet -- \
  --multisig-keypair ./keys/multisig.json \
  --quote-mint $(solana address -k keys/quote-mint.json) \
  --price 200 \
  --expo 0 \
  --is-enabled true
```

**Price Format:**

- `price` = SOL price in USD (e.g., 200 for $200/SOL)
- `expo` = exponent (use 0 for simple prices)
- Actual price = `price × 10^expo` (e.g., 200 × 10^0 = $200)

**Note:** Prices can only be updated once per 24 hours (cooldown protection).

### 6. Setup Sale Round

```bash
anchor run setup-round --provider.cluster mainnet -- \
  --trezor --skip-passphrase \
  --start-time $(date -d "2026-02-23 10:00UTC" +%s) \
  --end-time $(date -d "2026-02-23 10:00UTC + 48hours" +%s)
```

### 7. Setup Vesting Plan

For **public sale** (100% unlock at TGE):

```bash
TGE_DATE=$(date +%s)

anchor run setup-vesting-plan --provider.cluster mainnet -- \
  --trezor --skip-passphrase \
  --vesting-plan-name public \
  --period $(date -d "19:47" +%s),1.0,0.0
```

Format: `--period START_TIME,CLAIM_RATIO,BURN_RATIO[,BASE_PERIOD_INDEX]`

- Multiple `--period` options can be specified for gradual vesting
- `CLAIM_RATIO`: Portion of tokens to claim (0.0 to 1.0)
- `BURN_RATIO`: Portion of tokens to burn (0.0 to 1.0)
- `BASE_PERIOD_INDEX`: Optional, references a previous period's remaining balance

### 8. Setup Token Bucket

For **public sale** (priceless):

```bash
anchor run setup-bucket --provider.cluster mainnet  -- \
  --trezor --skip-passphrase \
  --bucket-name PUBLIC \
  --bucket-supply 500000000000000 \
  --vesting-type priceless \
  --vesting-plan public
```

**Note:** Bucket name must be uppercase to match round name (PUBLIC)

### 9. Mint Base Tokens to Admin

Create a token account for admin and mint base tokens for distribution:

```bash
spl-token create-account $(solana address -k keys/base-mint.json) \
  --owner $(solana address -k keys/multisig.json) \
  --fee-payer keys/multisig.json \
  -u localhost

spl-token mint $(solana address -k keys/base-mint.json) 100000000000000 \
  --mint-authority keys/admin.json \
  --recipient-owner keys/multisig.json \
  -u localhost
```

### 10. Transfer Base Tokens to Bucket

Transfer base tokens from admin's wallet to bucket for claim distribution:

```bash
anchor run transfer-to-bucket --provider.cluster mainnet -- \
  --from-authority-keypair ./mainnet/authority.json \
  --bucket-name PUBLIC \
  --amount 1000000000
```

### 11. Deposit SOL to Purchase Tokens

```bash
anchor run deposit-sol --provider.cluster localnet -- \
  --buyer-keypair ./keys/buyer.json \
  --round public \
  --payment-amount 5000000000
```

**Note:** Payment amount is in lamports (1 SOL = 10^9 lamports)

### 12. Mint Quote Tokens to Buyer (for SPL deposit)

Create token account and mint quote tokens to buyer for testing SPL deposit:

```bash
spl-token create-account $(solana address -k keys/quote-mint.json) \
  --owner $(solana address -k keys/buyer.json) \
  --fee-payer keys/buyer.json \
  -u localhost

spl-token mint $(solana address -k keys/quote-mint.json) 10000000 --mint-authority keys/admin.json --recipient-owner keys/buyer.json -u localhost
```

### 13. Deposit Tokens (SPL) to Purchase Tokens

```bash
anchor run deposit-asset --provider.cluster localnet -- \
  --buyer-keypair ./keys/buyer.json \
  --round public \
  --quote-mint $(solana address -k keys/quote-mint.json) \
  --payment-amount 1000000000
```

**Note:** Payment amount is in token's smallest units (depends on token decimals)

### 14. Claim Purchased Tokens

After TGE (Token Generation Event) or when vesting period starts, buyers can claim their tokens:

```bash
anchor run claim --provider.cluster localnet -- \
  --buyer-keypair ./keys/buyer.json \
  --bucket-name PUBLIC \
  --vesting-plan public
```

**Note:** Tokens are claimed according to the vesting schedule configured in the vesting plan.

## Withdraw Operations (Admin Only)

These operations can only be performed by the multisig account to withdraw accumulated funds from the sale.

### 15. Withdraw SOL from Bucket Pool

Withdraw all accumulated SOL (except rent reserve) from the bucket pool:

```bash
anchor run withdraw-sol --provider.cluster localnet -- \
  --multisig-keypair ./keys/multisig.json \
  --address-to-withdraw-to $(solana address)
```

**Note:** Automatically leaves rent-exempt minimum in bucket_pool.

### 16. Withdraw Quote Tokens (Asset) from Bucket Pool

Withdraw all accumulated quote tokens (USDT/USDC) from the bucket pool:

```bash
anchor run withdraw-asset --provider.cluster localnet -- \
  --multisig-keypair ./keys/multisig.json \
  --quote-mint $(solana address -k keys/quote-mint.json) \
  --withdraw-owner $(solana address)
```

**Note:** Creates an associated token account for withdraw-owner if needed. Specify which quote token to withdraw.

## Deterministic Vesting Flow (Team, Advisors, Partners)

This section describes how to set up deterministic vesting for participants with pre-defined token allocations (team,
advisors, partners, etc.).

### 1. Setup Bucket with Deterministic Vesting

```bash
anchor run setup-bucket --provider.cluster localnet -- \
  --trezor --skip-passphrase \
  --bucket-name team \
  --bucket-supply 10000000000000 \
  --vesting-type deterministic \
  --vesting-plan vesting-24m
```

### 2. Setup 24-Month Linear Vesting Plan

Create a vesting plan with 24 equal monthly unlocks (0% TGE):

```bash
anchor run setup-24m-vesting-plan --provider.cluster localnet -- \
  --trezor --skip-passphrase \
  --vesting-plan-name vesting-24m
```

**Note:** Each period unlocks 1/24 ≈ 4.17% of allocation monthly over 24 months.

### 3. Setup Deterministic Vesting for Participant

Assign fixed allocation to a participant:

```bash
anchor run setup-deterministic-vesting --provider.cluster localnet -- \
  --trezor --skip-passphrase \
  --participant $(solana address -k keys/participant.json) \
  --bucket-name team \
  --new-allocation 50000000000 \
  --vesting-plan vesting-24m
```

### 4. Transfer Base Tokens to Bucket

```bash
anchor run transfer-to-bucket --provider.cluster localnet -- \
  --from-authority-keypair ./keys/multisig.json \
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
anchor test -- --features localnet
```

## Notes

- Token amounts use mint decimals (typically 6 or 9)
- SOL amounts are in lamports (1 SOL = 10^9 lamports)
- Quote token prices use Pyth-compatible format: actual_price = price × 10^expo
- Round must be active (current time between start_time and end_time)
- Bucket supply must be sufficient for allocation requests
- Quote token prices have 24-hour cooldown between updates
