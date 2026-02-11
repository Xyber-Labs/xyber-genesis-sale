import { Command } from "commander";
import { PublicKey } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/node-helpers";
import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .name("propose-multisig")
    .description("Propose a new multisig for two-step ownership transfer")
    .requiredOption("--authority-keypair <PATH>", "Path to authority keypair file (DEPLOYER or current multisig)")
    .requiredOption("--new-multisig <PUBKEY>", "New multisig public key to propose")
    .parse();

  const opts = cli.opts();

  const authorityKeypair = await getKeypairFromFile(opts.authorityKeypair);
  const newMultisig = new PublicKey(opts.newMultisig);

  return {
    authorityKeypair,
    newMultisig,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config } = await sdk.proposeMultisig({
      authorityKeypair: options.authorityKeypair,
      newMultisig: options.newMultisig,
    });

    console.log("Multisig transfer proposed!");
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Pending multisig:", options.newMultisig.toBase58());
  });
}

main();
