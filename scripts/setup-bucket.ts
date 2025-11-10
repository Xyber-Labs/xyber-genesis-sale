import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--admin-keypair <PATH>", "Path to admin keypair file")
    .requiredOption("--bucket-name <NAME>", "Bucket name")
    .requiredOption("--bucket-supply <AMOUNT>", "Total bucket supply")
    .requiredOption("--vesting-type <TYPE>", "Vesting type: deterministic or deposit-based")
    .option("--total-deposit <AMOUNT>", "Total deposit (required for deposit-based)")
    .option("--registered-supply <AMOUNT>", "Registered supply", "0")
    .option("--claimed-supply <AMOUNT>", "Claimed supply", "0")
    .option("--burnt-supply <AMOUNT>", "Burnt supply", "0")
    .option("--vesting-plan <ITEMS>", "Comma-separated vesting plan items", "")
    .parse(process.argv);

  const options = cli.opts();

  const adminKeypair = await getKeypairFromFile(options.adminKeypair);

  const vestingPlan = options.vestingPlan
    ? options.vestingPlan.split(",").map((item: string) => item.trim())
    : [];

  let vestingType;
  if (options.vestingType === "deterministic") {
    vestingType = { deterministic: {} };
  } else if (options.vestingType === "deposit-based") {
    vestingType = { depositBased: {} };
  } else {
    throw new Error(`Invalid vesting type: ${options.vestingType}. Use "deterministic" or "deposit-based"`);
  }

  return {
    adminKeypair,
    bucketName: options.bucketName,
    bucketData: {
      vestingType,
      totalDeposit: new anchor.BN(options.totalDeposit || "0"),
      bucketSupply: new anchor.BN(options.bucketSupply),
      registeredSupply: new anchor.BN(options.registeredSupply),
      claimedSupply: new anchor.BN(options.claimedSupply),
      burntSupply: new anchor.BN(options.burntSupply),
      vestingPlan,
    },
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, bucket, bucketBaseAta } = await sdk.setupBucket({
      adminKeypair: options.adminKeypair,
      bucketName: options.bucketName,
      bucketData: options.bucketData,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log("Bucket Base ATA:", bucketBaseAta.toBase58());
    console.log("Bucket name:", options.bucketName);
    console.log("Bucket supply:", options.bucketData.bucketSupply.toString());
    console.log("Vesting plan:", options.bucketData.vestingPlan.join(", "));
  });
}

main();
