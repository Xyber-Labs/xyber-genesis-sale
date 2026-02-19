import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl, txToBase58 } from "./utils";
import { trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose } from "@xyber-labs/trezor-utils";

function parseCliArgs() {
  const cli = new Command();
  cli
    .option("--admin-keypair <PATH>", "Path to admin keypair file")
    .option("--admin <PUBKEY>", "Admin public key (for --base58 mode)")
    .requiredOption("--vesting-plan-name <NAME>", "Vesting plan name")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse(process.argv);

  return cli.opts();
}

function buildPlan() {
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

  return { periods };
}

async function main() {
  const options = parseCliArgs();
  const plan = buildPlan();

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
      await trezorInit("XyberSale", !options.skipPassphrase);
      const admin = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", admin.toBase58());

      const { setupVestingPlanTx, config, vestingPlan } = await sdk.setupVestingPlanTx({
        admin,
        vestingPlanName: options.vestingPlanName,
        plan,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider.connection, setupVestingPlanTx, admin, options.trezorPath,
      );

      console.log("✅ Success!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Vesting Plan PDA:", vestingPlan.toBase58());
      console.log("Vesting plan name:", options.vestingPlanName);
      console.log("Periods count:", plan.periods.length);
      console.log("Monthly unlock ratio:", (1.0 / 24.0).toFixed(4));
      console.log("Vesting duration: 24 months (linear)");
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
    console.log("Vesting plan name:", options.vestingPlanName);
    console.log("Periods count:", plan.periods.length);
    console.log("Monthly unlock ratio:", (1.0 / 24.0).toFixed(4));
    console.log("Vesting duration: 24 months (linear)");
  });
}

main();
