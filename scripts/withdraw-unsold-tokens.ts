import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl, txToBase58 } from "./utils";
import { trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose } from "@xyber-labs/trezor-utils";

function parseCliArgs() {
  const cli = new Command();
  cli
    .option("--multisig-keypair <PATH>", "Path to multisig keypair file")
    .option("--multisig <PUBKEY>", "Multisig public key (for --base58 mode)")
    .requiredOption("--bucket-name <NAME>", "Bucket name")
    .requiredOption("--amount <AMOUNT>", "Amount of base tokens to withdraw")
    .requiredOption("--withdraw-owner <PUBKEY>", "Owner of the withdraw ATA")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse();

  return cli.opts();
}

async function main() {
  const options = parseCliArgs();
  const withdrawOwner = new PublicKey(options.withdrawOwner);
  const amount = new BN(options.amount);

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.multisig) {
        console.error("--multisig is required when using --base58");
        process.exit(1);
      }
      const multisig = new web3.PublicKey(options.multisig);
      const { withdrawUnsoldTokensTx } = await sdk.withdrawUnsoldTokensTx({
        multisig,
        bucketName: options.bucketName,
        amount,
        withdrawOwner,
      });
      const encoded = await txToBase58(withdrawUnsoldTokensTx, multisig);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit("XyberSale", !options.skipPassphrase);
      const multisig = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", multisig.toBase58());

      const { withdrawUnsoldTokensTx, config, bucket } = await sdk.withdrawUnsoldTokensTx({
        multisig,
        bucketName: options.bucketName,
        amount,
        withdrawOwner,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider.connection, withdrawUnsoldTokensTx, multisig, options.trezorPath,
      );

      console.log("✅ Unsold tokens withdrawn successfully!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Bucket PDA:", bucket.toBase58());
      console.log(`Amount withdrawn: ${amount.toString()} tokens`);
      await trezorDispose();
      return;
    }

    if (!options.multisigKeypair) {
      console.error("--multisig-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const multisigKeypair = await getKeypairFromFile(options.multisigKeypair);
    const { signature, config, bucket } = await sdk.withdrawUnsoldTokens({
      multisigKeypair,
      bucketName: options.bucketName,
      amount,
      withdrawOwner,
    });

    console.log("✅ Unsold tokens withdrawn successfully!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log(`Amount withdrawn: ${amount.toString()} tokens`);
  });
}

main();
