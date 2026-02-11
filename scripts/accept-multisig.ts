import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";
import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .name("accept-multisig")
    .description("Accept a pending multisig transfer")
    .requiredOption("--new-multisig-keypair <PATH>", "Path to the new multisig keypair file")
    .parse();

  const opts = cli.opts();

  const newMultisigKeypair = await getKeypairFromFile(opts.newMultisigKeypair);

  return {
    newMultisigKeypair,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config } = await sdk.acceptMultisig({
      newMultisigKeypair: options.newMultisigKeypair,
    });

    console.log("Multisig transfer accepted!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("New multisig:", options.newMultisigKeypair.publicKey.toBase58());
  });
}

main();
