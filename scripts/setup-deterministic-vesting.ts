import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";
import { PublicKey } from "@solana/web3.js";

import {
  runWithSdk, getExplorerUrl, txToBase58,
  trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose,
} from "./utils";

function parseCliArgs() {
  const cli = new Command();
  cli
    .option("--admin-keypair <PATH>", "Path to admin keypair file")
    .option("--admin <PUBKEY>", "Admin public key (for --base58 mode)")
    .requiredOption("--participant <PUBKEY>", "Participant public key")
    .requiredOption("--bucket-name <NAME>", "Bucket name")
    .requiredOption("--new-allocation <AMOUNT>", "New allocation amount")
    .requiredOption("--vesting-plan <NAME>", "Vesting plan name")
    .option("--tokens-claimed <AMOUNT>", "Tokens already claimed", "0")
    .option("--tokens-burnt <AMOUNT>", "Tokens already burnt", "0")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse(process.argv);

  return cli.opts();
}

async function main() {
  const options = parseCliArgs();
  const participant = new PublicKey(options.participant);
  const newAllocation = new anchor.BN(options.newAllocation);
  const tokensClaimed = new anchor.BN(options.tokensClaimed);
  const tokensBurnt = new anchor.BN(options.tokensBurnt);

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.admin) {
        console.error("--admin is required when using --base58");
        process.exit(1);
      }
      const admin = new web3.PublicKey(options.admin);
      const { setupDeterministicVestingTx } = await sdk.setupDeterministicVestingTx({
        admin,
        participant,
        bucketName: options.bucketName,
        newAllocation,
        vestingPlan: options.vestingPlan,
        tokensClaimed,
        tokensBurnt,
      });
      const encoded = await txToBase58(setupDeterministicVestingTx, admin);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit(!options.skipPassphrase);
      const admin = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", admin.toBase58());

      const { setupDeterministicVestingTx, config, bucket, vestingConfig } =
        await sdk.setupDeterministicVestingTx({
          admin,
          participant,
          bucketName: options.bucketName,
          newAllocation,
          vestingPlan: options.vestingPlan,
          tokensClaimed,
          tokensBurnt,
        });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider, setupDeterministicVestingTx, admin, options.trezorPath,
      );

      console.log("✅ Success!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Bucket PDA:", bucket.toBase58());
      console.log("Vesting Config PDA:", vestingConfig.toBase58());
      console.log("Participant:", participant.toBase58());
      console.log("Bucket name:", options.bucketName);
      console.log("Allocation:", newAllocation.toString());
      console.log("Vesting plan:", options.vestingPlan);
      await trezorDispose();
      return;
    }

    if (!options.adminKeypair) {
      console.error("--admin-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const adminKeypair = await getKeypairFromFile(options.adminKeypair);
    const { signature, config, bucket, vestingConfig } = await sdk.setupDeterministicVesting({
      adminKeypair,
      participant,
      bucketName: options.bucketName,
      newAllocation,
      vestingPlan: options.vestingPlan,
      tokensClaimed,
      tokensBurnt,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log("Vesting Config PDA:", vestingConfig.toBase58());
    console.log("Participant:", participant.toBase58());
    console.log("Bucket name:", options.bucketName);
    console.log("Allocation:", newAllocation.toString());
    console.log("Vesting plan:", options.vestingPlan);
  });
}

main();
