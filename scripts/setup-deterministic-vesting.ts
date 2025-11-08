import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";
import { PublicKey } from "@solana/web3.js";

import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--admin-keypair <PATH>", "Path to admin keypair file")
    .requiredOption("--participant <PUBKEY>", "Participant public key")
    .requiredOption("--bucket-name <NAME>", "Bucket name")
    .requiredOption("--new-allocation <AMOUNT>", "New allocation amount")
    .requiredOption("--vesting-plan <NAME>", "Vesting plan name")
    .option("--tokens-claimed <AMOUNT>", "Tokens already claimed", "0")
    .option("--tokens-burnt <AMOUNT>", "Tokens already burnt", "0")
    .parse(process.argv);

  const options = cli.opts();

  const adminKeypair = await getKeypairFromFile(options.adminKeypair);
  const participant = new PublicKey(options.participant);

  return {
    adminKeypair,
    participant,
    bucketName: options.bucketName,
    newAllocation: new anchor.BN(options.newAllocation),
    vestingPlan: options.vestingPlan,
    tokensClaimed: new anchor.BN(options.tokensClaimed),
    tokensBurnt: new anchor.BN(options.tokensBurnt),
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, bucket, vestingConfig } = await sdk.setupDeterministicVesting({
      adminKeypair: options.adminKeypair,
      participant: options.participant,
      bucketName: options.bucketName,
      newAllocation: options.newAllocation,
      vestingPlan: options.vestingPlan,
      tokensClaimed: options.tokensClaimed,
      tokensBurnt: options.tokensBurnt,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log("Vesting Config PDA:", vestingConfig.toBase58());
    console.log("Participant:", options.participant.toBase58());
    console.log("Bucket name:", options.bucketName);
    console.log("Allocation:", options.newAllocation.toString());
    console.log("Vesting plan:", options.vestingPlan);
  });
}

main();
