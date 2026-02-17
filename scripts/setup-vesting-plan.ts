import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import {
  runWithSdk, getExplorerUrl, txToBase58,
  trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose,
} from "./utils";

interface PeriodArgs {
  startTimestamp: string;
  claimRatio: string;
  burnRatio: string;
  basePeriodIndex?: string;
}

function parseCliArgs() {
  const cli = new Command();

  const periods: PeriodArgs[] = [];

  cli
    .option("--admin-keypair <PATH>", "Path to admin keypair file")
    .option("--admin <PUBKEY>", "Admin public key (for --base58 mode)")
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
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse(process.argv);

  if (periods.length === 0) {
    throw new Error("At least one period must be specified");
  }

  const options = cli.opts();

  const plan = {
    periods: periods.map((p) => ({
      startTimestamp: new anchor.BN(p.startTimestamp),
      claimRatio: parseFloat(p.claimRatio),
      burnRatio: parseFloat(p.burnRatio),
      basePeriodIndex: p.basePeriodIndex !== undefined ? parseInt(p.basePeriodIndex) : null,
    })),
  };

  return { options, plan };
}

async function main() {
  const { options, plan } = parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.admin) {
        console.error("--admin is required when using --base58");
        process.exit(1);
      }
      const admin = new web3.PublicKey(options.admin);
      const { setupVestingPlanTx } = await sdk.setupVestingPlanTx({
        admin,
        vestingPlanName: options.vestingPlanName,
        plan,
      });
      const encoded = await txToBase58(setupVestingPlanTx, admin);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit(!options.skipPassphrase);
      const admin = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", admin.toBase58());

      const { setupVestingPlanTx, config, vestingPlan } = await sdk.setupVestingPlanTx({
        admin,
        vestingPlanName: options.vestingPlanName,
        plan,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider, setupVestingPlanTx, admin, options.trezorPath,
      );

      console.log("✅ Success!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Vesting Plan PDA:", vestingPlan.toBase58());
      console.log("Vesting Plan Name:", options.vestingPlanName);
      console.log("Periods:", plan.periods.length);
      await trezorDispose();
      return;
    }

    if (!options.adminKeypair) {
      console.error("--admin-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const adminKeypair = await getKeypairFromFile(options.adminKeypair);
    const { signature, config, vestingPlan } = await sdk.setupVestingPlan({
      adminKeypair,
      vestingPlanName: options.vestingPlanName,
      plan,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Vesting Plan PDA:", vestingPlan.toBase58());
    console.log("Vesting Plan Name:", options.vestingPlanName);
    console.log("Periods:", plan.periods.length);
  });
}

main();
