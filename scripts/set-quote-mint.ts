import { BN, web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { readFileSync } from "fs";
import { runWithSdk, getExplorerUrl } from "./utils";

function parseCliArgs() {
  const cli = new Command();

  cli
    .name("set-quote-mint")
    .description("Set or update quote mint configuration with price")
    .requiredOption("--multisig-keypair <PATH>", "Path to multisig keypair JSON file")
    .requiredOption("--quote-mint <PUBKEY>", "Quote token mint address (USDT, USDC, etc.)")
    .requiredOption("--price <NUMBER>", "Price value (e.g., 200 for $200/SOL)")
    .requiredOption("--expo <NUMBER>", "Price exponent (e.g., 0 for simple prices, -8 for Pyth format)")
    .option("--is-enabled <BOOLEAN>", "Enable/disable this quote mint", "true")
    .parse(process.argv);

  const options = cli.opts();

  return {
    multisigKeypairPath: options.multisigKeypair,
    quoteMint: new web3.PublicKey(options.quoteMint),
    price: new BN(options.price),
    expo: parseInt(options.expo),
    isEnabled: options.isEnabled === "true",
  };
}

async function main() {
  const options = parseCliArgs();

  const multisigKeypair = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(options.multisigKeypairPath, "utf-8")))
  );

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, quoteConfig } = await sdk.setQuoteMint({
      multisigKeypair: multisigKeypair,
      quoteMint: options.quoteMint,
      price: options.price,
      expo: options.expo,
      isEnabled: options.isEnabled,
    });

    console.log("✅ Success!");
    console.log("Transaction signature:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Quote Config PDA:", quoteConfig.toBase58());
    console.log("Quote Mint:", options.quoteMint.toBase58());
    console.log("Price:", options.price.toString());
    console.log("Expo:", options.expo);
    console.log("Enabled:", options.isEnabled);
  });
}

main();
