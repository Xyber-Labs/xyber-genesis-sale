import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = (provider.wallet as any).payer as anchor.web3.Keypair;

  const baseMintKeypair = await getKeypairFromFile("keys/base-mint.json");
  const quoteMintKeypair = await getKeypairFromFile("keys/quote-mint.json");

  console.log("Creating base mint...");
  const baseMint = await splToken.createMint(
    provider.connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    6,
    baseMintKeypair,
    null,
    splToken.TOKEN_PROGRAM_ID
  );
  console.log("Base mint created:", baseMint.toBase58());

  console.log("Creating quote mint...");
  const quoteMint = await splToken.createMint(
    provider.connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    6,
    quoteMintKeypair,
    null,
    splToken.TOKEN_PROGRAM_ID
  );
  console.log("Quote mint created:", quoteMint.toBase58());

  console.log("\n✅ Mints created successfully!");
  console.log("Base mint:", baseMint.toBase58());
  console.log("Quote mint:", quoteMint.toBase58());
}

main();
