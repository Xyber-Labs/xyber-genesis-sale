import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl, txToBase58 } from "./utils";
import { trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose } from "@xyber-labs/trezor-utils";

function parseCliArgs() {
  const cli = new Command();

  cli
    .name("initialize")
    .description("Initialize XyberSale configuration")
    .option("--authority-keypair <PATH>", "Path to authority keypair file (DEPLOYER or multisig)")
    .option("--authority <PUBKEY>", "Authority public key (for --base58 mode)")
    .requiredOption("--admin <PUBKEY>", "New admin public key")
    .requiredOption("--base-mint <PUBKEY>", "Base token mint address")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse(process.argv);

  return cli.opts();
}

async function main() {
  const options = parseCliArgs();
  const newAdmin = new web3.PublicKey(options.admin);
  const baseMint = new web3.PublicKey(options.baseMint);

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.authority) {
        console.error("--authority is required when using --base58");
        process.exit(1);
      }
      const authority = new web3.PublicKey(options.authority);
      const { initializeTx } = await sdk.initializeTx({
        admin: authority,
        newAdmin,
        baseMint,
      });
      const encoded = await txToBase58(initializeTx, authority);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit("XyberSale", !options.skipPassphrase);
      const authority = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", authority.toBase58());

      const { initializeTx, config, bucketPool } = await sdk.initializeTx({
        admin: authority,
        newAdmin,
        baseMint,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider.connection, initializeTx, authority, options.trezorPath,
      );

      console.log("✅ Success!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Bucket Pool PDA:", bucketPool.toBase58());
      await trezorDispose();
      return;
    }

    if (!options.authorityKeypair) {
      console.error("--authority-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const authorityKeypair = await getKeypairFromFile(options.authorityKeypair);
    const { signature, config, bucketPool } = await sdk.initialize({
      adminKeypair: authorityKeypair,
      newAdmin,
      baseMint,
    });

    console.log("✅ Success!");
    console.log("Transaction signature:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket Pool PDA:", bucketPool.toBase58());
  });
}

main();
