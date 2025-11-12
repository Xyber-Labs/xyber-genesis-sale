import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk, getExplorerUrl } from "./utils";
import { getRound, parseRound } from "../ts-sdk/src/utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--buyer-keypair <PATH>", "Path to buyer keypair file")
    .requiredOption("--round <ROUND>", "Round name (e.g., 'public')")
    .requiredOption("--payment-amount <AMOUNT>", "Payment amount in lamports")
    .parse(process.argv);

  const options = cli.opts();

  const buyerKeypair = await getKeypairFromFile(options.buyerKeypair);
  const round = getRound(options.round);

  return {
    buyerKeypair,
    round,
    paymentAmount: new anchor.BN(options.paymentAmount),
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, roundConfig, vestingConfig, bucket } = await sdk.depositSol({
      buyerKeypair: options.buyerKeypair,
      round: options.round,
      paymentAmount: options.paymentAmount,
    });

    console.log("✅ Success!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Round Config PDA:", roundConfig.toBase58());
    console.log("Vesting Config PDA:", vestingConfig.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log("Payment Amount (lamports):", options.paymentAmount.toString());
    console.log("Payment Amount (SOL):", (options.paymentAmount.toNumber() / 1e9).toFixed(2));
  });
}

main();
