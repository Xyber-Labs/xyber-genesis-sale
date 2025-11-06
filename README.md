# Xyber Sale Solana Program

A Solana-based token sale platform built with Anchor framework.

## Features

- **Configuration Management**: Initialize and manage sale configuration with admin, backend, and multisig roles
- **Round Management**: Setup and configure sale rounds with start/end times
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

Configure the sale round with start and end times.

```bash
anchor run setup-round -- \
  --start-time 1762434389 \
  --end-time 1762520789
```

## Program Architecture

- **SaleConfig**: Configuration account with admin, backend, multisig roles and token mints
- **RoundConfig**: Round configuration with start/end times
