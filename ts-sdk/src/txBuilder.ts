import { BN, Program, web3 } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { XyberSale as XyberSaleIDL } from "../idl/xyber_sale";
import { getConstant, getConstantRaw, parseRound } from "./utils";

export class TxBuilder {
  private program: Program<XyberSaleIDL>;
  private seedRoot: Buffer;
  private saleBucketSeed: Buffer;

  constructor(program: Program<XyberSaleIDL>) {
    this.program = program;
    this.seedRoot = Buffer.from(getConstant("seedRoot", program.idl as any));
    this.saleBucketSeed = Buffer.from(getConstantRaw("saleBucketSeed", program.idl as any));
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
    return this.getPda(["CONFIG"]);
  }

  getBucketPoolPda(): [web3.PublicKey, number] {
    return this.getPda(["BUCKET_POOL", this.saleBucketSeed]);
  }

  getRoundConfigPda(round: any): [web3.PublicKey, number] {
    const roundName = parseRound(round);
    return this.getPda(["ROUND", Buffer.from(roundName!)]);
  }

  getBucketPda(bucketName: string): [web3.PublicKey, number] {
    return this.getPda(["BUCKET", Buffer.from(bucketName)]);
  }

  getVestingConfigPda(round: any, buyer: web3.PublicKey): [web3.PublicKey, number] {
    const roundName = parseRound(round);
    return this.getPda(["VESTING_CONFIG", Buffer.from(roundName!), buyer.toBuffer()]);
  }

  async initializeIx(args: {
    admin: web3.PublicKey;
    newAdmin: web3.PublicKey;
    backend: web3.PublicKey;
    multisig: web3.PublicKey;
    baseMint: web3.PublicKey;
    quoteMint: web3.PublicKey;
  }): Promise<{
    initializeIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    bucketPool: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [bucketPool] = this.getBucketPoolPda();

    const bucketPoolAta = splToken.getAssociatedTokenAddressSync(
      args.quoteMint,
      bucketPool,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const initializeIx = await this.program.methods
      .initialize(args.newAdmin, args.backend, args.multisig)
      .accountsStrict({
        admin: args.admin,
        config: config,
        baseMint: args.baseMint,
        quoteMint: args.quoteMint,
        bucketPool: bucketPool,
        bucketPoolAta: bucketPoolAta,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .instruction();

    return { initializeIx, config, bucketPool };
  }

  async initializeTx(args: {
    admin: web3.PublicKey;
    newAdmin: web3.PublicKey;
    backend: web3.PublicKey;
    multisig: web3.PublicKey;
    baseMint: web3.PublicKey;
    quoteMint: web3.PublicKey;
  }): Promise<{
    initializeTx: web3.Transaction;
    config: web3.PublicKey;
    bucketPool: web3.PublicKey;
  }> {
    const { initializeIx, config, bucketPool } = await this.initializeIx(args);
    const initializeTx = new web3.Transaction().add(initializeIx);
    return { initializeTx, config, bucketPool };
  }

  async setupRoundIx(args: {
    admin: web3.PublicKey;
    round: any;
    price: BN;
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
      .setupRound(args.round, args.price, args.startTime, args.endTime)
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
    price: BN;
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
    backend: web3.PublicKey;
    round: any;
    solPrice: BN;
    baseAllocation: BN;
    expiration: BN;
    bucketName: string;
  }): Promise<{
    depositSolIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    roundConfig: web3.PublicKey;
    vestingConfig: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [roundConfig] = this.getRoundConfigPda(args.round);
    const [vestingConfig] = this.getVestingConfigPda(args.round, args.buyer);
    const [bucket] = this.getBucketPda(args.bucketName);
    const [bucketPool] = this.getBucketPoolPda();

    const configAccount = await this.program.account.saleConfig.fetch(config);
    const baseMint = configAccount.baseMint;
    const quoteMint = configAccount.quoteMint;

    const depositSolIx = await this.program.methods
      .depositSol(args.round, args.solPrice, args.baseAllocation, args.expiration)
      .accountsStrict({
        buyer: args.buyer,
        backend: args.backend,
        config: config,
        roundConfig: roundConfig,
        vestingConfig: vestingConfig,
        bucketData: bucket,
        baseMint: baseMint,
        quoteMint: quoteMint,
        bucketPool: bucketPool,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { depositSolIx, config, roundConfig, vestingConfig, bucket };
  }

  async depositSolTx(args: {
    buyer: web3.PublicKey;
    backend: web3.PublicKey;
    round: any;
    solPrice: BN;
    baseAllocation: BN;
    expiration: BN;
    bucketName: string;
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

  async depositAssetIx(args: {
    buyer: web3.PublicKey;
    backend: web3.PublicKey;
    round: any;
    baseAllocation: BN;
    expiration: BN;
    bucketName: string;
  }): Promise<{
    depositAssetIx: web3.TransactionInstruction;
    config: web3.PublicKey;
    roundConfig: web3.PublicKey;
    vestingConfig: web3.PublicKey;
    bucket: web3.PublicKey;
  }> {
    const [config] = this.getConfigPda();
    const [roundConfig] = this.getRoundConfigPda(args.round);
    const [vestingConfig] = this.getVestingConfigPda(args.round, args.buyer);
    const [bucket] = this.getBucketPda(args.bucketName);
    const [bucketPool] = this.getBucketPoolPda();

    const configAccount = await this.program.account.saleConfig.fetch(config);
    const baseMint = configAccount.baseMint;
    const quoteMint = configAccount.quoteMint;

    const buyerQuoteAta = splToken.getAssociatedTokenAddressSync(
      quoteMint,
      args.buyer,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const bucketPoolAta = splToken.getAssociatedTokenAddressSync(
      quoteMint,
      bucketPool,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const depositAssetIx = await this.program.methods
      .depositAsset(args.round, args.baseAllocation, args.expiration)
      .accountsStrict({
        buyer: args.buyer,
        backend: args.backend,
        config: config,
        vestingConfig: vestingConfig,
        roundConfig: roundConfig,
        baseMint: baseMint,
        quoteMint: quoteMint,
        buyerQuoteAta: buyerQuoteAta,
        bucketPool: bucketPool,
        bucketPoolAta: bucketPoolAta,
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
    backend: web3.PublicKey;
    round: any;
    baseAllocation: BN;
    expiration: BN;
    bucketName: string;
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
    return this.getPda(["VESTING_PLAN", Buffer.from(vestingPlanName)]);
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

}
