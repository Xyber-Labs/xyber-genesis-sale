import { Program, web3 } from "@coral-xyz/anchor";
import { XyberSale as XyberSaleIDL } from "../idl/xyber_sale";
import { getConstant, getConstantRaw } from "./utils";

export class TxBuilder {
  private program: Program<XyberSaleIDL>;
  private seedRoot: Buffer;

  constructor(program: Program<XyberSaleIDL>) {
    this.program = program;
    this.seedRoot = Buffer.from(getConstant("seedRoot", program.idl as any));
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

  async initializeIx(args: {
    admin: web3.PublicKey;
    newAdmin: web3.PublicKey;
    owner: web3.PublicKey;
  }): Promise<{
    instruction: web3.TransactionInstruction;
    config: web3.PublicKey;
  }> {
    const [config] = this.getPda(["CONFIG"]);

    const instruction = await this.program.methods
      .initialize(args.newAdmin, args.owner)
      .accountsStrict({
        admin: args.admin,
        config: config,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    return { instruction, config };
  }

  async initializeTx(args: {
    admin: web3.PublicKey;
    newAdmin: web3.PublicKey;
    owner: web3.PublicKey;
  }): Promise<{
    transaction: web3.Transaction;
    config: web3.PublicKey;
  }> {
    const { instruction, config } = await this.initializeIx(args);
    const transaction = new web3.Transaction().add(instruction);
    return { transaction, config };
  }

}
