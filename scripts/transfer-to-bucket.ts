import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import { getExplorerUrl, runWithSdk } from "./utils";

async function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--bucket-name <NAME>", "Bucket name")
    .requiredOption("--amount <AMOUNT>", "Amount of base tokens to transfer")
    .requiredOption("--from-authority <PATH>", "Path to token owner keypair (source of tokens)")
    .parse(process.argv);

  const options = cli.opts();

  const fromAuthority = await getKeypairFromFile(options.fromAuthority);

  return {
    bucketName: options.bucketName,
    amount: options.amount,
    fromAuthority,
  };
}

async function main() {
  const options = await parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const payerKeypair = (provider.wallet as anchor.Wallet).payer;

    const [config] = sdk.txBuilder.getConfigPda();
    const configAccount = await sdk.program.account.saleConfig.fetch(config);
    const baseMint = configAccount.baseMint;

    const [bucket] = sdk.txBuilder.getBucketPda(options.bucketName);

    const sourceAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      options.fromAuthority.publicKey,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      bucket,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const transferAmount = BigInt(options.amount);
    const signature = await splToken.transfer(
      provider.connection,
      payerKeypair,
      sourceAta,
      bucketBaseAta,
      options.fromAuthority,
      transferAmount,
      [],
      { commitment: "confirmed" },
      splToken.TOKEN_PROGRAM_ID
    );

    console.log("✅ Success!");
    console.log("Transaction:", getExplorerUrl(provider, signature));
    console.log("Bucket:", bucket.toBase58());
    console.log("Base mint:", baseMint.toBase58());
    console.log("Source ATA:", sourceAta.toBase58());
    console.log("Bucket Base ATA:", bucketBaseAta.toBase58());
    console.log("Transferred amount:", transferAmount.toString());

    const balance = await provider.connection.getTokenAccountBalance(bucketBaseAta);
    console.log("Bucket base balance:", balance.value.amount);
  });
}

main();
