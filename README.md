# Xyber Sale Solana Program

A Solana-based token sale platform built with Anchor framework.

## Features

- **Configuration Management**: Initialize and manage sale configuration with admin, backend, and multisig roles
- **Round Management**: Setup and configure sale rounds with price and start/end times
- **Bucket Management**: Create and configure token distribution buckets with supply tracking and vesting plans
- **SOL Deposits**: Accept native SOL deposits with price-based token allocation
- **Vesting Management**: Track user allocations with vesting configuration
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

### Setup Bucket

Create and configure a token distribution bucket with supply tracking and vesting plan.

```bash
anchor run setup-bucket -- \
  --admin-keypair ./keys/admin.json \
  --bucket-name public \
  --bucket-supply 1000000
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

## Program Architecture

- **SaleConfig**: Configuration account with admin, backend, multisig roles and token mints
- **RoundConfig**: Round configuration with price and start/end times
- **BucketData**: Token distribution bucket with supply tracking and vesting plan
- **VestingConfig**: User vesting configuration with allocation tracking
