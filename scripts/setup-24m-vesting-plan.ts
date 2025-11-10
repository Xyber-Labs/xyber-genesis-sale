import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { getExplorerUrl, runWithSdk } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--admin-keypair <PATH>", "Path to admin keypair file")
    .requiredOption("--vesting-plan-name <NAME>", "Vesting plan name")
    .parse(process.argv);

  const options = cli.opts();

  const adminKeypair = await getKeypairFromFile(options.adminKeypair);

  return {
    adminKeypair,
    vestingPlanName: options.vestingPlanName,
  };
}

async function main() {
  const options = await parseCliArgs();

  const now = Math.floor(Date.now() / 1000);
  const oneMonth = 30 * 24 * 60 * 60;

  const periods = [];
  for (let i = 0; i < 24; i++) {
    periods.push({
      startTimestamp: new anchor.BN(now + i * oneMonth),
      claimRatio: 1.0 / 24.0,
      burnRatio: 0.0,
      basePeriodIndex: null,
    });
  }

  const plan = { periods };

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, vestingPlan } = await sdk.setupVestingPlan({
      adminKeypair: options.adminKeypair,
      vestingPlanName: options.vestingPlanName,
      plan: plan,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Vesting Plan PDA:", vestingPlan.toBase58());
    console.log("Vesting plan name:", options.vestingPlanName);
    console.log("Periods count:", periods.length);
    console.log("Monthly unlock ratio:", (1.0 / 24.0).toFixed(4));
    console.log("Vesting duration: 24 months (linear)");
  });
}

main();
