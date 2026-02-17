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
    .option("--start-time <UNIX_TIMESTAMP>", "Round start time (Unix timestamp, default: now - 60)")
    .option("--end-time <UNIX_TIMESTAMP>", "Round end time (Unix timestamp, default: now + 1 hour)")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse(process.argv);

  return cli.opts();
}

async function main() {
  const options = parseCliArgs();

  const now = Math.floor(Date.now() / 1000);
  const startTime = options.startTime ? new anchor.BN(options.startTime) : new anchor.BN(now - 60);
  const endTime = options.endTime ? new anchor.BN(options.endTime) : new anchor.BN(now + 3600);

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.admin) {
        console.error("--admin is required when using --base58");
        process.exit(1);
      }
      const admin = new web3.PublicKey(options.admin);
      const { setupRoundTx } = await sdk.setupRoundTx({
        admin,
        round: { public: {} },
        startTime,
        endTime,
      });
      const encoded = await txToBase58(setupRoundTx, admin);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit(!options.skipPassphrase);
      const admin = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", admin.toBase58());

      const { setupRoundTx, config, roundConfig } = await sdk.setupRoundTx({
        admin,
        round: { public: {} },
        startTime,
        endTime,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider, setupRoundTx, admin, options.trezorPath,
      );

      console.log("✅ Success!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Round Config PDA:", roundConfig.toBase58());
      console.log("Start time:", startTime.toString());
      console.log("End time:", endTime.toString());
      await trezorDispose();
      return;
    }

    if (!options.adminKeypair) {
      console.error("--admin-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const adminKeypair = await getKeypairFromFile(options.adminKeypair);
    const { signature, config, roundConfig } = await sdk.setupRound({
      adminKeypair,
      round: { public: {} },
      startTime,
      endTime,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Round Config PDA:", roundConfig.toBase58());
    console.log("Start time:", startTime.toString());
    console.log("End time:", endTime.toString());
  });
}

main();
