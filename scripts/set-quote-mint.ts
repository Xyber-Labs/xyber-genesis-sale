import { BN, web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl, txToBase58 } from "./utils";
import { trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose } from "@xyber-labs/trezor-utils";

function parseCliArgs() {
  const cli = new Command();

  cli
    .name("set-quote-mint")
    .description("Set or update quote mint configuration with price")
    .option("--multisig-keypair <PATH>", "Path to multisig keypair JSON file")
    .option("--multisig <PUBKEY>", "Multisig public key (for --base58 mode)")
    .requiredOption("--quote-mint <PUBKEY>", "Quote token mint address (USDT, USDC, etc.)")
    .requiredOption("--price <NUMBER>", "Price value (e.g., 200 for $200/SOL)")
    .requiredOption("--expo <NUMBER>", "Price exponent (e.g., 0 for simple prices, -8 for Pyth format)")
    .option("--is-enabled <BOOLEAN>", "Enable/disable this quote mint", "true")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse(process.argv);

  return cli.opts();
}

async function main() {
  const options = parseCliArgs();
  const quoteMint = new web3.PublicKey(options.quoteMint);
  const price = new BN(options.price);
  const expo = parseInt(options.expo);
  const isEnabled = options.isEnabled === "true";

  await runWithSdk(async ({ provider, sdk }) => {
    if (options.base58) {
      if (!options.multisig) {
        console.error("--multisig is required when using --base58");
        process.exit(1);
      }
      const multisig = new web3.PublicKey(options.multisig);
      const { setQuoteMintTx } = await sdk.setQuoteMintTx({
        multisig,
        quoteMint,
        price,
        expo,
        isEnabled,
      });
      const encoded = await txToBase58(setQuoteMintTx, multisig);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit("XyberSale", !options.skipPassphrase);
      const multisig = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", multisig.toBase58());

      const { setQuoteMintTx, config, quoteConfig } = await sdk.setQuoteMintTx({
        multisig,
        quoteMint,
        price,
        expo,
        isEnabled,
      });

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(
        provider.connection, setQuoteMintTx, multisig, options.trezorPath,
      );

      console.log("✅ Success!");
      console.log("Explorer:", getExplorerUrl(provider, signature));
      console.log("Config PDA:", config.toBase58());
      console.log("Quote Config PDA:", quoteConfig.toBase58());
      console.log("Quote Mint:", quoteMint.toBase58());
      console.log("Price:", price.toString());
      console.log("Expo:", expo);
      console.log("Enabled:", isEnabled);
      await trezorDispose();
      return;
    }

    if (!options.multisigKeypair) {
      console.error("--multisig-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const multisigKeypair = await getKeypairFromFile(options.multisigKeypair);
    const { signature, config, quoteConfig } = await sdk.setQuoteMint({
      multisigKeypair,
      quoteMint,
      price,
      expo,
      isEnabled,
    });

    console.log("✅ Success!");
    console.log("Transaction signature:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Quote Config PDA:", quoteConfig.toBase58());
    console.log("Quote Mint:", quoteMint.toBase58());
    console.log("Price:", price.toString());
    console.log("Expo:", expo);
    console.log("Enabled:", isEnabled);
  });
}

main();
