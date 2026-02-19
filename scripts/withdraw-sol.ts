import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { PublicKey } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl, txToBase58 } from "./utils";
import { trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose } from "@xyber-labs/trezor-utils";

function parseCliArgs() {
  const cli = new Command();
  cli
    .option("--multisig-keypair <PATH>", "Path to multisig keypair file")
    .option("--multisig <PUBKEY>", "Multisig public key (for --base58 mode)")
    .requiredOption("--address-to-withdraw-to <PUBKEY>", "Address to withdraw SOL to")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse();

  return cli.opts();
}

async function main() {
  const options = parseCliArgs();
  const addressToWithdrawTo = new PublicKey(options.addressToWithdrawTo);

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.multisig) {
        console.error("--multisig is required when using --base58");
        process.exit(1);
      }
      const multisig = new web3.PublicKey(options.multisig);
      const { withdrawSolTx } = await sdk.withdrawSolTx({
        multisig,
        addressToWithdrawTo,
      });
      const encoded = await txToBase58(withdrawSolTx, multisig);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit("XyberSale", !options.skipPassphrase);
      const multisig = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", multisig.toBase58());

      const { withdrawSolTx, config, bucketPool } = await sdk.withdrawSolTx({
        multisig,
        addressToWithdrawTo,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider.connection, withdrawSolTx, multisig, options.trezorPath,
      );

      console.log("✅ SOL withdrawn successfully!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Bucket Pool PDA:", bucketPool.toBase58());
      await trezorDispose();
      return;
    }

    if (!options.multisigKeypair) {
      console.error("--multisig-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const multisigKeypair = await getKeypairFromFile(options.multisigKeypair);
    const { signature, config, bucketPool } = await sdk.withdrawSol({
      multisigKeypair,
      addressToWithdrawTo,
    });

    console.log("✅ SOL withdrawn successfully!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket Pool PDA:", bucketPool.toBase58());
  });
}

main();
