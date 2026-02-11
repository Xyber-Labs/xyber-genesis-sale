import * as assert from "assert";
import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { getKeypairFromFile } from "@solana-developers/node-helpers";

import XyberSaleSDK from "@xyber-labs/xyber-sale-sdk";
import { getExplorerUrl } from "../scripts/utils";
import { doAndCheckError } from "./utils";

describe("XyberSale", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.XyberSale;
  const sdk = XyberSaleSDK.create(provider, program);

  let deployerKeypair: anchor.web3.Keypair;
  let admin: anchor.web3.Keypair;
  let multisig: anchor.web3.Keypair;
  let baseMintKeypair: anchor.web3.Keypair;
  const usdtMintKeypair = anchor.web3.Keypair.generate();
  const usdcMintKeypair = anchor.web3.Keypair.generate();
  const buyer = anchor.web3.Keypair.generate();
  const buyer2 = anchor.web3.Keypair.generate();
  const teamMember = anchor.web3.Keypair.generate();

  let baseMint: anchor.web3.PublicKey;
  let usdtMint: anchor.web3.PublicKey;
  let usdcMint: anchor.web3.PublicKey;

  before(async () => {
    deployerKeypair = await getKeypairFromFile("keys/admin.json");
    admin = deployerKeypair;
    multisig = await getKeypairFromFile("keys/multisig.json");
    baseMintKeypair = await getKeypairFromFile("keys/base-mint.json");

    const adminAirdrop = await provider.connection.requestAirdrop(
      admin.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(adminAirdrop);

    const buyerAirdrop = await provider.connection.requestAirdrop(
      buyer.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(buyerAirdrop);

    const multisigAirdrop = await provider.connection.requestAirdrop(
      multisig.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(multisigAirdrop);

    const teamMemberAirdrop = await provider.connection.requestAirdrop(
      teamMember.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(teamMemberAirdrop);

    const buyer2Airdrop = await provider.connection.requestAirdrop(
      buyer2.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(buyer2Airdrop);

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

    usdtMint = await splToken.createMint(
      provider.connection,
      deployerKeypair,
      deployerKeypair.publicKey,
      deployerKeypair.publicKey,
      6,
      usdtMintKeypair,
      null,
      splToken.TOKEN_PROGRAM_ID
    );
    console.log("USDT mint created:", usdtMint.toBase58());

    usdcMint = await splToken.createMint(
      provider.connection,
      deployerKeypair,
      deployerKeypair.publicKey,
      deployerKeypair.publicKey,
      6,
      usdcMintKeypair,
      null,
      splToken.TOKEN_PROGRAM_ID
    );
    console.log("USDC mint created:", usdcMint.toBase58());
  });

  it("Should initialize the config", async () => {
    const { signature, config, bucketPool } = await sdk.initialize({
      adminKeypair: deployerKeypair,
      newAdmin: admin.publicKey,
      baseMint: baseMint,
    });

    console.log("Initialize tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Bucket Pool PDA:", bucketPool.toBase58());

    const configAccount = await program.account.saleConfig.fetch(config);

    assert.deepEqual(configAccount.admin, admin.publicKey);
    assert.deepEqual(configAccount.multisig, anchor.web3.PublicKey.default);
    assert.deepEqual(configAccount.pendingMultisig, anchor.web3.PublicKey.default);
    assert.deepEqual(configAccount.baseMint, baseMint);

    console.log("Config initialized successfully!");
    console.log("Admin:", configAccount.admin.toBase58());
    console.log("Base Mint:", configAccount.baseMint.toBase58());
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
        baseMint: baseMint,
      }),
      "Invalid admin account is provided"
    );

    console.log("Correctly rejected unauthorized initialization attempt");
  });

  it("Should propose multisig (DEPLOYER as authority)", async () => {
    const { signature, config } = await sdk.proposeMultisig({
      authorityKeypair: deployerKeypair,
      newMultisig: multisig.publicKey,
    });

    console.log("Propose multisig tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));

    const configAccount = await program.account.saleConfig.fetch(config);

    assert.deepEqual(configAccount.pendingMultisig, multisig.publicKey);
    assert.deepEqual(configAccount.multisig, anchor.web3.PublicKey.default);

    console.log("Pending multisig set successfully!");
  });

  it("Should fail when non-pending-multisig tries to accept", async () => {
    const attacker = anchor.web3.Keypair.generate();

    const requestAirdropSignature = await provider.connection.requestAirdrop(
      attacker.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(requestAirdropSignature);

    await doAndCheckError(
      sdk.acceptMultisig({
        newMultisigKeypair: attacker,
      }),
      "Invalid pending multisig"
    );

    console.log("Correctly rejected accept from non-pending-multisig");
  });

  it("Should accept multisig", async () => {
    const { signature, config } = await sdk.acceptMultisig({
      newMultisigKeypair: multisig,
    });

    console.log("Accept multisig tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));

    const configAccount = await program.account.saleConfig.fetch(config);

    assert.deepEqual(configAccount.multisig, multisig.publicKey);
    assert.deepEqual(configAccount.pendingMultisig, anchor.web3.PublicKey.default);

    console.log("Multisig accepted successfully!");
    console.log("Multisig:", configAccount.multisig.toBase58());
  });

  it("Should fail when non-multisig tries to propose", async () => {
    const attacker = anchor.web3.Keypair.generate();

    const requestAirdropSignature = await provider.connection.requestAirdrop(
      attacker.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(requestAirdropSignature);

    await doAndCheckError(
      sdk.proposeMultisig({
        authorityKeypair: attacker,
        newMultisig: attacker.publicKey,
      }),
      "Invalid admin account is provided"
    );

    console.log("Correctly rejected propose from non-multisig");
  });

  it("Should fail to accept when no pending transfer", async () => {
    await doAndCheckError(
      sdk.acceptMultisig({
        newMultisigKeypair: multisig,
      }),
      "Invalid pending multisig"
    );

    console.log("Correctly rejected accept when no pending transfer");
  });

  it("Should set quote mint configuration for USDT and USDC", async () => {
    const price = new anchor.BN("20000000000");
    const expo = -8;

    const { signature: usdtSig, config, quoteConfig: usdtQuoteConfig } = await sdk.setQuoteMint({
      multisigKeypair: multisig,
      quoteMint: usdtMint,
      price: price,
      expo: expo,
      isEnabled: true,
    });

    console.log("Set USDT quote mint tx:", usdtSig);
    console.log("Explorer:", getExplorerUrl(provider, usdtSig));
    console.log("USDT Quote Config PDA:", usdtQuoteConfig.toBase58());

    const usdtQuoteConfigAccount = await program.account.quoteConfig.fetch(usdtQuoteConfig);

    assert.deepEqual(usdtQuoteConfigAccount.price.toString(), price.toString());
    assert.equal(usdtQuoteConfigAccount.expo, expo);
    assert.equal(usdtQuoteConfigAccount.isEnabled, true);

    console.log("USDT configured - Price:", usdtQuoteConfigAccount.price.toString());

    const { signature: usdcSig, quoteConfig: usdcQuoteConfig } = await sdk.setQuoteMint({
      multisigKeypair: multisig,
      quoteMint: usdcMint,
      price: price,
      expo: expo,
      isEnabled: true,
    });

    console.log("Set USDC quote mint tx:", usdcSig);
    console.log("Explorer:", getExplorerUrl(provider, usdcSig));
    console.log("USDC Quote Config PDA:", usdcQuoteConfig.toBase58());

    const usdcQuoteConfigAccount = await program.account.quoteConfig.fetch(usdcQuoteConfig);

    assert.deepEqual(usdcQuoteConfigAccount.price.toString(), price.toString());
    assert.equal(usdcQuoteConfigAccount.expo, expo);
    assert.equal(usdcQuoteConfigAccount.isEnabled, true);

    console.log("USDC configured - Price:", usdcQuoteConfigAccount.price.toString());
    console.log("Successfully configured multiple quote tokens!");
  });

  it("Should setup round", async () => {
    const now = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(now - 60);
    const endTime = new anchor.BN(now + 3600);

    const { signature, config, roundConfig } = await sdk.setupRound({
      adminKeypair: admin,
      round: { public: {} },
      startTime: startTime,
      endTime: endTime,
    });

    console.log("Setup round tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Config PDA:", config.toBase58());
    console.log("Round Config PDA:", roundConfig.toBase58());

    const roundConfigAccount = await program.account.roundConfig.fetch(roundConfig);

    assert.deepEqual(roundConfigAccount.startTime, startTime);
    assert.deepEqual(roundConfigAccount.endTime, endTime);

    console.log("Round configured successfully!");
    console.log("Start time:", roundConfigAccount.startTime.toString());
    console.log("End time:", roundConfigAccount.endTime.toString());
  });

  it("Should setup priceless bucket", async () => {
    const bucketName = "PUBLIC";
    const bucketData = {
      vestingType: { priceless: {} },
      totalDeposit: new anchor.BN(0),
      bucketSupply: new anchor.BN(500000000000000),
      registeredSupply: new anchor.BN(0),
      claimedSupply: new anchor.BN(0),
      burntSupply: new anchor.BN(0),
      vestingPlan: ["PUBLIC"],
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
    const paymentAmount = new anchor.BN(5_000_000_000);

    const [bucketPool] = sdk.txBuilder.getBucketPoolPda();
    const bucketPoolBalanceBefore = await provider.connection.getBalance(bucketPool);
    const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

    const { signature, config, roundConfig, vestingConfig, bucket } = await sdk.depositSol({
      buyerKeypair: buyer,
      round: { public: {} },
      paymentAmount: paymentAmount,
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

    const expectedDeposit = paymentAmount;

    console.log("Expected deposit (lamports):", expectedDeposit.toString());
    console.log("Expected deposit (SOL):", (expectedDeposit.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(2));
    console.log("Actual deposit:", vestingConfigAccount.vestingType?.priceless?.deposit?.toString());

    assert.ok(vestingConfigAccount.vestingType !== undefined);
    assert.ok(vestingConfigAccount.vestingType.priceless !== undefined);
    assert.ok(vestingConfigAccount.vestingType.priceless.deposit.eq(expectedDeposit));
    assert.ok(vestingConfigAccount.tokensClaimed.eq(new anchor.BN(0)));
    assert.ok(vestingConfigAccount.tokensBurnt.eq(new anchor.BN(0)));

    assert.ok(bucketPoolBalanceAfter > bucketPoolBalanceBefore);
    assert.ok(buyerBalanceAfter < buyerBalanceBefore);

    console.log("Deposit completed successfully!");
    console.log("Bucket pool balance increase:", bucketPoolBalanceAfter - bucketPoolBalanceBefore);
  });

  it("Should deposit tokens (SPL) correctly", async () => {
    const buyerQuoteAta = await splToken.createAssociatedTokenAccount(
      provider.connection,
      deployerKeypair,
      usdtMint,
      buyer.publicKey,
      null,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const mintAmount = 100_000_000_000;
    await splToken.mintTo(
      provider.connection,
      deployerKeypair,
      usdtMint,
      buyerQuoteAta,
      deployerKeypair,
      mintAmount,
      [],
      null,
      splToken.TOKEN_PROGRAM_ID
    );

    const paymentAmount = new anchor.BN(1_000_000_000);

    const [bucketPool] = sdk.txBuilder.getBucketPoolPda();
    const bucketPoolQuoteAta = splToken.getAssociatedTokenAddressSync(
      usdtMint,
      bucketPool,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const buyerQuoteBalanceBefore = await provider.connection.getTokenAccountBalance(buyerQuoteAta);
    const bucketPoolQuoteBalanceBefore = await provider.connection.getTokenAccountBalance(bucketPoolQuoteAta);

    const { signature, config, roundConfig, vestingConfig, bucket } = await sdk.depositAsset({
      buyerKeypair: buyer,
      round: { public: {} },
      quoteMint: usdtMint,
      paymentAmount: paymentAmount,
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

    const solEquivalentOfQuoteDeposit = new anchor.BN(5_000_000_000);
    const expectedTotalDeposit = new anchor.BN(5_000_000_000).add(solEquivalentOfQuoteDeposit);

    assert.ok(vestingConfigAccount.vestingType !== undefined);
    assert.ok(vestingConfigAccount.vestingType.priceless !== undefined);
    assert.ok(vestingConfigAccount.vestingType.priceless.deposit.eq(expectedTotalDeposit));
    assert.ok(vestingConfigAccount.tokensClaimed.eq(new anchor.BN(0)));
    assert.ok(vestingConfigAccount.tokensBurnt.eq(new anchor.BN(0)));

    assert.ok(
      parseInt(buyerQuoteBalanceAfter.value.amount) < parseInt(buyerQuoteBalanceBefore.value.amount)
    );
    assert.ok(
      parseInt(bucketPoolQuoteBalanceAfter.value.amount) > parseInt(bucketPoolQuoteBalanceBefore.value.amount)
    );

    console.log("Deposit Asset completed successfully!");
    console.log("Quote payment amount (tokens):", paymentAmount.toString());
    console.log("Quote payment amount (USD):", "$" + (paymentAmount.toNumber() / 1_000_000).toFixed(2));
    console.log("SOL equivalent (lamports):", solEquivalentOfQuoteDeposit.toString());
    console.log("SOL equivalent (SOL):", (solEquivalentOfQuoteDeposit.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(2));
    console.log("Expected total deposit (lamports):", expectedTotalDeposit.toString());
    console.log("Expected total deposit (SOL):", (expectedTotalDeposit.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(2));
    console.log("Actual total deposit:", vestingConfigAccount.vestingType.priceless.deposit.toString());
    console.log(
      "Buyer quote balance decrease:",
      parseInt(buyerQuoteBalanceBefore.value.amount) - parseInt(buyerQuoteBalanceAfter.value.amount)
    );
    console.log(
      "Bucket pool quote balance increase:",
      parseInt(bucketPoolQuoteBalanceAfter.value.amount) - parseInt(bucketPoolQuoteBalanceBefore.value.amount)
    );
  });

  it("Should fail to deposit with non-existent quote mint", async () => {
    const nonExistentQuoteMint = anchor.web3.Keypair.generate().publicKey;
    const paymentAmount = new anchor.BN(1_000_000_000);

    await doAndCheckError(
      sdk.depositAsset({
        buyerKeypair: buyer,
        round: { public: {} },
        quoteMint: nonExistentQuoteMint,
        paymentAmount: paymentAmount,
      }),
      "AccountNotInitialized"
    );

    console.log("Correctly rejected deposit with non-existent quote mint");
  });

  it("Should fail to deposit with disabled quote mint", async () => {
    const disabledQuoteMintKeypair = anchor.web3.Keypair.generate();
    const disabledQuoteMint = await splToken.createMint(
      provider.connection,
      deployerKeypair,
      deployerKeypair.publicKey,
      deployerKeypair.publicKey,
      6,
      disabledQuoteMintKeypair,
      null,
      splToken.TOKEN_PROGRAM_ID
    );

    const price = new anchor.BN("20000000000");
    const expo = -8;

    await sdk.setQuoteMint({
      multisigKeypair: multisig,
      quoteMint: disabledQuoteMint,
      price: price,
      expo: expo,
      isEnabled: false,
    });

    await splToken.createAssociatedTokenAccount(
      provider.connection,
      deployerKeypair,
      disabledQuoteMint,
      buyer.publicKey,
      null,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const paymentAmount = new anchor.BN(1_000_000_000);

    await doAndCheckError(
      sdk.depositAsset({
        buyerKeypair: buyer,
        round: { public: {} },
        quoteMint: disabledQuoteMint,
        paymentAmount: paymentAmount,
      }),
      "InvalidQuoteMint"
    );

    console.log("Correctly rejected deposit with disabled quote mint");
  });

  it("Should deposit with USDC (second buyer, different quote token)", async () => {
    const buyer2UsdcAta = await splToken.createAssociatedTokenAccount(
      provider.connection,
      deployerKeypair,
      usdcMint,
      buyer2.publicKey,
      null,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const mintAmount = 100_000_000_000;
    await splToken.mintTo(
      provider.connection,
      deployerKeypair,
      usdcMint,
      buyer2UsdcAta,
      deployerKeypair,
      mintAmount,
      [],
      null,
      splToken.TOKEN_PROGRAM_ID
    );

    const paymentAmount = new anchor.BN(1_000_000_000);

    const { signature, vestingConfig } = await sdk.depositAsset({
      buyerKeypair: buyer2,
      round: { public: {} },
      quoteMint: usdcMint,
      paymentAmount: paymentAmount,
    });

    const buyer2VestingConfig = await program.account.vestingConfig.fetch(vestingConfig);
    const [bucket] = sdk.txBuilder.getBucketPda("PUBLIC");
    const bucketData = await program.account.bucketData.fetch(bucket);

    const expectedBuyer2Deposit = new anchor.BN(5_000_000_000);
    const expectedTotalBucketDeposit = new anchor.BN(15_000_000_000);

    assert.ok(buyer2VestingConfig.vestingType.priceless.deposit.eq(expectedBuyer2Deposit));
    assert.ok(bucketData.totalDeposit.eq(expectedTotalBucketDeposit));

    console.log("USDC deposit tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Buyer 2 deposit (1000 USDC = 5 SOL equivalent):", buyer2VestingConfig.vestingType.priceless.deposit.toString());
    console.log("Total bucket deposit (buyer1: 10 SOL, buyer2: 5 SOL):", bucketData.totalDeposit.toString());
    console.log("Buyer 1 share: 10/15 = 66.67%, Buyer 2 share: 5/15 = 33.33%");
    console.log("Successfully deposited with USDC - multiple quote tokens working!");
  });

  it("Should setup vesting plan for public sale (100% unlock at TGE)", async () => {
    const vestingPlanName = "PUBLIC";
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
    const bucketName = "PUBLIC";
    const [bucket] = sdk.txBuilder.getBucketPda(bucketName);

    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      bucket,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const mintAmount = 500000000000000;
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

  it("Should claim tokens at TGE for both buyers with correct allocation", async () => {
    const bucketName = "PUBLIC";
    const vestingPlanName = "PUBLIC";

    const [bucket] = sdk.txBuilder.getBucketPda(bucketName);
    const bucketData = await program.account.bucketData.fetch(bucket);

    console.log("Bucket state before claims:");
    console.log("  Total deposit:", bucketData.totalDeposit.toString(), "lamports (15 SOL)");
    console.log("  Bucket supply:", bucketData.bucketSupply.toString(), "tokens");

    // Buyer1 claim (10 SOL = 66.67%)
    const [vestingConfig1] = sdk.txBuilder.getVestingConfigPda(bucketName, buyer.publicKey);
    const vestingConfigAccountBefore1 = await program.account.vestingConfig.fetch(vestingConfig1);

    console.log("\nBuyer 1 before claim:");
    console.log("  Deposit:", vestingConfigAccountBefore1.vestingType.priceless.deposit.toString(), "lamports (10 SOL)");
    console.log("  Share: 10/15 = 66.67%");

    const buyerBaseAta1 = splToken.getAssociatedTokenAddressSync(
      baseMint,
      buyer.publicKey,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const buyerBaseAccountInfoBefore1 = await provider.connection.getAccountInfo(buyerBaseAta1);
    const buyerBaseBalanceBefore1 = buyerBaseAccountInfoBefore1
      ? parseInt((await provider.connection.getTokenAccountBalance(buyerBaseAta1)).value.amount)
      : 0;

    const { signature: sig1 } = await sdk.claim({
      buyerKeypair: buyer,
      bucketName: bucketName,
      vestingPlanName: vestingPlanName,
    });

    const vestingConfigAccountAfter1 = await program.account.vestingConfig.fetch(vestingConfig1);
    const buyerBaseBalanceAfter1 = await provider.connection.getTokenAccountBalance(buyerBaseAta1);
    const claimedAmount1 = vestingConfigAccountAfter1.tokensClaimed;

    const expectedAllocation1 = new anchor.BN(333333333333333);

    assert.equal(vestingConfigAccountAfter1.vestingPlan, vestingPlanName);
    assert.ok(claimedAmount1.eq(expectedAllocation1));
    assert.equal(parseInt(buyerBaseBalanceAfter1.value.amount), buyerBaseBalanceBefore1 + parseInt(claimedAmount1.toString()));

    console.log("Buyer 1 after claim:");
    console.log("  Tx:", sig1);
    console.log("  Explorer:", getExplorerUrl(provider, sig1));
    console.log("  Expected allocation:", expectedAllocation1.toString(), "microtokens (333_333_333.333333 tokens = 66.67%)");
    console.log("  Actual claimed:", claimedAmount1.toString(), "microtokens");
    console.log("  ✓ Buyer 1 claimed successfully!");

    // Buyer2 claim (5 SOL = 33.33%)
    const [vestingConfig2] = sdk.txBuilder.getVestingConfigPda(bucketName, buyer2.publicKey);
    const vestingConfigAccountBefore2 = await program.account.vestingConfig.fetch(vestingConfig2);

    console.log("\nBuyer 2 before claim:");
    console.log("  Deposit:", vestingConfigAccountBefore2.vestingType.priceless.deposit.toString(), "lamports (5 SOL)");
    console.log("  Share: 5/15 = 33.33%");

    const buyerBaseAta2 = splToken.getAssociatedTokenAddressSync(
      baseMint,
      buyer2.publicKey,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const buyerBaseAccountInfoBefore2 = await provider.connection.getAccountInfo(buyerBaseAta2);
    const buyerBaseBalanceBefore2 = buyerBaseAccountInfoBefore2
      ? parseInt((await provider.connection.getTokenAccountBalance(buyerBaseAta2)).value.amount)
      : 0;

    const { signature: sig2 } = await sdk.claim({
      buyerKeypair: buyer2,
      bucketName: bucketName,
      vestingPlanName: vestingPlanName,
    });

    const vestingConfigAccountAfter2 = await program.account.vestingConfig.fetch(vestingConfig2);
    const buyerBaseBalanceAfter2 = await provider.connection.getTokenAccountBalance(buyerBaseAta2);
    const claimedAmount2 = vestingConfigAccountAfter2.tokensClaimed;

    const expectedAllocation2 = new anchor.BN(166666666666666);

    assert.equal(vestingConfigAccountAfter2.vestingPlan, vestingPlanName);
    assert.ok(claimedAmount2.eq(expectedAllocation2));
    assert.equal(parseInt(buyerBaseBalanceAfter2.value.amount), buyerBaseBalanceBefore2 + parseInt(claimedAmount2.toString()));

    console.log("Buyer 2 after claim:");
    console.log("  Tx:", sig2);
    console.log("  Explorer:", getExplorerUrl(provider, sig2));
    console.log("  Expected allocation:", expectedAllocation2.toString(), "microtokens (166_666_666.666666 tokens = 33.33%)");
    console.log("  Actual claimed:", claimedAmount2.toString(), "microtokens");
    console.log("  ✓ Buyer 2 claimed successfully!");

    console.log("\n✓ Both buyers claimed with correct proportional allocation!");
    console.log("  Total claimed:", claimedAmount1.add(claimedAmount2).toString(), "microtokens (499_999_999.999999 tokens)");
  });

  it("Should fail when trying to claim again (nothing left to claim)", async () => {
    const bucketName = "PUBLIC";
    const vestingPlanName = "PUBLIC";

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

  it("Withdraw quote tokens (asset) from bucket pool", async () => {
    const withdrawOwner = anchor.web3.Keypair.generate();

    const [bucketPoolPda] = sdk.txBuilder.getBucketPoolPda();
    const bucketPoolAta = splToken.getAssociatedTokenAddressSync(
      usdtMint,
      bucketPoolPda,
      true,
      splToken.TOKEN_PROGRAM_ID
    );

    const poolBalanceBefore = await provider.connection.getTokenAccountBalance(bucketPoolAta);
    const poolAmountBefore = BigInt(poolBalanceBefore.value.amount);

    await sdk.withdrawAsset({
      multisigKeypair: multisig,
      quoteMint: usdtMint,
      withdrawOwner: withdrawOwner.publicKey,
    });

    const withdrawAta = splToken.getAssociatedTokenAddressSync(
      usdtMint,
      withdrawOwner.publicKey,
      true,
      splToken.TOKEN_PROGRAM_ID
    );

    const withdrawBalance = await provider.connection.getTokenAccountBalance(withdrawAta);
    const poolBalanceAfter = await provider.connection.getTokenAccountBalance(bucketPoolAta);

    assert.equal(BigInt(withdrawBalance.value.amount), poolAmountBefore);
    assert.equal(BigInt(poolBalanceAfter.value.amount), 0n);

    console.log("Successfully withdrew all quote tokens from bucket pool!");
    console.log(`Withdrawn: ${poolAmountBefore} tokens`);
  });

  it("Withdraw SOL from bucket pool", async () => {
    const [bucketPoolPda] = sdk.txBuilder.getBucketPoolPda();

    const balanceBefore = await provider.connection.getBalance(multisig.publicKey);
    const poolBalanceBefore = await provider.connection.getBalance(bucketPoolPda);
    const rentExempt = await provider.connection.getMinimumBalanceForRentExemption(0);

    await sdk.withdrawSol({
      multisigKeypair: multisig,
      addressToWithdrawTo: multisig.publicKey,
    });

    const balanceAfter = await provider.connection.getBalance(multisig.publicKey);
    const poolBalanceAfter = await provider.connection.getBalance(bucketPoolPda);

    const expectedWithdrawn = poolBalanceBefore - rentExempt;
    assert.ok(balanceAfter > balanceBefore);
    assert.equal(poolBalanceAfter, rentExempt);

    console.log("Successfully withdrew all SOL except rent reserve!");
    console.log(`Pool balance: ${poolBalanceBefore} -> ${poolBalanceAfter}`);
    console.log(`Withdrawn: ${expectedWithdrawn} lamports`);
  });

  it("Should setup team bucket with Deterministic vesting type", async () => {
    const bucketName = "team";
    const bucketData = {
      vestingType: { deterministic: {} },
      totalDeposit: new anchor.BN(0),
      bucketSupply: new anchor.BN(10000000),
      registeredSupply: new anchor.BN(0),
      claimedSupply: new anchor.BN(0),
      burntSupply: new anchor.BN(0),
      vestingPlan: ["team-24m"],
    };

    const { signature, config, bucket, bucketBaseAta } = await sdk.setupBucket({
      adminKeypair: admin,
      bucketName: bucketName,
      bucketData: bucketData,
    });

    console.log("Setup team bucket tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Bucket PDA:", bucket.toBase58());
    console.log("Bucket Base ATA:", bucketBaseAta.toBase58());

    const bucketAccount = await program.account.bucketData.fetch(bucket);

    assert.ok(bucketAccount.bucketSupply.eq(bucketData.bucketSupply));
    assert.ok(bucketAccount.registeredSupply.eq(bucketData.registeredSupply));
    assert.ok(bucketAccount.claimedSupply.eq(bucketData.claimedSupply));
    assert.ok(bucketAccount.burntSupply.eq(bucketData.burntSupply));
    assert.ok(bucketAccount.totalDeposit.eq(bucketData.totalDeposit));
    assert.deepEqual(bucketAccount.vestingPlan, bucketData.vestingPlan);
    assert.deepEqual(bucketAccount.vestingType, bucketData.vestingType);

    console.log("Team bucket configured successfully with Deterministic vesting!");
  });

  it("Should setup 24-month linear vesting plan (0% TGE)", async () => {
    const vestingPlanName = "team-24m";
    const now = Math.floor(Date.now() / 1000);
    const oneMonth = 30 * 24 * 60 * 60;

    const periods = [];
    for (let i = 0; i < 24; i++) {
      periods.push({
        startTimestamp: new anchor.BN(now + i * oneMonth),
        claimRatio: 1.0 / 24.0,
        burnRatio: 0.0,
        basePeriodIndex: null,
      });
    }

    const plan = { periods };

    const { signature, config, vestingPlan } = await sdk.setupVestingPlan({
      adminKeypair: admin,
      vestingPlanName: vestingPlanName,
      plan: plan,
    });

    console.log("Setup vesting plan tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Vesting Plan PDA:", vestingPlan.toBase58());

    const vestingPlanAccount = await program.account.vestingPlan.fetch(vestingPlan);

    assert.equal(vestingPlanAccount.periods.length, 24);

    for (let i = 0; i < 24; i++) {
      const period = vestingPlanAccount.periods[i];
      assert.ok(period.startTimestamp.eq(plan.periods[i].startTimestamp));
      assert.equal(period.claimRatio, plan.periods[i].claimRatio);
      assert.equal(period.burnRatio, plan.periods[i].burnRatio);
      assert.equal(period.basePeriodIndex, plan.periods[i].basePeriodIndex);
    }

    console.log("24-month linear vesting plan configured successfully!");
    console.log("Periods count:", vestingPlanAccount.periods.length);
    console.log("Monthly unlock ratio:", vestingPlanAccount.periods[0].claimRatio);
  });

  it("Should setup user vesting config for team member with fixed allocation", async () => {
    const bucketName = "team";
    const allocation = new anchor.BN(1000000);
    const vestingPlan = "team-24m";

    const { signature, config, bucket, vestingConfig } = await sdk.setupDeterministicVesting({
      adminKeypair: admin,
      participant: teamMember.publicKey,
      bucketName: bucketName,
      newAllocation: allocation,
      vestingPlan: vestingPlan,
      tokensClaimed: new anchor.BN(0),
      tokensBurnt: new anchor.BN(0),
    });

    console.log("Setup user vesting config tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("Vesting Config PDA:", vestingConfig.toBase58());

    const vestingConfigAccount = await program.account.vestingConfig.fetch(vestingConfig);
    const bucketAccount = await program.account.bucketData.fetch(bucket);

    assert.equal(vestingConfigAccount.vestingPlan, vestingPlan);
    assert.ok(vestingConfigAccount.vestingType.deterministic !== undefined);
    assert.ok(vestingConfigAccount.vestingType.deterministic.allocation.eq(allocation));
    assert.ok(vestingConfigAccount.tokensClaimed.eq(new anchor.BN(0)));
    assert.ok(vestingConfigAccount.tokensBurnt.eq(new anchor.BN(0)));

    assert.ok(bucketAccount.registeredSupply.eq(allocation));

    console.log("User vesting config created successfully!");
    console.log("Allocation:", allocation.toString());
    console.log("Vesting type: Deterministic");
    console.log("Bucket registered supply:", bucketAccount.registeredSupply.toString());
  });

  it("Should mint base tokens to team bucket for testing claim", async () => {
    const bucketName = "team";
    const [bucket] = sdk.txBuilder.getBucketPda(bucketName);

    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      bucket,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const mintAmount = 10000000;
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
    console.log("Team bucket base token balance:", balance.value.amount);
    assert.ok(parseInt(balance.value.amount) >= mintAmount);
  });

  it("Should claim first month allocation (1/24) for team member with Deterministic vesting", async () => {
    const bucketName = "team";
    const vestingPlanName = "team-24m";

    const [vestingConfig] = sdk.txBuilder.getVestingConfigPda(bucketName, teamMember.publicKey);

    const vestingConfigAccountBefore = await program.account.vestingConfig.fetch(vestingConfig);

    console.log("Before claim:");
    console.log("  Vesting type:", vestingConfigAccountBefore.vestingType);
    console.log("  Tokens claimed:", vestingConfigAccountBefore.tokensClaimed.toString());
    console.log("  Vesting plan:", vestingConfigAccountBefore.vestingPlan);

    assert.equal(vestingConfigAccountBefore.vestingPlan, vestingPlanName);
    assert.ok(vestingConfigAccountBefore.vestingType.deterministic !== undefined);
    assert.ok(vestingConfigAccountBefore.vestingType.deterministic.allocation.eq(new anchor.BN(1000000)));
    assert.ok(vestingConfigAccountBefore.tokensClaimed.eq(new anchor.BN(0)));
    assert.ok(vestingConfigAccountBefore.tokensBurnt.eq(new anchor.BN(0)));

    const teamMemberBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      teamMember.publicKey,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const { signature } = await sdk.claim({
      buyerKeypair: teamMember,
      bucketName: bucketName,
      vestingPlanName: vestingPlanName,
    });

    console.log("Claim tx:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));

    const vestingConfigAccountAfter = await program.account.vestingConfig.fetch(vestingConfig);
    const teamMemberBaseBalance = await provider.connection.getTokenAccountBalance(teamMemberBaseAta);

    console.log("After claim:");
    console.log("  Tokens claimed:", vestingConfigAccountAfter.tokensClaimed.toString());
    console.log("  Team member base balance:", teamMemberBaseBalance.value.amount);

    const expectedFirstMonthClaim = Math.floor(1000000 / 24);

    assert.ok(vestingConfigAccountAfter.tokensClaimed.gt(new anchor.BN(0)));
    assert.ok(vestingConfigAccountAfter.tokensClaimed.lte(new anchor.BN(expectedFirstMonthClaim + 1)));

    console.log("Successfully claimed first month allocation!");
    console.log(`Expected: ~${expectedFirstMonthClaim}, Actual: ${vestingConfigAccountAfter.tokensClaimed.toString()}`);
  });

  it("Should fail when trying to claim again immediately (no additional vesting unlocked)", async () => {
    const bucketName = "team";
    const vestingPlanName = "team-24m";

    await doAndCheckError(
      sdk.claim({
        buyerKeypair: teamMember,
        bucketName: bucketName,
        vestingPlanName: vestingPlanName,
      }),
      "Claim unavailable"
    );

    console.log("Correctly rejected claim attempt (no additional vesting unlocked)!");
  });

  it("Should withdraw tokens from bucket", async () => {
    const bucketName = "team";
    const withdrawAmount = new anchor.BN(500000);
    const withdrawOwner = anchor.web3.Keypair.generate();

    const [bucketPda] = sdk.txBuilder.getBucketPda(bucketName);
    const bucketDataBefore = await program.account.bucketData.fetch(bucketPda);

    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      bucketPda,
      true,
      splToken.TOKEN_PROGRAM_ID
    );

    const poolBalanceBefore = await provider.connection.getTokenAccountBalance(bucketBaseAta);

    await sdk.withdrawUnsoldTokens({
      multisigKeypair: multisig,
      bucketName: bucketName,
      amount: withdrawAmount,
      withdrawOwner: withdrawOwner.publicKey,
    });

    const withdrawAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      withdrawOwner.publicKey,
      true,
      splToken.TOKEN_PROGRAM_ID
    );

    const withdrawBalance = await provider.connection.getTokenAccountBalance(withdrawAta);
    const poolBalanceAfter = await provider.connection.getTokenAccountBalance(bucketBaseAta);
    const bucketDataAfter = await program.account.bucketData.fetch(bucketPda);

    assert.equal(
      bucketDataBefore.bucketSupply.sub(bucketDataAfter.bucketSupply).toNumber(),
      withdrawAmount.toNumber()
    );
    assert.equal(
      bucketDataAfter.registeredSupply.toNumber(),
      bucketDataBefore.registeredSupply.toNumber()
    );
    assert.equal(
      bucketDataAfter.burntSupply.toNumber(),
      bucketDataBefore.burntSupply.toNumber()
    );
    assert.equal(
      bucketDataAfter.claimedSupply.toNumber(),
      bucketDataBefore.claimedSupply.toNumber()
    );
    assert.equal(parseInt(withdrawBalance.value.amount), withdrawAmount.toNumber());
    assert.equal(
      parseInt(poolBalanceBefore.value.amount) - parseInt(poolBalanceAfter.value.amount),
      withdrawAmount.toNumber()
    );

    console.log("Successfully withdrew tokens from bucket!");
    console.log(`Withdrawn: ${withdrawAmount.toNumber()} tokens`);
  });

  // FIND-004: Bucket vesting type validation
  it("Should reject operations with wrong bucket vesting type (FIND-004)", async () => {
    await doAndCheckError(
      sdk.setupDeterministicVesting({
        adminKeypair: admin,
        participant: teamMember.publicKey,
        bucketName: "PUBLIC",
        newAllocation: new anchor.BN(1000000),
        vestingPlan: "PUBLIC",
        tokensClaimed: new anchor.BN(0),
        tokensBurnt: new anchor.BN(0),
      }),
      "Invalid bucket vesting type"
    );

    console.log("Correctly rejected setupDeterministicVesting on Priceless bucket");

    await sdk.setupBucket({
      adminKeypair: admin,
      bucketName: "PUBLIC",
      bucketData: {
        vestingType: { deterministic: {} },
        totalDeposit: new anchor.BN(0),
        bucketSupply: new anchor.BN(500000000000000),
        registeredSupply: new anchor.BN(0),
        claimedSupply: new anchor.BN(0),
        burntSupply: new anchor.BN(0),
        vestingPlan: ["PUBLIC"],
      },
    });

    await doAndCheckError(
      sdk.depositSol({
        buyerKeypair: buyer,
        round: { public: {} },
        paymentAmount: new anchor.BN(1_000_000_000),
      }),
      "Invalid bucket vesting type"
    );

    console.log("Correctly rejected deposit SOL into Deterministic bucket");

    await doAndCheckError(
      sdk.depositAsset({
        buyerKeypair: buyer,
        round: { public: {} },
        quoteMint: usdtMint,
        paymentAmount: new anchor.BN(1_000_000_000),
      }),
      "Invalid bucket vesting type"
    );

    console.log("Correctly rejected deposit asset into Deterministic bucket");
  });

  // FIND-009: Computed bucket fields protection
  it("Should not reset computed bucket fields without reset-allowed feature (FIND-009)", async () => {
    const bucketName = "team";
    const [bucketPda] = sdk.txBuilder.getBucketPda(bucketName);
    const bucketBefore = await program.account.bucketData.fetch(bucketPda);

    assert.ok(bucketBefore.registeredSupply.gt(new anchor.BN(0)));
    assert.ok(bucketBefore.claimedSupply.gt(new anchor.BN(0)));

    await sdk.setupBucket({
      adminKeypair: admin,
      bucketName: bucketName,
      bucketData: {
        vestingType: { deterministic: {} },
        totalDeposit: new anchor.BN(0),
        bucketSupply: bucketBefore.bucketSupply,
        registeredSupply: new anchor.BN(0),
        claimedSupply: new anchor.BN(0),
        burntSupply: new anchor.BN(0),
        vestingPlan: ["team-24m"],
      },
    });

    const bucketAfter = await program.account.bucketData.fetch(bucketPda);

    assert.ok(bucketAfter.registeredSupply.eq(bucketBefore.registeredSupply));
    assert.ok(bucketAfter.claimedSupply.eq(bucketBefore.claimedSupply));
    assert.ok(bucketAfter.totalDeposit.eq(bucketBefore.totalDeposit));
    assert.ok(bucketAfter.burntSupply.eq(bucketBefore.burntSupply));

    console.log("Computed fields preserved despite setupBucket call with zeros");
  });

});
