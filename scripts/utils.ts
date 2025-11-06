import * as anchor from "@coral-xyz/anchor";
import XyberSaleSDK from "@xyber-labs/xyber-sale-sdk";

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
