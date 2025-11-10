import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--admin-keypair <PATH>", "Path to admin keypair file")
    .option("--start-time <UNIX_TIMESTAMP>", "Round start time (Unix timestamp, default: now - 60)")
    .option("--end-time <UNIX_TIMESTAMP>", "Round end time (Unix timestamp, default: now + 1 hour)")
    .parse(process.argv);

  const options = cli.opts();

  const adminKeypair = await getKeypairFromFile(options.adminKeypair);

  const now = Math.floor(Date.now() / 1000);
  const startTime = options.startTime ? new anchor.BN(options.startTime) : new anchor.BN(now - 60);
  const endTime = options.endTime ? new anchor.BN(options.endTime) : new anchor.BN(now + 3600);

  return {
    adminKeypair,
    startTime,
    endTime,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, roundConfig } = await sdk.setupRound({
      adminKeypair: options.adminKeypair,
      round: { public: {} },
      startTime: options.startTime,
      endTime: options.endTime,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Round Config PDA:", roundConfig.toBase58());
    console.log("Start time:", options.startTime.toString());
    console.log("End time:", options.endTime.toString());
  });
}

main();
