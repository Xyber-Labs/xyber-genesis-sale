import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { PublicKey } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl, txToBase58 } from "./utils";
import { trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose } from "@xyber-labs/trezor-utils";

function parseCliArgs() {
  const cli = new Command();
  cli
    .name("propose-multisig")
    .description("Propose a new multisig for two-step ownership transfer")
    .option("--authority-keypair <PATH>", "Path to authority keypair file (DEPLOYER or current multisig)")
    .option("--authority <PUBKEY>", "Authority public key (for --base58 mode)")
    .requiredOption("--new-multisig <PUBKEY>", "New multisig public key to propose")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse();

  return cli.opts();
}

async function main() {
  const options = parseCliArgs();
  const newMultisig = new PublicKey(options.newMultisig);

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.authority) {
        console.error("--authority is required when using --base58");
        process.exit(1);
      }
      const authority = new web3.PublicKey(options.authority);
      const { proposeMultisigTx } = await sdk.proposeMultisigTx({
        authority,
        newMultisig,
      });
      const encoded = await txToBase58(proposeMultisigTx, authority);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit("XyberSale", !options.skipPassphrase);
      const authority = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", authority.toBase58());

      const { proposeMultisigTx, config } = await sdk.proposeMultisigTx({
        authority,
        newMultisig,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider.connection, proposeMultisigTx, authority, options.trezorPath,
      );

      console.log("Multisig transfer proposed!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Pending multisig:", newMultisig.toBase58());
      await trezorDispose();
      return;
    }

    if (!options.authorityKeypair) {
      console.error("--authority-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const authorityKeypair = await getKeypairFromFile(options.authorityKeypair);
    const { signature, config } = await sdk.proposeMultisig({
      authorityKeypair,
      newMultisig,
    });

    console.log("Multisig transfer proposed!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Pending multisig:", newMultisig.toBase58());
  });
}

main();
