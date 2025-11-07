import { Command } from "commander";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getKeypairFromFile } from "@solana-developers/node-helpers";
import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--multisig-keypair <PATH>", "Path to multisig keypair file")
    .requiredOption("--bucket-name <NAME>", "Bucket name")
    .requiredOption("--amount <AMOUNT>", "Amount of base tokens to withdraw")
    .requiredOption("--withdraw-owner <PUBKEY>", "Owner of the withdraw ATA")
    .parse();

  const opts = cli.opts();

  const multisigKeypair = await getKeypairFromFile(opts.multisigKeypair);
  const withdrawOwner = new PublicKey(opts.withdrawOwner);
  const amount = new BN(opts.amount);

  return {
    multisigKeypair,
    bucketName: opts.bucketName,
    amount,
    withdrawOwner,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, bucket } = await sdk.withdrawUnsoldTokens({
      multisigKeypair: options.multisigKeypair,
      bucketName: options.bucketName,
      amount: options.amount,
      withdrawOwner: options.withdrawOwner,
    });

    console.log("✅ Unsold tokens withdrawn successfully!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log(`Amount withdrawn: ${options.amount.toString()} tokens`);
  });
}

main();
