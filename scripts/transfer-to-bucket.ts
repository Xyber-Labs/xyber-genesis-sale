import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { Command } from "commander";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import {
  getExplorerUrl, runWithSdk, txToBase58,
  trezorInit, trezorGetPublicKey, trezorSignAndSend, trezorDispose,
} from "./utils";

function parseCliArgs() {
  const cli = new Command();
  cli
    .requiredOption("--bucket-name <NAME>", "Bucket name")
    .requiredOption("--amount <AMOUNT>", "Amount of base tokens to transfer")
    .option("--from-authority-keypair <PATH>", "Path to token owner keypair (source of tokens)")
    .option("--from-authority <PUBKEY>", "Token owner public key (for --base58 mode)")
    .option("--base58", "Export transaction as base58 for Squads")
    .option("--trezor", "Sign transaction with Trezor hardware wallet")
    .option("--trezor-path <PATH>", "Trezor derivation path", "m/44'/501'/0'/0'")
    .option("--skip-passphrase", "Skip Trezor passphrase prompt")
    .parse(process.argv);

  return cli.opts();
}

function buildTransferTx(
  sourceAta: web3.PublicKey,
  bucketBaseAta: web3.PublicKey,
  owner: web3.PublicKey,
  amount: bigint,
): web3.Transaction {
  const ix = splToken.createTransferInstruction(
    sourceAta,
    bucketBaseAta,
    owner,
    amount,
    [],
    splToken.TOKEN_PROGRAM_ID,
  );
  return new web3.Transaction().add(ix);
}

async function resolveAccounts(
  sdk: any,
  bucketName: string,
  owner: web3.PublicKey,
) {
  const [config] = sdk.txBuilder.getConfigPda();
  const configAccount = await sdk.program.account.saleConfig.fetch(config);
  const baseMint = configAccount.baseMint;
  const [bucket] = sdk.txBuilder.getBucketPda(bucketName);

  const sourceAta = splToken.getAssociatedTokenAddressSync(
    baseMint, owner, false,
    splToken.TOKEN_PROGRAM_ID, splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
    baseMint, bucket, true,
    splToken.TOKEN_PROGRAM_ID, splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return { baseMint, bucket, sourceAta, bucketBaseAta };
}

async function main() {
  const options = parseCliArgs();

  await runWithSdk(async ({ provider, sdk }) => {
    const transferAmount = BigInt(options.amount);

    if (options.base58) {
      if (!options.fromAuthority) {
        console.error("--from-authority is required when using --base58");
        process.exit(1);
      }
      const owner = new web3.PublicKey(options.fromAuthority);
      const { sourceAta, bucketBaseAta } = await resolveAccounts(sdk, options.bucketName, owner);
      const tx = buildTransferTx(sourceAta, bucketBaseAta, owner, transferAmount);
      const encoded = await txToBase58(tx, owner);
      console.log(encoded);
      return;
    }

    if (options.trezor) {
      await trezorInit(!options.skipPassphrase);
      const owner = await trezorGetPublicKey(options.trezorPath);
      console.log("Trezor public key:", owner.toBase58());

      const { baseMint, bucket, sourceAta, bucketBaseAta } =
        await resolveAccounts(sdk, options.bucketName, owner);
      const tx = buildTransferTx(sourceAta, bucketBaseAta, owner, transferAmount);

      console.log("Signing with Trezor...");
      const signature = await trezorSignAndSend(provider, tx, owner, options.trezorPath);

      console.log("✅ Success!");
      console.log("Transaction:", getExplorerUrl(provider, signature));
      console.log("Bucket:", bucket.toBase58());
      console.log("Base mint:", baseMint.toBase58());
      console.log("Source ATA:", sourceAta.toBase58());
      console.log("Bucket Base ATA:", bucketBaseAta.toBase58());
      console.log("Transferred amount:", transferAmount.toString());

      const balance = await provider.connection.getTokenAccountBalance(bucketBaseAta);
      console.log("Bucket base balance:", balance.value.amount);
      await trezorDispose();
      return;
    }

    if (!options.fromAuthorityKeypair) {
      console.error("--from-authority-keypair, --base58, or --trezor is required");
      process.exit(1);
    }

    const fromAuthority = await getKeypairFromFile(options.fromAuthorityKeypair);
    const payerKeypair = (provider.wallet as anchor.Wallet).payer;

    const [config] = sdk.txBuilder.getConfigPda();
    const configAccount = await sdk.program.account.saleConfig.fetch(config);
    const baseMint = configAccount.baseMint;
    const [bucket] = sdk.txBuilder.getBucketPda(options.bucketName);

    const sourceAta = splToken.getAssociatedTokenAddressSync(
      baseMint, fromAuthority.publicKey, false,
      splToken.TOKEN_PROGRAM_ID, splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint, bucket, true,
      splToken.TOKEN_PROGRAM_ID, splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const signature = await splToken.transfer(
      provider.connection,
      payerKeypair,
      sourceAta,
      bucketBaseAta,
      fromAuthority,
      transferAmount,
      [],
      { commitment: "confirmed" },
      splToken.TOKEN_PROGRAM_ID,
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
