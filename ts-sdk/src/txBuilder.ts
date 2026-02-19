import { BN, Program, web3 } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { XyberSale as XyberSaleIDL } from "../idl/xyber_sale";
import { getConstant, parseRound } from "./utils";

export class TxBuilder {
  private program: Program<XyberSaleIDL>;
  private seedRoot: Buffer;
  private configSeed: Buffer;
  private saleBucketSeed: Buffer;
  private bucketDataSeed: Buffer;
  private bucketPoolSeed: Buffer;
  private quoteSeed: Buffer;
  private roundSeed: Buffer;
  private vestingConfigSeed: Buffer;
  private vestingPlanSeed: Buffer;

  constructor(program: Program<XyberSaleIDL>) {
    this.program = program;
    this.seedRoot = Buffer.from(getConstant("seedRoot", program.idl as any));
    this.configSeed = Buffer.from(getConstant("configSeed", program.idl as any));
    this.saleBucketSeed = Buffer.from(getConstant("saleBucketSeed", program.idl as any));
    this.bucketDataSeed = Buffer.from(getConstant("bucketDataSeed", program.idl as any));
    this.bucketPoolSeed = Buffer.from(getConstant("bucketPoolSeed", program.idl as any));
    this.quoteSeed = Buffer.from(getConstant("quoteSeed", program.idl as any));
    this.roundSeed = Buffer.from(getConstant("roundSeed", program.idl as any));
    this.vestingConfigSeed = Buffer.from(getConstant("vestingConfigSeed", program.idl as any));
    this.vestingPlanSeed = Buffer.from(getConstant("vestingPlanSeed", program.idl as any));
  }

  getPda(seeds: (string | Buffer | web3.PublicKey)[]): [web3.PublicKey, number] {
    const seedBuffers = [
      this.seedRoot,
      ...seeds.map((seed) => {
        if (typeof seed === "string") {
          return Buffer.from(seed);
        } else if (typeof seed === "object" && "toBuffer" in seed) {
          return seed.toBuffer();
        } else {
          return seed as Buffer;
        }
      }),
    ];

    return web3.PublicKey.findProgramAddressSync(
      seedBuffers,
      this.program.programId
    );
  }

  getConfigPda(): [web3.PublicKey, number] {
    return this.getPda([this.configSeed]);
  }

  getRoundConfigPda(round: any): [web3.PublicKey, number] {
    const roundName = parseRound(round);
    return this.getPda([this.roundSeed, Buffer.from(roundName)]);
  }

  getBucketPda(bucketName: string): [web3.PublicKey, number] {
    return this.getPda([this.bucketDataSeed, Buffer.from(bucketName)]);
  }

  getVestingConfigPda(bucketName: string, buyer: web3.PublicKey): [web3.PublicKey, number] {
    return this.getPda([this.vestingConfigSeed, Buffer.from(bucketName), buyer.toBuffer()]);
  }

  async initializeIx(args: {
    admin: web3.PublicKey;
    newAdmin: web3.PublicKey;
    baseMint: web3.PublicKey;
  }): Promise<{
    initializeIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    bucketPool: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [bucketPool] = this.getBucketPoolPda();

    const initializeIx = await this.program.methods
      .initialize(args.newAdmin)
      .accountsStrict({
        admin: args.admin,
        config: config,
        baseMint: args.baseMint,
        bucketPool: bucketPool,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { initializeIx, config, bucketPool };
  }

  async initializeTx(args: {
    admin: web3.PublicKey;
    newAdmin: web3.PublicKey;
    baseMint: web3.PublicKey;
  }): Promise<{
    initializeTx: web3.Transaction;
    config: web3.PublicKey;
    bucketPool: web3.PublicKey;
  }> {
    const { initializeIx, config, bucketPool } = await this.initializeIx(args);
    const initializeTx = new web3.Transaction().add(initializeIx);
    return { initializeTx, config, bucketPool };
  }

  async proposeMultisigIx(args: {
    authority: web3.PublicKey;
    newMultisig: web3.PublicKey;
  }): Promise<{
    proposeMultisigIx: web3.TransactionInstruction;
    config: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();

    const proposeMultisigIx = await this.program.methods
      .proposeMultisig(args.newMultisig)
      .accountsStrict({
        authority: args.authority,
        config: config,
      })
      .instruction();

    return { proposeMultisigIx, config };
  }

  async proposeMultisigTx(args: {
    authority: web3.PublicKey;
    newMultisig: web3.PublicKey;
  }): Promise<{
    proposeMultisigTx: web3.Transaction;
    config: web3.PublicKey;
  }> {
    const { proposeMultisigIx, config } = await this.proposeMultisigIx(args);
    const proposeMultisigTx = new web3.Transaction().add(proposeMultisigIx);
    return { proposeMultisigTx, config };
  }

  async acceptMultisigIx(args: {
    newMultisig: web3.PublicKey;
  }): Promise<{
    acceptMultisigIx: web3.TransactionInstruction;
    config: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();

    const acceptMultisigIx = await this.program.methods
      .acceptMultisig()
      .accountsStrict({
        newMultisig: args.newMultisig,
        config: config,
      })
      .instruction();

    return { acceptMultisigIx, config };
  }

  async acceptMultisigTx(args: {
    newMultisig: web3.PublicKey;
  }): Promise<{
    acceptMultisigTx: web3.Transaction;
    config: web3.PublicKey;
  }> {
    const { acceptMultisigIx, config } = await this.acceptMultisigIx(args);
    const acceptMultisigTx = new web3.Transaction().add(acceptMultisigIx);
    return { acceptMultisigTx, config };
  }

  async setQuoteMintIx(args: {
    multisig: web3.PublicKey;
    quoteMint: web3.PublicKey;
    price: BN;
    expo: number;
    isEnabled: boolean;
  }): Promise<{
    setQuoteMintIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    quoteConfig: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [quoteConfig] = this.getQuoteConfigPda(args.quoteMint);
    const [bucketPool] = this.getBucketPoolPda();

    const quotePoolAta = splToken.getAssociatedTokenAddressSync(
      args.quoteMint,
      bucketPool,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const setQuoteMintIx = await this.program.methods
      .setQuoteMint(args.price, args.expo, args.isEnabled)
      .accountsStrict({
        multisig: args.multisig,
        config: config,
        quoteMint: args.quoteMint,
        quoteConfig: quoteConfig,
        bucketPool: bucketPool,
        quotePoolAta: quotePoolAta,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .instruction();

    return { setQuoteMintIx, config, quoteConfig };
  }

  async setQuoteMintTx(args: {
    multisig: web3.PublicKey;
    quoteMint: web3.PublicKey;
    price: BN;
    expo: number;
    isEnabled: boolean;
  }): Promise<{
    setQuoteMintTx: web3.Transaction;
    config: web3.PublicKey;
    quoteConfig: web3.PublicKey;
  }> {
    const { setQuoteMintIx, config, quoteConfig } = await this.setQuoteMintIx(args);
    const setQuoteMintTx = new web3.Transaction().add(setQuoteMintIx);
    return { setQuoteMintTx, config, quoteConfig };
  }

  async setupRoundIx(args: {
    admin: web3.PublicKey;
    round: any;
    startTime: BN;
    endTime: BN;
  }): Promise<{
    setupRoundIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    roundConfig: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [roundConfig] = this.getRoundConfigPda(args.round);

    const setupRoundIx = await this.program.methods
      .setupRound(args.round, args.startTime, args.endTime)
      .accountsStrict({
        admin: args.admin,
        config: config,
        roundConfig: roundConfig,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { setupRoundIx, config, roundConfig };
  }

  async setupRoundTx(args: {
    admin: web3.PublicKey;
    round: any;
    startTime: BN;
    endTime: BN;
  }): Promise<{
    setupRoundTx: web3.Transaction;
    config: web3.PublicKey;
    roundConfig: web3.PublicKey;
  }> {
    const { setupRoundIx, config, roundConfig } = await this.setupRoundIx(args);
    const setupRoundTx = new web3.Transaction().add(setupRoundIx);
    return { setupRoundTx, config, roundConfig };
  }

  async setupBucketIx(args: {
    admin: web3.PublicKey;
    bucketName: string;
    bucketData: {
      vestingType: { deterministic: {} } | { priceless: {} } | null;
      totalDeposit: BN;
      bucketSupply: BN;
      registeredSupply: BN;
      claimedSupply: BN;
      burntSupply: BN;
      vestingPlan: string[];
    };
  }): Promise<{
    setupBucketIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    bucket: web3.PublicKey;
    bucketBaseAta: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [bucket] = this.getBucketPda(args.bucketName);

    const configAccount = await this.program.account.saleConfig.fetch(config);
    const baseMint = configAccount.baseMint;

    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      bucket,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const setupBucketIx = await this.program.methods
      .setupBucket(args.bucketName, args.bucketData)
      .accountsStrict({
        admin: args.admin,
        config: config,
        bucket: bucket,
        bucketBaseAta: bucketBaseAta,
        baseMint: baseMint,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { setupBucketIx, config, bucket, bucketBaseAta };
  }

  async setupBucketTx(args: {
    admin: web3.PublicKey;
    bucketName: string;
    bucketData: {
      vestingType: { deterministic: {} } | { priceless: {} } | null;
      totalDeposit: BN;
      bucketSupply: BN;
      registeredSupply: BN;
      claimedSupply: BN;
      burntSupply: BN;
      vestingPlan: string[];
    };
  }): Promise<{
    setupBucketTx: web3.Transaction;
    config: web3.PublicKey;
    bucket: web3.PublicKey;
    bucketBaseAta: web3.PublicKey;
  }> {
    const { setupBucketIx, config, bucket, bucketBaseAta } = await this.setupBucketIx(args);
    const setupBucketTx = new web3.Transaction().add(setupBucketIx);
    return { setupBucketTx, config, bucket, bucketBaseAta };
  }

  async depositSolIx(args: {
    buyer: web3.PublicKey;
    round: any;
    paymentAmount: BN;
  }): Promise<{
    depositSolIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    roundConfig: web3.PublicKey;
    vestingConfig: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const roundName = parseRound(args.round);
    const [config] = this.getConfigPda();
    const [roundConfig] = this.getRoundConfigPda(args.round);
    const [vestingConfig] = this.getVestingConfigPda(roundName, args.buyer);
    const [bucket] = this.getBucketPda(roundName);
    const [bucketPool] = this.getBucketPoolPda();

    const depositSolIx = await this.program.methods
      .depositSol(args.round, args.paymentAmount)
      .accountsStrict({
        buyer: args.buyer,
        config: config,
        vestingConfig: vestingConfig,
        roundConfig: roundConfig,
        bucketPool: bucketPool,
        bucketData: bucket,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { depositSolIx, config, roundConfig, vestingConfig, bucket };
  }

  async depositSolTx(args: {
    buyer: web3.PublicKey;
    round: any;
    paymentAmount: BN;
  }): Promise<{
    depositSolTx: web3.Transaction;
    config: web3.PublicKey;
    roundConfig: web3.PublicKey;
    vestingConfig: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const { depositSolIx, config, roundConfig, vestingConfig, bucket } = await this.depositSolIx(args);
    const depositSolTx = new web3.Transaction().add(depositSolIx);
    return { depositSolTx, config, roundConfig, vestingConfig, bucket };
  }

  getQuoteConfigPda(quoteMint: web3.PublicKey): [web3.PublicKey, number] {
    return this.getPda([this.quoteSeed, quoteMint.toBuffer()]);
  }

  async depositAssetIx(args: {
    buyer: web3.PublicKey;
    round: any;
    quoteMint: web3.PublicKey;
    paymentAmount: BN;
  }): Promise<{
    depositAssetIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    roundConfig: web3.PublicKey;
    vestingConfig: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const roundName = parseRound(args.round);
    const [config] = this.getConfigPda();
    const [quoteConfig] = this.getQuoteConfigPda(args.quoteMint);
    const [roundConfig] = this.getRoundConfigPda(args.round);
    const [vestingConfig] = this.getVestingConfigPda(roundName, args.buyer);
    const [bucket] = this.getBucketPda(roundName);
    const [bucketPool] = this.getBucketPoolPda();

    const buyerQuoteAta = splToken.getAssociatedTokenAddressSync(
      args.quoteMint,
      args.buyer,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const quotePoolAta = splToken.getAssociatedTokenAddressSync(
      args.quoteMint,
      bucketPool,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const depositAssetIx = await this.program.methods
      .depositAsset(args.round, args.paymentAmount)
      .accountsStrict({
        buyer: args.buyer,
        config: config,
        quoteMint: args.quoteMint,
        quoteConfig: quoteConfig,
        vestingConfig: vestingConfig,
        roundConfig: roundConfig,
        buyerQuoteAta: buyerQuoteAta,
        bucketPool: bucketPool,
        quotePoolAta: quotePoolAta,
        bucketData: bucket,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .instruction();

    return { depositAssetIx, config, roundConfig, vestingConfig, bucket };
  }

  async depositAssetTx(args: {
    buyer: web3.PublicKey;
    round: any;
    quoteMint: web3.PublicKey;
    paymentAmount: BN;
  }): Promise<{
    depositAssetTx: web3.Transaction;
    config: web3.PublicKey;
    roundConfig: web3.PublicKey;
    vestingConfig: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const { depositAssetIx, config, roundConfig, vestingConfig, bucket } = await this.depositAssetIx(args);
    const depositAssetTx = new web3.Transaction().add(depositAssetIx);
    return { depositAssetTx, config, roundConfig, vestingConfig, bucket };
  }

  getVestingPlanPda(vestingPlanName: string): [web3.PublicKey, number] {
    return this.getPda([this.vestingPlanSeed, Buffer.from(vestingPlanName)]);
  }

  async setupVestingPlanIx(args: {
    admin: web3.PublicKey;
    vestingPlanName: string;
    plan: {
      periods: Array<{
        startTimestamp: BN;
        claimRatio: number;
        burnRatio: number;
        basePeriodIndex: number | null;
      }>;
    };
  }): Promise<{
    setupVestingPlanIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    vestingPlan: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [vestingPlan] = this.getVestingPlanPda(args.vestingPlanName);

    const setupVestingPlanIx = await this.program.methods
      .setupVestingPlan(args.vestingPlanName, args.plan)
      .accountsStrict({
        admin: args.admin,
        config: config,
        vestingPlan: vestingPlan,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { setupVestingPlanIx, config, vestingPlan };
  }

  async setupVestingPlanTx(args: {
    admin: web3.PublicKey;
    vestingPlanName: string;
    plan: {
      periods: Array<{
        startTimestamp: BN;
        claimRatio: number;
        burnRatio: number;
        basePeriodIndex: number | null;
      }>;
    };
  }): Promise<{
    setupVestingPlanTx: web3.Transaction;
    config: web3.PublicKey;
    vestingPlan: web3.PublicKey;
  }> {
    const { setupVestingPlanIx, config, vestingPlan } = await this.setupVestingPlanIx(args);
    const setupVestingPlanTx = new web3.Transaction().add(setupVestingPlanIx);
    return { setupVestingPlanTx, config, vestingPlan };
  }

  async setupDeterministicVestingIx(args: {
    admin: web3.PublicKey;
    participant: web3.PublicKey;
    bucketName: string;
    newAllocation: BN;
    vestingPlan: string | null;
    tokensClaimed: BN;
    tokensBurnt: BN;
  }): Promise<{
    setupDeterministicVestingIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    bucket: web3.PublicKey;
    vestingConfig: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [bucket] = this.getBucketPda(args.bucketName);
    const [vestingConfig] = this.getVestingConfigPda(args.bucketName, args.participant);

    const setupDeterministicVestingIx = await this.program.methods
      .setupDeterministicVesting(
        args.bucketName,
        args.newAllocation,
        args.vestingPlan,
        args.tokensClaimed,
        args.tokensBurnt
      )
      .accountsStrict({
        admin: args.admin,
        config: config,
        participant: args.participant,
        bucketData: bucket,
        vestingConfig: vestingConfig,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { setupDeterministicVestingIx, config, bucket, vestingConfig };
  }

  async setupDeterministicVestingTx(args: {
    admin: web3.PublicKey;
    participant: web3.PublicKey;
    bucketName: string;
    newAllocation: BN;
    vestingPlan: string | null;
    tokensClaimed: BN;
    tokensBurnt: BN;
  }): Promise<{
    setupDeterministicVestingTx: web3.Transaction;
    config: web3.PublicKey;
    bucket: web3.PublicKey;
    vestingConfig: web3.PublicKey;
  }> {
    const { setupDeterministicVestingIx, config, bucket, vestingConfig } = await this.setupDeterministicVestingIx(args);
    const setupDeterministicVestingTx = new web3.Transaction().add(setupDeterministicVestingIx);
    return { setupDeterministicVestingTx, config, bucket, vestingConfig };
  }

  async claimIx(args: {
    buyer: web3.PublicKey;
    bucketName: string;
    vestingPlanName: string;
  }): Promise<{
    claimIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    vestingPlan: web3.PublicKey;
    vestingConfig: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [vestingPlan] = this.getVestingPlanPda(args.vestingPlanName);
    const [vestingConfig] = this.getVestingConfigPda(args.bucketName, args.buyer);
    const [bucket] = this.getBucketPda(args.bucketName);

    const configAccount = await this.program.account.saleConfig.fetch(config);
    const baseMint = configAccount.baseMint;

    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      bucket,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const buyerBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      args.buyer,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const claimIx = await this.program.methods
      .claim(args.bucketName, args.vestingPlanName)
      .accountsStrict({
        buyer: args.buyer,
        config: config,
        vestingPlan: vestingPlan,
        vestingConfig: vestingConfig,
        bucketData: bucket,
        bucketPoolAta: bucketBaseAta,
        baseMint: baseMint,
        buyerBaseAta: buyerBaseAta,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { claimIx, config, vestingPlan, vestingConfig, bucket };
  }

  async claimTx(args: {
    buyer: web3.PublicKey;
    bucketName: string;
    vestingPlanName: string;
  }): Promise<{
    claimTx: web3.Transaction;
    config: web3.PublicKey;
    vestingPlan: web3.PublicKey;
    vestingConfig: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const { claimIx, config, vestingPlan, vestingConfig, bucket } = await this.claimIx(args);
    const claimTx = new web3.Transaction().add(claimIx);
    return { claimTx, config, vestingPlan, vestingConfig, bucket };
  }

  getBucketPoolPda(): [web3.PublicKey, number] {
    return web3.PublicKey.findProgramAddressSync(
      [this.seedRoot, this.bucketPoolSeed, this.saleBucketSeed],
      this.program.programId
    );
  }

  async withdrawSolIx(args: {
    multisig: web3.PublicKey;
    addressToWithdrawTo: web3.PublicKey;
  }): Promise<{
    withdrawSolIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    bucketPool: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [bucketPool] = this.getBucketPoolPda();

    const withdrawSolIx = await this.program.methods
      .withdrawSol()
      .accountsStrict({
        multisig: args.multisig,
        config: config,
        bucketPool: bucketPool,
        addressToWithdrawTo: args.addressToWithdrawTo,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { withdrawSolIx, config, bucketPool };
  }

  async withdrawSolTx(args: {
    multisig: web3.PublicKey;
    addressToWithdrawTo: web3.PublicKey;
  }): Promise<{
    withdrawSolTx: web3.Transaction;
    config: web3.PublicKey;
    bucketPool: web3.PublicKey;
  }> {
    const { withdrawSolIx, config, bucketPool } = await this.withdrawSolIx(args);
    const withdrawSolTx = new web3.Transaction().add(withdrawSolIx);
    return { withdrawSolTx, config, bucketPool };
  }

  async withdrawAssetIx(args: {
    multisig: web3.PublicKey;
    quoteMint: web3.PublicKey;
    withdrawOwner: web3.PublicKey;
  }): Promise<{
    withdrawAssetIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    bucketPool: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [bucketPool] = this.getBucketPoolPda();

    const quotePoolAta = splToken.getAssociatedTokenAddressSync(
      args.quoteMint,
      bucketPool,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const withdrawAta = splToken.getAssociatedTokenAddressSync(
      args.quoteMint,
      args.withdrawOwner,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const withdrawAssetIx = await this.program.methods
      .withdrawAsset()
      .accountsStrict({
        multisig: args.multisig,
        config: config,
        bucketPool: bucketPool,
        quoteMint: args.quoteMint,
        quotePoolAta: quotePoolAta,
        withdrawOwner: args.withdrawOwner,
        withdrawAta: withdrawAta,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { withdrawAssetIx, config, bucketPool };
  }

  async withdrawAssetTx(args: {
    multisig: web3.PublicKey;
    quoteMint: web3.PublicKey;
    withdrawOwner: web3.PublicKey;
  }): Promise<{
    withdrawAssetTx: web3.Transaction;
    config: web3.PublicKey;
    bucketPool: web3.PublicKey;
  }> {
    const { withdrawAssetIx, config, bucketPool } = await this.withdrawAssetIx(args);
    const withdrawAssetTx = new web3.Transaction().add(withdrawAssetIx);
    return { withdrawAssetTx, config, bucketPool };
  }

  async withdrawUnsoldTokensIx(args: {
    multisig: web3.PublicKey;
    bucketName: string;
    amount: BN;
    withdrawOwner: web3.PublicKey;
  }): Promise<{
    withdrawUnsoldTokensIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [bucket] = this.getBucketPda(args.bucketName);
    const configAccount = await this.program.account.saleConfig.fetch(config);
    const baseMint = configAccount.baseMint;

    const bucketBaseAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      bucket,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const withdrawAta = splToken.getAssociatedTokenAddressSync(
      baseMint,
      args.withdrawOwner,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const withdrawUnsoldTokensIx = await this.program.methods
      .withdrawUnsoldTokens(args.bucketName, args.amount)
      .accountsStrict({
        multisig: args.multisig,
        config: config,
        bucketData: bucket,
        bucketBaseAta: bucketBaseAta,
        withdrawOwner: args.withdrawOwner,
        withdrawAta: withdrawAta,
        baseMint: baseMint,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { withdrawUnsoldTokensIx, config, bucket };
  }

  async withdrawUnsoldTokensTx(args: {
    multisig: web3.PublicKey;
    bucketName: string;
    amount: BN;
    withdrawOwner: web3.PublicKey;
  }): Promise<{
    withdrawUnsoldTokensTx: web3.Transaction;
    config: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const { withdrawUnsoldTokensIx, config, bucket } = await this.withdrawUnsoldTokensIx(args);
    const withdrawUnsoldTokensTx = new web3.Transaction().add(withdrawUnsoldTokensIx);
    return { withdrawUnsoldTokensTx, config, bucket };
  }

}
