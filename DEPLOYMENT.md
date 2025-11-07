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
```

### 2. Airdrop SOL to Admin and Buyer

```bash
solana airdrop 100 $(solana-keygen pubkey keys/admin.json) -u localhost
solana airdrop 100 $(solana-keygen pubkey keys/buyer.json) -u localhost
```

### 3. Create Token Mints

```bash
anchor run create-mints --provider.cluster localnet
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
  --price 40000 \
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

For **other buckets** with gradual vesting (example: 30% at TGE, 70% after 3 months):

```bash
TGE_DATE=$(date +%s)
VESTING_DATE=$(date -d "+90 days" +%s)

anchor run setup-vesting-plan --provider.cluster localnet -- \
  --admin-keypair ./keys/admin.json \
  --vesting-plan-name team \
  --period ${TGE_DATE},0.3,0.0 \
  --period ${VESTING_DATE},0.7,0.0,0
```

Format: `--period START_TIME,CLAIM_RATIO,BURN_RATIO[,BASE_PERIOD_INDEX]`
- Multiple `--period` options can be specified for gradual vesting
- `CLAIM_RATIO`: Portion of tokens to claim (0.0 to 1.0)
- `BURN_RATIO`: Portion of tokens to burn (0.0 to 1.0)
- `BASE_PERIOD_INDEX`: Optional, references a previous period's remaining balance

### 7. Setup Token Bucket

```bash
anchor run setup-bucket --provider.cluster localnet -- \
  --admin-keypair ./keys/admin.json \
  --bucket-name public \
  --bucket-supply 100000000000000 \
  --vesting-plan public
```

### 8. Mint Base Tokens to Bucket

Mint base tokens to bucket for claim distribution:

```bash
BASE_MINT=$(solana-keygen pubkey keys/base-mint.json)
BUCKET_PDA=$(solana address --program-id XYBGKPCgL6Twhdjo6LFt9niCgyxnbxN3tacXypc6SSt -- public SEED_ROOT BUCKET)
BUCKET_BASE_ATA=$(spl-token address --token $BASE_MINT --owner $BUCKET_PDA -u localhost)

spl-token mint $BASE_MINT 1000000 $BUCKET_BASE_ATA -u localhost
```

### 9. Deposit SOL to Purchase Tokens

```bash
anchor run deposit-sol --provider.cluster localnet -- \
  --buyer-keypair ./keys/buyer.json \
  --backend-keypair ./keys/backend.json \
  --round public \
  --sol-price 250000000000000000000 \
  --base-allocation 100000000 \
  --expiration $(date -d "+10 minutes" +%s)
```

### 10. Mint Quote Tokens to Buyer (for SPL deposit)

Create token account and mint quote tokens to buyer for testing SPL deposit:

```bash
QUOTE_MINT=$(solana-keygen pubkey keys/quote-mint.json)
BUYER=$(solana-keygen pubkey keys/buyer.json)

BUYER_QUOTE_ATA=$(spl-token create-account $QUOTE_MINT --owner $BUYER --fee-payer ~/.config/solana/id.json -u localhost 2>&1 | grep "Creating account" | awk '{print $3}')
echo "Buyer Quote ATA: $BUYER_QUOTE_ATA"

spl-token mint $QUOTE_MINT 10000000 $BUYER_QUOTE_ATA -u localhost
```

### 11. Deposit Tokens (SPL) to Purchase Tokens

```bash
anchor run deposit-asset --provider.cluster localnet -- \
  --buyer-keypair ./keys/buyer.json \
  --backend-keypair ./keys/backend.json \
  --round public \
  --base-allocation 100000000 \
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
