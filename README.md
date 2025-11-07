# Xyber Sale Solana Program

A Solana-based token sale platform built with Anchor framework.

## Features

- **Configuration Management**: Initialize and manage sale configuration with admin, backend, and multisig roles
- **Round Management**: Setup and configure sale rounds with price and start/end times
- **Vesting Plan Management**: Create vesting plans with periods defining claim/burn ratios and timestamps
- **Bucket Management**: Create and configure token distribution buckets with supply tracking and vesting plans
- **SOL Deposits**: Accept native SOL deposits with price-based token allocation
- **SPL Token Deposits**: Accept SPL token deposits with price-based token allocation
- **Vesting Management**: Track user allocations with vesting configuration
- **Token Claiming**: Claim purchased tokens according to vesting schedule with automatic burn support
- **Withdraw SOL**: Withdraw accumulated native SOL from bucket pool (multisig only)
- **Withdraw Assets**: Withdraw accumulated quote tokens from bucket pool (multisig only)
- **Withdraw Unsold Tokens**: Withdraw unsold base tokens from buckets (multisig only)
- **TypeScript SDK**: Full-featured SDK for interacting with the program
- **Test Suite**: Comprehensive test coverage

## Quick Start

### Prerequisites

- Node.js and Yarn
- Solana CLI tools
- Anchor framework

## Contract Management Scripts

### Initialize Config

Initialize the sale configuration with admin, backend, multisig, and token mints.

```bash
anchor run initialize -- \
  --admin 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin \
  --backend 2ZvJkKkGvfZvLcvPMdW8gMVvNbNXfPr3KJQ8vJ7K6kTe \
  --multisig 3XyZWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin \
  --base-mint 4ABcDEfG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin \
  --quote-mint 5CDeFGhI816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
```

### Setup Round

Configure the sale round with price and start/end times.

```bash
anchor run setup-round -- \
  --admin-keypair ./keys/admin.json \
  --price 10000 \
  --start-time 1704067200 \
  --end-time 1704153600
```

### Setup Vesting Plan

Create a vesting plan with periods defining claim/burn ratios and release schedule.

```bash
anchor run setup-vesting-plan -- \
  --admin-keypair ./keys/admin.json \
  --vesting-plan-name public \
  --period 1699000000,0.65,0.0 \
  --period 1699003600,0.35,0.0,0
```

Format: `--period START_TIME,CLAIM_RATIO,BURN_RATIO[,BASE_PERIOD_INDEX]`

### Setup Bucket

Create and configure a token distribution bucket with supply tracking and vesting plan.

```bash
anchor run setup-bucket -- \
  --admin-keypair ./keys/admin.json \
  --bucket-name public \
  --bucket-supply 1000000 \
  --vesting-plan public
```

### Deposit SOL

Deposit native SOL to purchase tokens in a specific round at specific price.

```bash
anchor run deposit-sol -- \
  --buyer-keypair ./keys/buyer.json \
  --backend-keypair ./keys/backend.json \
  --round public \
  --sol-price 250000000000000000000 \
  --base-allocation 6250000000 \
  --expiration 1704067800
```

### Deposit Asset (SPL Tokens)

Deposit SPL tokens (quote mint) to purchase tokens in a specific round.

```bash
anchor run deposit-asset -- \
  --buyer-keypair ./keys/buyer.json \
  --backend-keypair ./keys/backend.json \
  --round public \
  --base-allocation 100000000 \
  --expiration 1704067800
```

### Claim Tokens

Claim purchased tokens according to the vesting schedule. Tokens are released based on the vesting plan configuration.

```bash
anchor run claim -- \
  --buyer-keypair ./keys/buyer.json \
  --bucket-name public \
  --vesting-plan public
```

Tokens will be:
- **Claimed**: Transferred to buyer's token account
- **Burned**: Automatically burned if configured in the vesting plan

Multiple claims can be made as new vesting periods unlock, until all tokens are distributed.

### Withdraw SOL (Multisig Only)

Withdraw all accumulated SOL from the bucket pool, leaving only the rent-exempt minimum.

```bash
anchor run withdraw-sol -- \
  --multisig-keypair ./keys/multisig.json \
  --address-to-withdraw-to YOUR_WALLET_ADDRESS
```

### Withdraw Asset (Multisig Only)

Withdraw all accumulated quote tokens (USDT/USDC) from the bucket pool.

```bash
anchor run withdraw-asset -- \
  --multisig-keypair ./keys/multisig.json \
  --withdraw-owner YOUR_WALLET_ADDRESS
```

### Withdraw Unsold Tokens (Multisig Only)

Withdraw unsold base tokens from a specific bucket. Amount cannot exceed available unsold supply.

```bash
anchor run withdraw-unsold-tokens -- \
  --multisig-keypair ./keys/multisig.json \
  --bucket-name public \
  --amount 50000000 \
  --withdraw-owner YOUR_WALLET_ADDRESS
```

## Program Architecture

- **SaleConfig**: Configuration account with admin, backend, multisig roles and token mints
- **RoundConfig**: Round configuration with price and start/end times
- **VestingPlan**: Vesting plan with periods defining claim/burn ratios and release schedule
- **BucketData**: Token distribution bucket with supply tracking and vesting plan
- **VestingConfig**: User vesting configuration with allocation tracking
