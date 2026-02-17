import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import {
  runWithSdk, getExplorerUrl, txToBase58,
  trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose,
} from "./utils";

function parseCliArgs() {
  const cli = new Command();
  cli
    .option("--admin-keypair <PATH>", "Path to admin keypair file")
    .option("--admin <PUBKEY>", "Admin public key (for --base58 mode)")
    .requiredOption("--bucket-name <NAME>", "Bucket name")
    .requiredOption("--bucket-supply <AMOUNT>", "Total bucket supply")
    .requiredOption("--vesting-type <TYPE>", "Vesting type: deterministic or priceless")
    .option("--total-deposit <AMOUNT>", "Total deposit (required for priceless)")
    .option("--registered-supply <AMOUNT>", "Registered supply", "0")
    .option("--claimed-supply <AMOUNT>", "Claimed supply", "0")
    .option("--burnt-supply <AMOUNT>", "Burnt supply", "0")
    .option("--vesting-plan <ITEMS>", "Comma-separated vesting plan items", "")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse(process.argv);

  return cli.opts();
}

function parseBucketData(options: any) {
  const vestingPlan = options.vestingPlan
    ? options.vestingPlan.split(",").map((item: string) => item.trim())
    : [];

  let vestingType;
  if (options.vestingType === "deterministic") {
    vestingType = { deterministic: {} };
  } else if (options.vestingType === "priceless") {
    vestingType = { priceless: {} };
  } else {
    throw new Error(`Invalid vesting type: ${options.vestingType}. Use "deterministic" or "priceless"`);
  }

  return {
    vestingType,
    totalDeposit: new anchor.BN(options.totalDeposit || "0"),
    bucketSupply: new anchor.BN(options.bucketSupply),
    registeredSupply: new anchor.BN(options.registeredSupply),
    claimedSupply: new anchor.BN(options.claimedSupply),
    burntSupply: new anchor.BN(options.burntSupply),
    vestingPlan,
  };
}

async function main() {
  const options = parseCliArgs();
  const bucketData = parseBucketData(options);

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.admin) {
        console.error("--admin is required when using --base58");
        process.exit(1);
      }
      const admin = new web3.PublicKey(options.admin);
      const { setupBucketTx } = await sdk.setupBucketTx({
        admin,
        bucketName: options.bucketName,
        bucketData,
      });
      const encoded = await txToBase58(setupBucketTx, admin);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit(!options.skipPassphrase);
      const admin = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", admin.toBase58());

      const { setupBucketTx, config, bucket, bucketBaseAta } = await sdk.setupBucketTx({
        admin,
        bucketName: options.bucketName,
        bucketData,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider, setupBucketTx, admin, options.trezorPath,
      );

      console.log("✅ Success!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Bucket PDA:", bucket.toBase58());
      console.log("Bucket Base ATA:", bucketBaseAta.toBase58());
      console.log("Bucket name:", options.bucketName);
      console.log("Bucket supply:", bucketData.bucketSupply.toString());
      console.log("Vesting plan:", bucketData.vestingPlan.join(", "));
      await trezorDispose();
      return;
    }

    if (!options.adminKeypair) {
      console.error("--admin-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const adminKeypair = await getKeypairFromFile(options.adminKeypair);
    const { signature, config, bucket, bucketBaseAta } = await sdk.setupBucket({
      adminKeypair,
      bucketName: options.bucketName,
      bucketData,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log("Bucket Base ATA:", bucketBaseAta.toBase58());
    console.log("Bucket name:", options.bucketName);
    console.log("Bucket supply:", bucketData.bucketSupply.toString());
    console.log("Vesting plan:", bucketData.vestingPlan.join(", "));
  });
}

main();
