import * as anchor from "@coral-xyz/anchor";

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
