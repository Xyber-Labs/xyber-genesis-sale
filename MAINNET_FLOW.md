# Mainnet Deployment and Configuration

Production deployment and configuration flow for the Xyber Genesis Sale program on Solana mainnet.

## Prerequisites

- Solana CLI configured with the deployer wallet
- Anchor CLI 0.31.1
- [Squads](https://squads.so/) multisig for program authority
- Base token mint created on mainnet
- Trezor hardware wallet for admin operations

## Environment Setup

```bash
export CLUSTER=mainnet
export RPC_URL=https://api.${CLUSTER}.solana.com
export TREZOR_PUBKEY=8wLChQAmWJy7ESQHSnZ5ZEhQGSoACfC6PNKpsFDVdex
export TREASURY_SQUADS=4AjSH9D3uG7tgCWP9gLAuvjkV3cv5J2QoLh4c6rkJCos
export MNG_SQUADS=ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP
```

## 1. Build and Upload Program Buffer

```bash
solana-verify build
solana-keygen new -o buffer.json --no-bip39-passphrase -f
solana program deploy -k  --buffer buffer.json target/deploy/xyber_sale.so --url ${RPC_URL}
solana program set-buffer-authority $(solana address -k buffer.json) --new-buffer-authority ${MNG_SQUADS}
```

[Upgrade the program via Squads multisig](https://app.squads.so/squads/ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP/developer/programs/xicod59noqHeMsTqBjrmHQBbqrzHhw1v92CTmguPWag)

## 2. Verify Build On-Chain

```bash
solana-verify export-pda-tx https://github.com/Xyber-Labs/xyber-genesis-sale \
    -um --program-id xicod59noqHeMsTqBjrmHQBbqrzHhw1v92CTmguPWag \
    --uploader ${MNG_SQUADS} \
    --encoding base58 --compute-unit-price 0 --commit-hash dbb2f896 -- --features check-mint 
```

Execute the exported transaction through Squads (import base58 tx), then submit the verification job:

```bash
remote submit-job --program-id xicod59noqHeMsTqBjrmHQBbqrzHhw1v92CTmguPWag \
                  --uploader ${MNG_SQUADS} \
                  --url ${RPC_URL}
```

Close old buffers to reclaim rent — program buffer is closed through Squads multisig.

## 3. Initialize Sale Configuration

```bash
anchor run initialize --provider.wallet ${CLUSTER}/deployer.json --provider.cluster ${CLUSTER} -- \
  --authority-keypair ${CLUSTER}/deployer.json \
  --admin 8wLChQAmWJy7ESQHSnZ5ZEhQGSoACfC6PNKpsFDVdex \
  --base-mint xybERnaFYSEYwfmqcCT3k3X6EpBG1Kz5rCJwmrcyCCL
```

## 4. Propose and Accept Multisig

```bash
anchor run propose-multisig --provider.cluster ${CLUSTER} -- \
  --authority-keypair ./${CLUSTER}/admin.json \
  --new-multisig ${MNG_SQUADS}
```

```bash
anchor run accept-multisig --provider.cluster ${CLUSTER} -- \
  --new-multisig ${MNG_SQUADS} --base58
```

This command outputs an unsigned transaction in base58. Import it
into [Squads TX Builder](https://app.squads.so/squads/ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP/developer/tx-builder)
to sign and execute on-chain.

## 5. Configure Quote Tokens

Configure quote tokens (USDT, USDC) with SOL-equivalent pricing:

```bash
anchor run set-quote-mint --provider.cluster mainnet -- \
    --multisig ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP \
    --base58 \
    --quote-mint Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB \
    --price 8322 \
    --expo -2 \
    --is-enabled true

anchor run set-quote-mint --provider.cluster mainnet -- \
    --multisig ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP \
    --base58 \
    --quote-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
    --price 8322 \
    --expo -2 \
    --is-enabled true
```

**Note:** Prices can only be updated once per 24 hours (cooldown protection).

## 6. Setup Sale Round

```bash
anchor run setup-round --provider.cluster ${CLUSTER} -- \
  --trezor --skip-passphrase \
  --start-time $(date -d "2026-02-23 10:00UTC" +%s) \
  --end-time $(date -d "2026-02-23 10:00UTC + 48hours" +%s)
```

## 7. Setup Vesting Plan

For **public sale** (100% unlock at TGE):

```bash
anchor run setup-vesting-plan --provider.cluster ${CLUSTER} -- \
  --trezor --skip-passphrase \
  --vesting-plan-name public \
  --period $(date -d "2026-02-26 10:00UTC" +%s),1.0,0.0
```

## 8. Setup Token Bucket

For **public sale** (priceless):

```bash
anchor run setup-bucket --provider.cluster ${CLUSTER} -- \
  --trezor --skip-passphrase \
  --bucket-name PUBLIC \
  --bucket-supply 500000000000000 \
  --vesting-type priceless \
  --vesting-plan public
```

## 9. Transfer Base Tokens to Bucket

```bash
anchor run transfer-to-bucket --provider.cluster ${CLUSTER} -- \
  --from-authority ${TREASURY_SQUADS} \
  --base58 \
  --bucket-name PUBLIC \
  --amount 500000000000000
```

## Deterministic Vesting Setup

For team, foundation, community and other groups with pre-defined allocations:

### Setup Deterministic Bucket

```bash
anchor run setup-bucket --provider.cluster ${CLUSTER} -- \
  --trezor --skip-passphrase \
  --bucket-name <BUCKET_NAME> \
  --bucket-supply <SUPPLY> \
  --vesting-type deterministic \
  --vesting-plan <VESTING_PLAN_NAME>
```

### Assign Participant Allocation

```bash
anchor run setup-deterministic-vesting --provider.cluster ${CLUSTER} -- \
  --trezor --skip-passphrase \
  --participant keeppCujRWx7HW8AgCL3F9CfaAM2hRKvWvNVo6iGToE \
  --bucket-name TEAM \
  --new-allocation 20000000 \
  --vesting-plan TEAM
```

## Withdraw Operations (Multisig Only)

Each command outputs an unsigned transaction in base58. Import it
into [Squads TX Builder](https://app.squads.so/squads/${MNG_SQUADS}/developer/tx-builder) to sign and execute on-chain.

### Withdraw SOL

```bash
anchor run withdraw-sol --provider.cluster ${CLUSTER} -- \
  --multisig ${MNG_SQUADS} \
  --base58 \
  --address-to-withdraw-to ${TREASURY_SQUADS}
```

### Withdraw Quote Tokens

```bash
anchor run withdraw-asset --provider.cluster ${CLUSTER} -- \
  --multisig ${MNG_SQUADS} \
  --base58 \
  --quote-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --withdraw-owner ${TREASURY_SQUADS}
```

### Withdraw Unsold Tokens

```bash
anchor run withdraw-unsold-tokens --provider.cluster ${CLUSTER} -- \
  --multisig ${MNG_SQUADS} \
  --base58 \
  --bucket-name TEAM \
  --amount 100 \
  --withdraw-owner ${TREASURY_SQUADS}
```
