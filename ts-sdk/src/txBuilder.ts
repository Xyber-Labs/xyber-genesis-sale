import { Program, web3 } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { XyberSale as XyberSaleIDL } from "../idl/xyber_sale";
import { getConstant, getConstantRaw } from "./utils";

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
    transaction: web3.Transaction;
    config: web3.PublicKey;
    bucketPool: web3.PublicKey;
  }> {
    const { initializeIx, config, bucketPool } = await this.initializeIx(args);
    const transaction = new web3.Transaction().add(initializeIx);
    return { transaction, config, bucketPool };
  }

}
