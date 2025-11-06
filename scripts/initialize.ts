import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { getKeypairFromFile } from "@solana-developers/node-helpers";
import { Command } from "commander";
import XyberSaleSDK from "@xyber-labs/xyber-sale-sdk";
import { XyberSale } from "../target/types/xyber_sale";
import { getExplorerUrl } from "../scripts/utils";

const program = anchor.workspace.XyberSale as Program<XyberSale>;

async function main() {
  const cli = new Command();

  cli
    .name("initialize")
    .description("Initialize XyberSale configuration")
    .requiredOption("--admin <PUBKEY>", "New admin public key")
    .requiredOption("--owner <PUBKEY>", "Owner public key")
    .option("--deployer-path <PATH>", "Path to deployer keypair file (defaults to ANCHOR_WALLET)")
    .parse(process.argv);

  const options = cli.opts();

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const adminPubkey = new web3.PublicKey(options.admin);
  const ownerPubkey = new web3.PublicKey(options.owner);

  let deployerKeypair: web3.Keypair;
  if (options.deployerPath) {
    deployerKeypair = await getKeypairFromFile(options.deployerPath);
  } else {
    deployerKeypair = (provider.wallet as any).payer as web3.Keypair;
  }

  console.log("Deployer:", deployerKeypair.publicKey.toBase58());
  console.log("New Admin:", adminPubkey.toBase58());
  console.log("Owner:", ownerPubkey.toBase58());

  const sdk = XyberSaleSDK.create(provider, program);

  await initialize(sdk, deployerKeypair, adminPubkey, ownerPubkey, provider);
}

async function initialize(
  sdk: ReturnType<typeof XyberSaleSDK.create>,
  deployerKeypair: web3.Keypair,
  admin: web3.PublicKey,
  owner: web3.PublicKey,
  provider: anchor.AnchorProvider
) {
  const { signature, config } = await sdk.initialize({
    adminKeypair: deployerKeypair,
    newAdmin: admin,
    owner: owner,
  });

  console.log("\nConfig PDA:", config.toBase58());
  console.log("Transaction:", signature);
  console.log("Explorer:", getExplorerUrl(provider, signature));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
