import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl } from "./utils";

interface PeriodArgs {
  startTimestamp: string;
  claimRatio: string;
  burnRatio: string;
  basePeriodIndex?: string;
}

async function parseCliArgs() {
  const cli = new Command();

  const periods: PeriodArgs[] = [];

  cli
    .requiredOption("--admin-keypair <PATH>", "Path to admin keypair file")
    .requiredOption("--vesting-plan-name <NAME>", "Vesting plan name")
    .requiredOption(
      "--period <START_TIME,CLAIM_RATIO,BURN_RATIO[,BASE_PERIOD_INDEX]>",
      "Vesting period (can be specified multiple times)",
      (value: string) => {
        const parts = value.split(",");
        if (parts.length < 3 || parts.length > 4) {
          throw new Error(
            "Period format: START_TIME,CLAIM_RATIO,BURN_RATIO[,BASE_PERIOD_INDEX]"
          );
        }
        periods.push({
          startTimestamp: parts[0],
          claimRatio: parts[1],
          burnRatio: parts[2],
          basePeriodIndex: parts[3],
        });
        return value;
      }
    )
    .parse(process.argv);

  const options = cli.opts();

  if (periods.length === 0) {
    throw new Error("At least one period must be specified");
  }

  const adminKeypair = await getKeypairFromFile(options.adminKeypair);

  const plan = {
    periods: periods.map((p) => ({
      startTimestamp: new anchor.BN(p.startTimestamp),
      claimRatio: parseFloat(p.claimRatio),
      burnRatio: parseFloat(p.burnRatio),
      basePeriodIndex: p.basePeriodIndex !== undefined ? parseInt(p.basePeriodIndex) : null,
    })),
  };

  return {
    adminKeypair,
    vestingPlanName: options.vestingPlanName,
    plan,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, vestingPlan } = await sdk.setupVestingPlan({
      adminKeypair: options.adminKeypair,
      vestingPlanName: options.vestingPlanName,
      plan: options.plan,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Vesting Plan PDA:", vestingPlan.toBase58());
    console.log("Vesting Plan Name:", options.vestingPlanName);
    console.log("Periods:", options.plan.periods.length);
  });
}

main();
