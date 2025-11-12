import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { runWithSdk, getExplorerUrl } from "./utils";

function parseCliArgs() {
  const cli = new Command();

  cli
    .name("initialize")
    .description("Initialize XyberSale configuration")
    .requiredOption("--admin <PUBKEY>", "New admin public key")
    .requiredOption("--multisig <PUBKEY>", "Multisig public key")
    .requiredOption("--base-mint <PUBKEY>", "Base token mint address")
    .parse(process.argv);

  const options = cli.opts();

  return {
    admin: new web3.PublicKey(options.admin),
    multisig: new web3.PublicKey(options.multisig),
    baseMint: new web3.PublicKey(options.baseMint),
  };
}

async function main() {
  const options = parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, bucketPool } = await sdk.initialize({
      adminKeypair: (provider.wallet as any).payer,
      newAdmin: options.admin,
      multisig: options.multisig,
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
