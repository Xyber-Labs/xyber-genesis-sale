import { Command } from "commander";
import { PublicKey } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/node-helpers";
import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--buyer-keypair <PATH>", "Path to buyer keypair file")
    .requiredOption("--bucket-name <STRING>", "Bucket name")
    .requiredOption("--vesting-plan <STRING>", "Vesting plan name")
    .parse();

  const opts = cli.opts();

  const buyerKeypair = await getKeypairFromFile(opts.buyerKeypair);

  return {
    buyerKeypair,
    bucketName: opts.bucketName,
    vestingPlanName: opts.vestingPlan,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, vestingPlan, vestingConfig, bucket } = await sdk.claim({
      buyerKeypair: options.buyerKeypair,
      bucketName: options.bucketName,
      vestingPlanName: options.vestingPlanName,
    });

    console.log("✅ Tokens claimed successfully!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Vesting Plan PDA:", vestingPlan.toBase58());
    console.log("Vesting Config PDA:", vestingConfig.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
  });
}

main();
