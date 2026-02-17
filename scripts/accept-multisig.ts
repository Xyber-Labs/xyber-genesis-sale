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
    .name("accept-multisig")
    .description("Accept a pending multisig transfer")
    .option("--new-multisig-keypair <PATH>", "Path to the new multisig keypair file")
    .option("--new-multisig <PUBKEY>", "New multisig public key (for --base58 mode)")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse();

  return cli.opts();
}

async function main() {
  const options = parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.newMultisig) {
        console.error("--new-multisig is required when using --base58");
        process.exit(1);
      }
      const newMultisig = new web3.PublicKey(options.newMultisig);
      const { acceptMultisigTx } = await sdk.acceptMultisigTx({
        newMultisig,
      });
      const encoded = await txToBase58(acceptMultisigTx, newMultisig);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit(!options.skipPassphrase);
      const newMultisig = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", newMultisig.toBase58());

      const { acceptMultisigTx, config } = await sdk.acceptMultisigTx({
        newMultisig,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider, acceptMultisigTx, newMultisig, options.trezorPath,
      );

      console.log("Multisig transfer accepted!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("New multisig:", newMultisig.toBase58());
      await trezorDispose();
      return;
    }

    if (!options.newMultisigKeypair) {
      console.error("--new-multisig-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const newMultisigKeypair = await getKeypairFromFile(options.newMultisigKeypair);
    const { signature, config } = await sdk.acceptMultisig({
      newMultisigKeypair,
    });

    console.log("Multisig transfer accepted!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("New multisig:", newMultisigKeypair.publicKey.toBase58());
  });
}

main();
