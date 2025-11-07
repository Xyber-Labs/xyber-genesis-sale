import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl } from "./utils";
import { getRound } from "../ts-sdk/src/utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--buyer-keypair <PATH>", "Path to buyer keypair file")
    .requiredOption("--backend-keypair <PATH>", "Path to backend keypair file")
    .requiredOption("--round <ROUND>", "Round name (e.g., 'public')")
    .requiredOption("--base-allocation <AMOUNT>", "Base token allocation amount")
    .option("--expiration <UNIX_TIMESTAMP>", "Signature expiration time (Unix timestamp, default: now + 10 minutes)")
    .parse(process.argv);

  const options = cli.opts();

  const buyerKeypair = await getKeypairFromFile(options.buyerKeypair);
  const backendKeypair = await getKeypairFromFile(options.backendKeypair);
  const round = getRound(options.round);

  const now = Math.floor(Date.now() / 1000);
  const expiration = options.expiration ? new anchor.BN(options.expiration) : new anchor.BN(now + 600);

  return {
    buyerKeypair,
    backendKeypair,
    round,
    baseAllocation: new anchor.BN(options.baseAllocation),
    expiration,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, roundConfig, vestingConfig, bucket } = await sdk.depositAsset({
      buyerKeypair: options.buyerKeypair,
      backendKeypair: options.backendKeypair,
      round: options.round,
      baseAllocation: options.baseAllocation,
      expiration: options.expiration,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Round Config PDA:", roundConfig.toBase58());
    console.log("Vesting Config PDA:", vestingConfig.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log("Base Allocation:", options.baseAllocation.toString());
  });
}

main();
