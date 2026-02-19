import * as anchor from "@coral-xyz/anchor";
import {web3} from "@coral-xyz/anchor";
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
    return {provider, sdk};
}

export async function runWithSdk(
    fn: (ctx: { provider: anchor.AnchorProvider; sdk: ReturnType<typeof XyberSaleSDK.create> }) => Promise<void>
): Promise<void> {
    try {
        const {provider, sdk} = initializeSdk();
        await fn({provider, sdk});
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
