import { web3 } from "@coral-xyz/anchor";
import { Command } from "commander";
import { runWithSdk, getExplorerUrl } from "./utils";

function parseCliArgs() {
  const cli = new Command();

  cli
    .name("initialize")
    .description("Initialize XyberSale configuration")
    .requiredOption("--admin <PUBKEY>", "New admin public key")
    .requiredOption("--backend <PUBKEY>", "Backend public key")
    .requiredOption("--multisig <PUBKEY>", "Multisig public key")
    .requiredOption("--base-mint <PUBKEY>", "Base token mint address")
    .requiredOption("--quote-mint <PUBKEY>", "Quote token mint address")
    .parse(process.argv);

  const options = cli.opts();

  return {
    admin: new web3.PublicKey(options.admin),
    backend: new web3.PublicKey(options.backend),
    multisig: new web3.PublicKey(options.multisig),
    baseMint: new web3.PublicKey(options.baseMint),
    quoteMint: new web3.PublicKey(options.quoteMint),
  };
}

async function main() {
  const options = parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const { signature, config, bucketPool } = await sdk.initialize({
      adminKeypair: (provider.wallet as any).payer,
      newAdmin: options.admin,
      backend: options.backend,
      multisig: options.multisig,
      baseMint: options.baseMint,
      quoteMint: options.quoteMint,
    });

    console.log("✅ Success!");
    console.log("Transaction signature:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket Pool PDA:", bucketPool.toBase58());
  });
}

main();
