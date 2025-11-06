import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--admin-keypair <PATH>", "Path to admin keypair file")
    .requiredOption("--start-time <UNIX_TIMESTAMP>", "Round start time (Unix timestamp)")
    .requiredOption("--end-time <UNIX_TIMESTAMP>", "Round end time (Unix timestamp)")
    .parse(process.argv);

  const options = cli.opts();

  const adminKeypair = await getKeypairFromFile(options.adminKeypair);

  return {
    adminKeypair,
    startTime: new anchor.BN(options.startTime),
    endTime: new anchor.BN(options.endTime),
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
