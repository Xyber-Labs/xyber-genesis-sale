import * as assert from "assert";
import * as anchor from "@coral-xyz/anchor";
import { XyberSale } from "../target/types/xyber_sale";
import XyberSaleSDK from "@xyber-labs/xyber-sale-sdk";
import { getExplorerUrl } from "../scripts/utils";

describe("XyberSale", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.XyberSale as anchor.Program<XyberSale>;
  const sdk = XyberSaleSDK.create(provider, program);

  const deployerKeypair = (provider.wallet as any).payer as anchor.web3.Keypair;
  const admin = anchor.web3.Keypair.generate();
  const owner = anchor.web3.Keypair.generate();

  before(async () => {
    const requestAirdropSignature = await provider.connection.requestAirdrop(
      admin.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(requestAirdropSignature);
  });

  it("Should initialize the config", async () => {
    const { signature, config } = await sdk.initialize({
      adminKeypair: deployerKeypair,
      newAdmin: admin.publicKey,
      owner: owner.publicKey,
    });

    console.log("Initialize tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());

    const configAccount = await program.account.saleConfig.fetch(config);

    assert.deepEqual(configAccount.admin, admin.publicKey);
    assert.deepEqual(configAccount.owner, owner.publicKey);

    console.log("Config initialized successfully!");
    console.log("Admin:", configAccount.admin.toBase58());
    console.log("Owner:", configAccount.owner.toBase58());
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
        newAdmin: attacker.publicKey,
        owner: attacker.publicKey,
        adminKeypair: attacker,
      });

      assert.fail("Should have failed with InvalidAdmin error");
    } catch (error: any) {
      console.log("Error message:", error.message);
      assert.ok(
        error.message.includes("Invalid admin") ||
        error.message.includes("0x1770") ||
        error.message.includes("already in use"),
        `Expected error preventing unauthorized initialization, got: ${error.message}`
      );
      console.log("Correctly rejected unauthorized initialization attempt");
    }
  });
});
