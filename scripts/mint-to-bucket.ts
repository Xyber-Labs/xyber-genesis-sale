import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { runWithSdk } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--bucket-name <NAME>", "Bucket name")
    .requiredOption("--amount <AMOUNT>", "Amount of base tokens to mint")
    .option("--mint-authority <PATH>", "Path to mint authority keypair (default: ANCHOR_WALLET)")
    .parse(process.argv);

  const options = cli.opts();

  const mintAuthority = options.mintAuthority
    ? await getKeypairFromFile(options.mintAuthority)
    : null;

  return {
    bucketName: options.bucketName,
    amount: options.amount,
    mintAuthority,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const payerKeypair = (provider.wallet as anchor.Wallet).payer;
    const mintAuthority = options.mintAuthority || payerKeypair;

    const [config] = sdk.txBuilder.getConfigPda();
    const configAccount = await sdk.program.account.saleConfig.fetch(config);
    const baseMint = configAccount.baseMint;

    const [bucket] = sdk.txBuilder.getBucketPda(options.bucketName);

    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      bucket,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const mintAmount = parseInt(options.amount);
    const signature = await splToken.mintTo(
      provider.connection,
      payerKeypair,
      baseMint,
      bucketBaseAta,
      mintAuthority,
      mintAmount,
      [],
      null,
      splToken.TOKEN_PROGRAM_ID
    );

    console.log("✅ Success!");
    console.log("Transaction signature:", signature);
    console.log("Bucket:", bucket.toBase58());
    console.log("Base mint:", baseMint.toBase58());
    console.log("Bucket Base ATA:", bucketBaseAta.toBase58());
    console.log("Minted amount:", mintAmount);

    const balance = await provider.connection.getTokenAccountBalance(bucketBaseAta);
    console.log("Bucket base balance:", balance.value.amount);
  });
}

main();
