import * as assert from "assert";
import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";

import XyberSaleSDK from "@xyber-labs/xyber-sale-sdk";
import { getExplorerUrl } from "../scripts/utils";
import { doAndCheckError } from "./utils";

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
  const buyer = anchor.web3.Keypair.generate();

  let baseMint: anchor.web3.PublicKey;
  let quoteMint: anchor.web3.PublicKey;

  before(async () => {
    const adminAirdrop = await provider.connection.requestAirdrop(
      admin.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(adminAirdrop);

    const buyerAirdrop = await provider.connection.requestAirdrop(
      buyer.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(buyerAirdrop);

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

    await doAndCheckError(
      sdk.initialize({
        adminKeypair: attacker,
        newAdmin: attacker.publicKey,
        backend: attacker.publicKey,
        multisig: attacker.publicKey,
        baseMint: baseMint,
        quoteMint: quoteMint,
      }),
      "Invalid admin account is provided"
    );

    console.log("Correctly rejected unauthorized initialization attempt");
  });

  it("Should setup round", async () => {
    const now = Math.floor(Date.now() / 1000);
    const price = new anchor.BN(40000);
    const startTime = new anchor.BN(now - 60);
    const endTime = new anchor.BN(now + 3600);

    const { signature, config, roundConfig } = await sdk.setupRound({
      adminKeypair: admin,
      round: { public: {} },
      price: price,
      startTime: startTime,
      endTime: endTime,
    });

    console.log("Setup round tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Round Config PDA:", roundConfig.toBase58());

    const roundConfigAccount = await program.account.roundConfig.fetch(roundConfig);

    assert.ok(roundConfigAccount.price.eq(price));
    assert.deepEqual(roundConfigAccount.startTime, startTime);
    assert.deepEqual(roundConfigAccount.endTime, endTime);

    console.log("Round configured successfully!");
    console.log("Price:", roundConfigAccount.price.toString());
    console.log("Start time:", roundConfigAccount.startTime.toString());
    console.log("End time:", roundConfigAccount.endTime.toString());
  });

  it("Should setup bucket", async () => {
    const bucketName = "public";
    const bucketData = {
      bucketSupply: new anchor.BN(1000000),
      registeredSupply: new anchor.BN(0),
      claimedSupply: new anchor.BN(0),
      burntSupply: new anchor.BN(0),
      vestingPlan: ["public"],
    };

    const { signature, config, bucket, bucketBaseAta } = await sdk.setupBucket({
      adminKeypair: admin,
      bucketName: bucketName,
      bucketData: bucketData,
    });

    console.log("Setup bucket tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());
    console.log("Bucket Base ATA:", bucketBaseAta.toBase58());

    const bucketAccount = await program.account.bucketData.fetch(bucket);

    assert.ok(bucketAccount.bucketSupply.eq(bucketData.bucketSupply));
    assert.ok(bucketAccount.registeredSupply.eq(bucketData.registeredSupply));
    assert.ok(bucketAccount.claimedSupply.eq(bucketData.claimedSupply));
    assert.ok(bucketAccount.burntSupply.eq(bucketData.burntSupply));
    assert.deepEqual(bucketAccount.vestingPlan, bucketData.vestingPlan);

    console.log("Bucket configured successfully!");
    console.log("Bucket supply:", bucketAccount.bucketSupply.toString());
  });

  it("Should deposit SOL correctly", async () => {
    const solPrice = new anchor.BN("250000000000000000000");
    const baseAllocation = new anchor.BN(100000);
    const bucketName = "public";

    const now = Math.floor(Date.now() / 1000);
    const expiration = new anchor.BN(now + 600);

    const [bucketPool] = sdk.txBuilder.getBucketPoolPda();
    const bucketPoolBalanceBefore = await provider.connection.getBalance(bucketPool);
    const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

    const { signature, config, roundConfig, vestingConfig, bucket } = await sdk.depositSol({
      buyerKeypair: buyer,
      backendKeypair: backend,
      round: { public: {} },
      solPrice: solPrice,
      baseAllocation: baseAllocation,
      expiration: expiration,
      bucketName: bucketName,
    });

    console.log("Deposit SOL tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Round Config PDA:", roundConfig.toBase58());
    console.log("Vesting Config PDA:", vestingConfig.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());

    const bucketPoolBalanceAfter = await provider.connection.getBalance(bucketPool);
    const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);

    const vestingConfigAccount = await program.account.vestingConfig.fetch(vestingConfig);
    assert.ok(vestingConfigAccount.totalAllocation.eq(baseAllocation));
    assert.ok(vestingConfigAccount.tokensClaimed.eq(new anchor.BN(0)));
    assert.ok(vestingConfigAccount.tokensBurnt.eq(new anchor.BN(0)));

    assert.ok(bucketPoolBalanceAfter > bucketPoolBalanceBefore);
    assert.ok(buyerBalanceAfter < buyerBalanceBefore);

    console.log("Deposit completed successfully!");
    console.log("Total allocation:", vestingConfigAccount.totalAllocation.toString());
    console.log("Bucket pool balance increase:", bucketPoolBalanceAfter - bucketPoolBalanceBefore);
  });

  it("Should deposit tokens (SPL) correctly", async () => {
    const buyerQuoteAta = await splToken.createAssociatedTokenAccount(
      provider.connection,
      deployerKeypair,
      quoteMint,
      buyer.publicKey,
      null,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const mintAmount = 10000000;
    await splToken.mintTo(
      provider.connection,
      deployerKeypair,
      quoteMint,
      buyerQuoteAta,
      deployerKeypair,
      mintAmount,
      [],
      null,
      splToken.TOKEN_PROGRAM_ID
    );

    const baseAllocation = new anchor.BN(100000);
    const bucketName = "public";

    const now = Math.floor(Date.now() / 1000);
    const expiration = new anchor.BN(now + 600);

    const [bucketPool] = sdk.txBuilder.getBucketPoolPda();
    const bucketPoolQuoteAta = splToken.getAssociatedTokenAddressSync(
      quoteMint,
      bucketPool,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const buyerQuoteBalanceBefore = await provider.connection.getTokenAccountBalance(buyerQuoteAta);
    const bucketPoolQuoteBalanceBefore = await provider.connection.getTokenAccountBalance(bucketPoolQuoteAta);

    const { signature, config, roundConfig, vestingConfig, bucket } = await sdk.depositAsset({
      buyerKeypair: buyer,
      backendKeypair: backend,
      round: { public: {} },
      baseAllocation: baseAllocation,
      expiration: expiration,
      bucketName: bucketName,
    });

    console.log("Deposit Asset tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Round Config PDA:", roundConfig.toBase58());
    console.log("Vesting Config PDA:", vestingConfig.toBase58());
    console.log("Bucket PDA:", bucket.toBase58());

    const buyerQuoteBalanceAfter = await provider.connection.getTokenAccountBalance(buyerQuoteAta);
    const bucketPoolQuoteBalanceAfter = await provider.connection.getTokenAccountBalance(bucketPoolQuoteAta);

    const vestingConfigAccount = await program.account.vestingConfig.fetch(vestingConfig);
    assert.ok(vestingConfigAccount.totalAllocation.eq(new anchor.BN(200000)));
    assert.ok(vestingConfigAccount.tokensClaimed.eq(new anchor.BN(0)));
    assert.ok(vestingConfigAccount.tokensBurnt.eq(new anchor.BN(0)));

    assert.ok(
      parseInt(buyerQuoteBalanceAfter.value.amount) < parseInt(buyerQuoteBalanceBefore.value.amount)
    );
    assert.ok(
      parseInt(bucketPoolQuoteBalanceAfter.value.amount) > parseInt(bucketPoolQuoteBalanceBefore.value.amount)
    );

    console.log("Deposit Asset completed successfully!");
    console.log("Total allocation:", vestingConfigAccount.totalAllocation.toString());
    console.log(
      "Buyer quote balance decrease:",
      parseInt(buyerQuoteBalanceBefore.value.amount) - parseInt(buyerQuoteBalanceAfter.value.amount)
    );
    console.log(
      "Bucket pool quote balance increase:",
      parseInt(bucketPoolQuoteBalanceAfter.value.amount) - parseInt(bucketPoolQuoteBalanceBefore.value.amount)
    );
  });

  it("Should setup vesting plan for public sale (100% unlock at TGE)", async () => {
    const vestingPlanName = "public";
    const tgeDate = Math.floor(Date.now() / 1000);

    const plan = {
      periods: [
        {
          startTimestamp: new anchor.BN(tgeDate),
          claimRatio: 1.0,
          burnRatio: 0.0,
          basePeriodIndex: null,
        },
      ],
    };

    const { signature, config, vestingPlan } = await sdk.setupVestingPlan({
      adminKeypair: admin,
      vestingPlanName: vestingPlanName,
      plan: plan,
    });

    console.log("Setup vesting plan tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Vesting Plan PDA:", vestingPlan.toBase58());

    const vestingPlanAccount = await program.account.vestingPlan.fetch(vestingPlan);

    assert.equal(vestingPlanAccount.periods.length, 1);
    assert.ok(vestingPlanAccount.periods[0].startTimestamp.eq(plan.periods[0].startTimestamp));
    assert.equal(vestingPlanAccount.periods[0].claimRatio, plan.periods[0].claimRatio);
    assert.equal(vestingPlanAccount.periods[0].burnRatio, plan.periods[0].burnRatio);
    assert.equal(vestingPlanAccount.periods[0].basePeriodIndex, plan.periods[0].basePeriodIndex);

    console.log("Vesting plan configured successfully (100% unlock at TGE)!");
    console.log("Periods count:", vestingPlanAccount.periods.length);
    console.log("TGE unlock ratio:", vestingPlanAccount.periods[0].claimRatio);
  });

  it("Should mint base tokens to bucket for testing claim", async () => {
    const bucketName = "public";
    const [bucket] = sdk.txBuilder.getBucketPda(bucketName);

    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      bucket,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const mintAmount = 1000000;
    await splToken.mintTo(
      provider.connection,
      deployerKeypair,
      baseMint,
      bucketBaseAta,
      deployerKeypair,
      mintAmount,
      [],
      null,
      splToken.TOKEN_PROGRAM_ID
    );

    const balance = await provider.connection.getTokenAccountBalance(bucketBaseAta);
    console.log("Bucket base token balance:", balance.value.amount);
    assert.ok(parseInt(balance.value.amount) >= mintAmount);
  });

  it("Should claim 100% tokens at TGE for public sale buyer", async () => {
    const bucketName = "public";
    const vestingPlanName = "public";

    const [vestingConfig] = sdk.txBuilder.getVestingConfigPda(bucketName, buyer.publicKey);

    const vestingConfigAccountBefore = await program.account.vestingConfig.fetch(vestingConfig);

    console.log("Before claim:");
    console.log("  Total allocation:", vestingConfigAccountBefore.totalAllocation.toString());
    console.log("  Tokens claimed:", vestingConfigAccountBefore.tokensClaimed.toString());
    console.log("  Vesting plan:", vestingConfigAccountBefore.vestingPlan);

    assert.ok(vestingConfigAccountBefore.totalAllocation.eq(new anchor.BN(200000)));
    assert.ok(vestingConfigAccountBefore.tokensClaimed.eq(new anchor.BN(0)));
    assert.equal(vestingConfigAccountBefore.vestingPlan, null);

    const buyerBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      buyer.publicKey,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const buyerBaseAccountInfoBefore = await provider.connection.getAccountInfo(buyerBaseAta);
    const buyerBaseBalanceBefore = buyerBaseAccountInfoBefore
      ? parseInt((await provider.connection.getTokenAccountBalance(buyerBaseAta)).value.amount)
      : 0;

    const { signature } = await sdk.claim({
      buyerKeypair: buyer,
      bucketName: bucketName,
      vestingPlanName: vestingPlanName,
    });

    console.log("Claim tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));

    const vestingConfigAccountAfter = await program.account.vestingConfig.fetch(vestingConfig);
    const buyerBaseBalanceAfter = await provider.connection.getTokenAccountBalance(buyerBaseAta);

    console.log("After claim:");
    console.log("  Tokens claimed:", vestingConfigAccountAfter.tokensClaimed.toString());
    console.log("  Vesting plan:", vestingConfigAccountAfter.vestingPlan);
    console.log("  Buyer base balance:", buyerBaseBalanceAfter.value.amount);

    const claimedAmount = vestingConfigAccountAfter.tokensClaimed.sub(vestingConfigAccountBefore.tokensClaimed);

    assert.equal(vestingConfigAccountAfter.vestingPlan, vestingPlanName);
    assert.ok(vestingConfigAccountAfter.tokensClaimed.eq(vestingConfigAccountBefore.totalAllocation));
    assert.ok(vestingConfigAccountAfter.tokensClaimed.eq(new anchor.BN(200000)));
    assert.equal(parseInt(buyerBaseBalanceAfter.value.amount), buyerBaseBalanceBefore + parseInt(claimedAmount.toString()));

    console.log("Successfully claimed 100% of allocation (200,000 tokens) at TGE!");
  });

  it("Should fail when trying to claim again (nothing left to claim)", async () => {
    const bucketName = "public";
    const vestingPlanName = "public";

    await doAndCheckError(
      sdk.claim({
        buyerKeypair: buyer,
        bucketName: bucketName,
        vestingPlanName: vestingPlanName,
      }),
      "Claim unavailable"
    );

    console.log("Correctly rejected second claim attempt!");
  });

});
