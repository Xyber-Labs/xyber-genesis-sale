import { Command } from "commander";
import { PublicKey } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/node-helpers";
import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--multisig-keypair <PATH>", "Path to multisig keypair file")
    .requiredOption("--withdraw-owner <PUBKEY>", "Owner of the withdraw ATA")
    .parse();

  const opts = cli.opts();

  const multisigKeypair = await getKeypairFromFile(opts.multisigKeypair);
  const withdrawOwner = new PublicKey(opts.withdrawOwner);

  return {
    multisigKeypair,
    withdrawOwner,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, bucketPool } = await sdk.withdrawAsset({
      multisigKeypair: options.multisigKeypair,
      withdrawOwner: options.withdrawOwner,
    });

    console.log("✅ Quote tokens withdrawn successfully!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket Pool PDA:", bucketPool.toBase58());
  });
}

main();
