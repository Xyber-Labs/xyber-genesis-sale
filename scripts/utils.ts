import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as readline from "readline";
import XyberSaleSDK from "@xyber-labs/xyber-sale-sdk";

export async function txToBase58(
  tx: web3.Transaction,
  feePayer: web3.PublicKey,
): Promise<string> {
  tx.recentBlockhash = "11111111111111111111111111111111";
  tx.feePayer = feePayer;
  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const bs58 = await import("bs58");
  return bs58.default.encode(serialized);
}

const DEFAULT_TREZOR_PATH = "m/44'/501'/0'/0'";

function promptPassphrase(): Promise<string> {
  const ttyFd = fs.openSync("/dev/tty", "r+");
  const tty = new (require("tty").ReadStream)(ttyFd);
  tty.setRawMode(true);
  tty.setEncoding("utf8");

  fs.writeSync(ttyFd, "Enter Trezor passphrase: ");

  return new Promise((resolve) => {
    let input = "";
    tty.on("data", (ch: string) => {
      if (ch === "\r" || ch === "\n") {
        tty.setRawMode(false);
        tty.destroy();
        fs.writeSync(ttyFd, "\n");
        fs.closeSync(ttyFd);
        resolve(input);
      } else if (ch === "\u007f" || ch === "\b") {
        if (input.length > 0) {
          input = input.slice(0, -1);
          fs.writeSync(ttyFd, "\b \b");
        }
      } else if (ch === "\u0003") {
        tty.destroy();
        fs.closeSync(ttyFd);
        process.exit(1);
      } else {
        input += ch;
        fs.writeSync(ttyFd, "*");
      }
    });
  });
}

export async function trezorInit(usePassphrase: boolean = true): Promise<void> {
  const passphrase = usePassphrase ? await promptPassphrase() : "";

  const trezor = await import("@trezor/connect");
  const TrezorConnect = trezor.default;
  const UI = trezor.UI;

  await TrezorConnect.init({
    manifest: {
      email: "dev@xyber-labs.com",
      appUrl: "https://xyber-labs.com",
      appName: "XyberSale",
    },
  });

  TrezorConnect.on("UI_EVENT", (event: any) => {
    if (event.type === UI.REQUEST_PASSPHRASE) {
      TrezorConnect.uiResponse({
        type: UI.RECEIVE_PASSPHRASE,
        payload: {
          value: passphrase,
          passphraseOnDevice: false,
          save: true,
        },
      });
    }
    if (event.type === UI.REQUEST_BUTTON) {
      console.error("Please confirm on Trezor device...");
    }
  });
}

export async function trezorDispose(): Promise<void> {
  const TrezorConnect = (await import("@trezor/connect")).default;
  TrezorConnect.dispose();
}

export async function trezorGetPublicKey(
  path: string = DEFAULT_TREZOR_PATH,
): Promise<web3.PublicKey> {
  const TrezorConnect = (await import("@trezor/connect")).default;
  const result = await TrezorConnect.solanaGetPublicKey({
    path,
    showOnTrezor: false,
  });
  if (!result.success) {
    throw new Error(`Trezor: ${(result.payload as any).error}`);
  }
  const pubkey = (result.payload as any).publicKeyBase58 || result.payload.publicKey;
  return new web3.PublicKey(pubkey);
}

export async function trezorSignAndSend(
  provider: anchor.AnchorProvider,
  tx: web3.Transaction,
  signerPubkey: web3.PublicKey,
  path: string = DEFAULT_TREZOR_PATH,
): Promise<string> {
  const connection = provider.connection;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = provider.wallet.publicKey;

  const serializedTx = tx.serializeMessage().toString("hex");

  const TrezorConnect = (await import("@trezor/connect")).default;
  const result = await TrezorConnect.solanaSignTransaction({
    path,
    serializedTx,
  });

  if (!result.success) {
    throw new Error(`Trezor signing failed: ${(result.payload as any).error}`);
  }

  const signatureBytes = Buffer.from(result.payload.signature, "hex");
  tx.addSignature(signerPubkey, signatureBytes);

  provider.wallet.signTransaction(tx);

  const rawTx = tx.serialize();
  const signature = await connection.sendRawTransaction(rawTx);
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
  return signature;
}

export function getExplorerUrl(provider: anchor.Provider, signature: string): string {
  const cluster = provider.connection.rpcEndpoint.includes("devnet")
    ? "devnet"
    : provider.connection.rpcEndpoint.includes("testnet")
      ? "testnet"
      : provider.connection.rpcEndpoint.includes("localhost") ||
          provider.connection.rpcEndpoint.includes("127.0.0.1")
        ? "custom&customUrl=" + encodeURIComponent(provider.connection.rpcEndpoint)
        : "mainnet-beta";

  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export function initializeSdk() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.XyberSale;
  const sdk = XyberSaleSDK.create(provider, program);
  return { provider, sdk };
}

export async function runWithSdk(
  fn: (ctx: { provider: anchor.AnchorProvider; sdk: ReturnType<typeof XyberSaleSDK.create> }) => Promise<void>
): Promise<void> {
  try {
    const { provider, sdk } = initializeSdk();
    await fn({ provider, sdk });
  } catch (error) {
    console.error("❌ Transaction failed:");
    console.error(error);
    if (error.logs) {
      console.error("Program logs:");
      error.logs.forEach((log: string) => console.error(log));
    }
    process.exit(1);
  }
}
