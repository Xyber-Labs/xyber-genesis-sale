import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl } from "./utils";
import { getRound } from "../ts-sdk/src/utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--buyer-keypair <PATH>", "Path to buyer keypair file")
    .requiredOption("--round <ROUND>", "Round name (e.g., 'public')")
    .requiredOption("--quote-mint <PUBKEY>", "Quote token mint address")
    .requiredOption("--payment-amount <AMOUNT>", "Payment amount in quote token's smallest units")
    .parse(process.argv);

  const options = cli.opts();

  const buyerKeypair = await getKeypairFromFile(options.buyerKeypair);
  const round = getRound(options.round);

  return {
    buyerKeypair,
    round,
    quoteMint: new anchor.web3.PublicKey(options.quoteMint),
    paymentAmount: new anchor.BN(options.paymentAmount),
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, roundConfig, vestingConfig, bucket } = await sdk.depositAsset({
      buyerKeypair: options.buyerKeypair,
      round: options.round,
      quoteMint: options.quoteMint,
      paymentAmount: options.paymentAmount,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Round Config PDA:", roundConfig.toBase58());
    console.log("Vesting Config PDA:", vestingConfig.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log("Quote Mint:", options.quoteMint.toBase58());
    console.log("Payment Amount:", options.paymentAmount.toString());
  });
}

main();
