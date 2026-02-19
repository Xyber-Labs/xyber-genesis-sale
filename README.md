# Xyber Genesis Sale

![Genesis Sale Banner](https://bllr7j4hheacwbuvpg6igium2rshx6nwnlzax5atngwtc6qcsdma.arweave.net/Ctcfp4c5ACsGlXm8gyKM1GR7-bZq8gv0E2mtMXoCkNg)


<p align="center">
  <a href="https://explorer.solana.com/address/xicod59noqHeMsTqBjrmHQBbqrzHhw1v92CTmguPWag/idl"><img src="https://img.shields.io/badge/Solana-Mainnet-brightgreen?logo=solana" alt="Solana Mainnet"></a>
  <a href="https://www.anchor-lang.com/"><img src="https://img.shields.io/badge/Anchor-0.31.1-blue?logo=anchor" alt="Anchor"></a>
  <a href="https://www.npmjs.com/package/@xyber-labs/xyber-sale-sdk"><img src="https://img.shields.io/npm/v/@xyber-labs/xyber-sale-sdk?logo=npm" alt="npm"></a>
  <a href="https://www.halborn.com/audits/xyber/xyber-sale-solana-program-c09ec9"><img src="https://img.shields.io/badge/Audited%20by-Halborn-brightgreen" alt="Audited by Halborn"></a>
  <a href="https://github.com/RichardLitt/standard-readme"><img src="https://img.shields.io/badge/readme%20style-standard-brightgreen.svg" alt="standard-readme compliant"></a>
</p>


---



Solana program for conducting the Xyber Genesis Sale of $XYBER — the native token powering onchain AI agents, apps and
machines. The program manages the full lifecycle of the token sale, including initialization, round configuration,
bucket-based token allocation, SOL and quote asset deposits, deterministic and priceless vesting schedules, token
claiming, and fund withdrawals by the admin.

The TypeScript SDK (`@xyber-labs/xyber-sale-sdk`) mirrors every instruction with a three-level API (`methodIx` /
`methodTx` / `method`). Anchor CLI scripts wrap each operation for deployment and administration — see [Usage](#usage)
for details.

## Dependencies

Install [Solana toolchain](https://solana.com/docs/intro/installation):

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
```

Switch to Anchor 0.31.1:

```bash
avm use 0.31.1
```

- Solana CLI 2.0+
- Anchor CLI 0.31.1
- Node.js 18+
- [Squads](https://squads.so/) multisig for mainnet program authority

## Install

```bash
npm install @xyber-labs/xyber-sale-sdk
```

## Usage

### Localnet

For developers and auditors — build, deploy and test the program against a local Solana validator.
See [LOCAL_FLOW.md](LOCAL_FLOW.md) for the full setup, deployment and test flow.

### Mainnet

For the operations team — program deployment, on-chain verification and sale configuration on Solana mainnet. Requires
Squads multisig and Trezor hardware wallet. See [MAINNET_FLOW.md](MAINNET_FLOW.md) for the complete production
deployment guide.

## API

The on-chain program exposes 14 instructions:

| Instruction                   | Description                                                            | Access           |
|-------------------------------|------------------------------------------------------------------------|------------------|
| `initialize`                  | Initialize sale configuration with admin authority and base token mint | Admin            |
| `propose_multisig`            | Propose a new multisig authority                                       | Admin            |
| `accept_multisig`             | Accept pending multisig authority change                               | Pending Multisig |
| `set_quote_mint`              | Configure accepted quote tokens with SOL-equivalent pricing            | Multisig         |
| `setup_round`                 | Configure the public sale round with start and end times               | Admin            |
| `setup_bucket`                | Create token distribution buckets with supply and vesting type         | Admin            |
| `setup_vesting_plan`          | Create vesting schedules with claim/burn ratios per period             | Admin            |
| `setup_deterministic_vesting` | Assign fixed token allocations to participants                         | Admin            |
| `deposit_sol`                 | Deposit native SOL into the sale round                                 | Public           |
| `deposit_asset`               | Deposit quote tokens (USDT, USDC) into the sale round                  | Public           |
| `claim`                       | Claim vested tokens according to the vesting schedule                  | Public           |
| `withdraw_sol`                | Withdraw collected SOL from the bucket pool                            | Multisig         |
| `withdraw_asset`              | Withdraw collected quote tokens from the bucket pool                   | Multisig         |
| `withdraw_unsold_tokens`      | Withdraw unsold base tokens from deterministic buckets                 | Multisig         |

## Maintainers

[@XyKeeper](https://github.com/XyKeeper) [
`PGP: 19A3D3B094F4AD25`](https://keys.openpgp.org/vks/v1/by-fingerprint/3D98A0A1465491FAFC2047F719A3D3B094F4AD25)
