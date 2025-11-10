import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";

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
      const { initializeTx, config, bucketPool } = await txBuilder.initializeTx({
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
      const signature = await provider.sendAndConfirm(initializeTx, [args.adminKeypair]);
      return { signature, config, bucketPool };
    }

    async function setupRound(args: {
      adminKeypair: anchor.web3.Keypair;
      round: any;
      startTime: BN;
      endTime: BN;
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; roundConfig: anchor.web3.PublicKey }> {
      const { setupRoundTx, config, roundConfig } = await txBuilder.setupRoundTx({
        admin: args.adminKeypair.publicKey,
        round: args.round,
        startTime: args.startTime,
        endTime: args.endTime,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(setupRoundTx, [args.adminKeypair]);
      return { signature, config, roundConfig };
    }

    async function setupBucket(args: {
      adminKeypair: anchor.web3.Keypair;
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
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; bucket: anchor.web3.PublicKey; bucketBaseAta: anchor.web3.PublicKey }> {
      const { setupBucketTx, config, bucket, bucketBaseAta } = await txBuilder.setupBucketTx({
        admin: args.adminKeypair.publicKey,
        bucketName: args.bucketName,
        bucketData: args.bucketData,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(setupBucketTx, [args.adminKeypair]);
      return { signature, config, bucket, bucketBaseAta };
    }

    async function depositSol(args: {
      buyerKeypair: anchor.web3.Keypair;
      backendKeypair: anchor.web3.Keypair;
      round: any;
      solPrice: BN;
      paymentAmount: BN;
      expiration: BN;
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; roundConfig: anchor.web3.PublicKey; vestingConfig: anchor.web3.PublicKey; bucket: anchor.web3.PublicKey }> {
      const { depositSolTx, config, roundConfig, vestingConfig, bucket } = await txBuilder.depositSolTx({
        buyer: args.buyerKeypair.publicKey,
        backend: args.backendKeypair.publicKey,
        round: args.round,
        solPrice: args.solPrice,
        paymentAmount: args.paymentAmount,
        expiration: args.expiration,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(depositSolTx, [args.buyerKeypair, args.backendKeypair]);
      return { signature, config, roundConfig, vestingConfig, bucket };
    }

    async function depositAsset(args: {
      buyerKeypair: anchor.web3.Keypair;
      backendKeypair: anchor.web3.Keypair;
      round: any;
      paymentAmount: BN;
      expiration: BN;
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; roundConfig: anchor.web3.PublicKey; vestingConfig: anchor.web3.PublicKey; bucket: anchor.web3.PublicKey }> {
      const { depositAssetTx, config, roundConfig, vestingConfig, bucket } = await txBuilder.depositAssetTx({
        buyer: args.buyerKeypair.publicKey,
        backend: args.backendKeypair.publicKey,
        round: args.round,
        paymentAmount: args.paymentAmount,
        expiration: args.expiration,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(depositAssetTx, [args.buyerKeypair, args.backendKeypair]);
      return { signature, config, roundConfig, vestingConfig, bucket };
    }

    async function setupVestingPlan(args: {
      adminKeypair: anchor.web3.Keypair;
      vestingPlanName: string;
      plan: {
        periods: Array<{
          startTimestamp: BN;
          claimRatio: number;
          burnRatio: number;
          basePeriodIndex: number | null;
        }>;
      };
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; vestingPlan: anchor.web3.PublicKey }> {
      const { setupVestingPlanTx, config, vestingPlan } = await txBuilder.setupVestingPlanTx({
        admin: args.adminKeypair.publicKey,
        vestingPlanName: args.vestingPlanName,
        plan: args.plan,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(setupVestingPlanTx, [args.adminKeypair]);
      return { signature, config, vestingPlan };
    }

    async function setupDeterministicVesting(args: {
      adminKeypair: anchor.web3.Keypair;
      participant: anchor.web3.PublicKey;
      bucketName: string;
      newAllocation: BN;
      vestingPlan: string | null;
      tokensClaimed: BN;
      tokensBurnt: BN;
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; bucket: anchor.web3.PublicKey; vestingConfig: anchor.web3.PublicKey }> {
      const { setupDeterministicVestingTx, config, bucket, vestingConfig } = await txBuilder.setupDeterministicVestingTx({
        admin: args.adminKeypair.publicKey,
        participant: args.participant,
        bucketName: args.bucketName,
        newAllocation: args.newAllocation,
        vestingPlan: args.vestingPlan,
        tokensClaimed: args.tokensClaimed,
        tokensBurnt: args.tokensBurnt,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(setupDeterministicVestingTx, [args.adminKeypair]);
      return { signature, config, bucket, vestingConfig };
    }

    async function claim(args: {
      buyerKeypair: anchor.web3.Keypair;
      bucketName: string;
      vestingPlanName: string;
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; vestingPlan: anchor.web3.PublicKey; vestingConfig: anchor.web3.PublicKey; bucket: anchor.web3.PublicKey }> {
      const { claimTx, config, vestingPlan, vestingConfig, bucket } = await txBuilder.claimTx({
        buyer: args.buyerKeypair.publicKey,
        bucketName: args.bucketName,
        vestingPlanName: args.vestingPlanName,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(claimTx, [args.buyerKeypair]);
      return { signature, config, vestingPlan, vestingConfig, bucket };
    }

    async function withdrawSol(args: {
      multisigKeypair: anchor.web3.Keypair;
      addressToWithdrawTo: anchor.web3.PublicKey;
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; bucketPool: anchor.web3.PublicKey }> {
      const { withdrawSolTx, config, bucketPool } = await txBuilder.withdrawSolTx({
        multisig: args.multisigKeypair.publicKey,
        addressToWithdrawTo: args.addressToWithdrawTo,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(withdrawSolTx, [args.multisigKeypair]);
      return { signature, config, bucketPool };
    }

    async function withdrawAsset(args: {
      multisigKeypair: anchor.web3.Keypair;
      withdrawOwner: anchor.web3.PublicKey;
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; bucketPool: anchor.web3.PublicKey }> {
      const { withdrawAssetTx, config, bucketPool } = await txBuilder.withdrawAssetTx({
        multisig: args.multisigKeypair.publicKey,
        withdrawOwner: args.withdrawOwner,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(withdrawAssetTx, [args.multisigKeypair]);
      return { signature, config, bucketPool };
    }

    async function withdrawUnsoldTokens(args: {
      multisigKeypair: anchor.web3.Keypair;
      bucketName: string;
      amount: BN;
      withdrawOwner: anchor.web3.PublicKey;
    }): Promise<{ signature: string; config: anchor.web3.PublicKey; bucket: anchor.web3.PublicKey }> {
      const { withdrawUnsoldTokensTx, config, bucket } = await txBuilder.withdrawUnsoldTokensTx({
        multisig: args.multisigKeypair.publicKey,
        bucketName: args.bucketName,
        amount: args.amount,
        withdrawOwner: args.withdrawOwner,
      });

      if (!provider.sendAndConfirm) {
        throw new Error("Provider does not support sendAndConfirm");
      }
      const signature = await provider.sendAndConfirm(withdrawUnsoldTokensTx, [args.multisigKeypair]);
      return { signature, config, bucket };
    }

    return {
      idl,
      program,
      txBuilder,

      initialize,
      initializeIx: txBuilder.initializeIx.bind(txBuilder),
      initializeTx: txBuilder.initializeTx.bind(txBuilder),

      setupRound,
      setupRoundIx: txBuilder.setupRoundIx.bind(txBuilder),
      setupRoundTx: txBuilder.setupRoundTx.bind(txBuilder),

      setupBucket,
      setupBucketIx: txBuilder.setupBucketIx.bind(txBuilder),
      setupBucketTx: txBuilder.setupBucketTx.bind(txBuilder),

      depositSol,
      depositSolIx: txBuilder.depositSolIx.bind(txBuilder),
      depositSolTx: txBuilder.depositSolTx.bind(txBuilder),

      depositAsset,
      depositAssetIx: txBuilder.depositAssetIx.bind(txBuilder),
      depositAssetTx: txBuilder.depositAssetTx.bind(txBuilder),

      setupVestingPlan,
      setupVestingPlanIx: txBuilder.setupVestingPlanIx.bind(txBuilder),
      setupVestingPlanTx: txBuilder.setupVestingPlanTx.bind(txBuilder),

      setupDeterministicVesting,
      setupDeterministicVestingIx: txBuilder.setupDeterministicVestingIx.bind(txBuilder),
      setupDeterministicVestingTx: txBuilder.setupDeterministicVestingTx.bind(txBuilder),

      claim,
      claimIx: txBuilder.claimIx.bind(txBuilder),
      claimTx: txBuilder.claimTx.bind(txBuilder),

      withdrawSol,
      withdrawSolIx: txBuilder.withdrawSolIx.bind(txBuilder),
      withdrawSolTx: txBuilder.withdrawSolTx.bind(txBuilder),

      withdrawAsset,
      withdrawAssetIx: txBuilder.withdrawAssetIx.bind(txBuilder),
      withdrawAssetTx: txBuilder.withdrawAssetTx.bind(txBuilder),

      withdrawUnsoldTokens,
      withdrawUnsoldTokensIx: txBuilder.withdrawUnsoldTokensIx.bind(txBuilder),
      withdrawUnsoldTokensTx: txBuilder.withdrawUnsoldTokensTx.bind(txBuilder),
    };
  },
};

export default XyberSaleSDK;
export type { XyberSaleIDL };
