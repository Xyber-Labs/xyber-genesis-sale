import * as assert from "assert";
import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";

import XyberSaleSDK from "@xyber-labs/xyber-sale-sdk";
import { getExplorerUrl } from "../scripts/utils";
import { checkAnchorError } from "./utils";

describe("XyberSale", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.XyberSale;
  const sdk = XyberSaleSDK.create(provider, program);

  const deployerKeypair = (provider.wallet as any).payer as anchor.web3.Keypair;
  const admin = anchor.web3.Keypair.generate();
  const backend = anchor.web3.Keypair.generate();
  const multisig = anchor.web3.Keypair.generate();
  const baseMintKeypair = anchor.web3.Keypair.generate();
  const quoteMintKeypair = anchor.web3.Keypair.generate();

  let baseMint: anchor.web3.PublicKey;
  let quoteMint: anchor.web3.PublicKey;

  before(async () => {
    const requestAirdropSignature = await provider.connection.requestAirdrop(
      admin.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(requestAirdropSignature);

    baseMint = await splToken.createMint(
      provider.connection,
      deployerKeypair,
      deployerKeypair.publicKey,
      deployerKeypair.publicKey,
      6,
      baseMintKeypair,
      null,
      splToken.TOKEN_PROGRAM_ID
    );
    console.log("Base mint created:", baseMint.toBase58());

    quoteMint = await splToken.createMint(
      provider.connection,
      deployerKeypair,
      deployerKeypair.publicKey,
      deployerKeypair.publicKey,
      6,
      quoteMintKeypair,
      null,
      splToken.TOKEN_PROGRAM_ID
    );
    console.log("Quote mint created:", quoteMint.toBase58());
  });

  it("Should initialize the config", async () => {
    const { signature, config, bucketPool } = await sdk.initialize({
      adminKeypair: deployerKeypair,
      newAdmin: admin.publicKey,
      backend: backend.publicKey,
      multisig: multisig.publicKey,
      baseMint: baseMint,
      quoteMint: quoteMint,
    });

    console.log("Initialize tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket Pool PDA:", bucketPool.toBase58());

    const configAccount = await program.account.saleConfig.fetch(config);

    assert.deepEqual(configAccount.admin, admin.publicKey);
    assert.deepEqual(configAccount.backend, backend.publicKey);
    assert.deepEqual(configAccount.multisig, multisig.publicKey);
    assert.deepEqual(configAccount.baseMint, baseMint);
    assert.deepEqual(configAccount.quoteMint, quoteMint);

    console.log("Config initialized successfully!");
    console.log("Admin:", configAccount.admin.toBase58());
    console.log("Backend:", configAccount.backend.toBase58());
    console.log("Multisig:", configAccount.multisig.toBase58());
    console.log("Base Mint:", configAccount.baseMint.toBase58());
    console.log("Quote Mint:", configAccount.quoteMint.toBase58());
  });

  it("Should fail when trying to initialize again with wrong admin", async () => {
    const attacker = anchor.web3.Keypair.generate();

    const requestAirdropSignature = await provider.connection.requestAirdrop(
      attacker.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(requestAirdropSignature);

    try {
      await sdk.initialize({
        adminKeypair: attacker,
        newAdmin: attacker.publicKey,
        backend: attacker.publicKey,
        multisig: attacker.publicKey,
        baseMint: baseMint,
        quoteMint: quoteMint,
      });

      assert.fail("Should have failed with InvalidAdmin error");
    } catch (error: any) {
      checkAnchorError(error, "Invalid admin account is provided");
      console.log("Correctly rejected unauthorized initialization attempt");
    }
  });
});
