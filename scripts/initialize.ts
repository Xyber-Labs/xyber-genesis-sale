import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";
import { runWithSdk, getExplorerUrl } from "./utils";

async function parseCliArgs() {
  const cli = new Command();

  cli
    .name("initialize")
    .description("Initialize XyberSale configuration")
    .requiredOption("--authority-keypair <PATH>", "Path to authority keypair file (DEPLOYER or multisig)")
    .requiredOption("--admin <PUBKEY>", "New admin public key")
    .requiredOption("--base-mint <PUBKEY>", "Base token mint address")
    .parse(process.argv);

  const options = cli.opts();

  const authorityKeypair = await getKeypairFromFile(options.authorityKeypair);

  return {
    authorityKeypair,
    admin: new web3.PublicKey(options.admin),
    baseMint: new web3.PublicKey(options.baseMint),
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, bucketPool } = await sdk.initialize({
      adminKeypair: options.authorityKeypair,
      newAdmin: options.admin,
      baseMint: options.baseMint,
    });

    console.log("✅ Success!");
    console.log("Transaction signature:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket Pool PDA:", bucketPool.toBase58());
  });
}

main();
