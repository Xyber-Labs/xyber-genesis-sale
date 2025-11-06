import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import type { XyberSale as XyberSaleIDL } from "../idl/xyber_sale";
import { TxBuilder } from "./txBuilder";

let idl: any;
const loadIdl = async () => {
  if (!idl) {
    const idlModule = await import("../idl/xyber_sale.json");
    idl = idlModule.default;
  }
  return idl;
};

const XyberSaleSDK = {
  idlJson: null,
  loadIdl,
  idlType: null as unknown as XyberSaleIDL,

  create(
    provider: anchor.Provider,
    program: Program<XyberSaleIDL>
  ) {
    const txBuilder = new TxBuilder(program);

    async function initialize(args: {
      adminKeypair: anchor.web3.Keypair;
      newAdmin: anchor.web3.PublicKey;
      backend: anchor.web3.PublicKey;
      multisig: anchor.web3.PublicKey;
      baseMint: anchor.web3.PublicKey;
      quoteMint: anchor.web3.PublicKey;
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; bucketPool: anchor.web3.PublicKey }> {
      const { transaction, config, bucketPool } = await txBuilder.initializeTx({
        admin: args.adminKeypair.publicKey,
        newAdmin: args.newAdmin,
        backend: args.backend,
        multisig: args.multisig,
        baseMint: args.baseMint,
        quoteMint: args.quoteMint,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(transaction, [args.adminKeypair]);
      return { signature, config, bucketPool };
    }

    return {
      idl,
      program,
      txBuilder,

      initialize,
      initializeIx: txBuilder.initializeIx.bind(txBuilder),
      initializeTx: txBuilder.initializeTx.bind(txBuilder),
    };
  },
};

export default XyberSaleSDK;
export type { XyberSaleIDL };
