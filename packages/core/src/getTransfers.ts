import {
    BuilderHyperliquidInternalTransferOptions,
    BuildHyperliquidSendAssetOptions, HyperliquidCoreError, HyperliquidInternalTransfer, HyperliquidSendAsset
} from "./types";
import {getMetadataCache} from "./config/hl";
import {getCoinDexName, getTokenByIndex} from "./shared";


export async function buildInternalTransfer(
    options: BuilderHyperliquidInternalTransferOptions,
): Promise<HyperliquidInternalTransfer> {
    const [allPerpMetas, spotMeta] = await Promise.all([getMetadataCache().getAllPerpMetas(), getMetadataCache().getSpotMeta()]);
    const tokenByIndex = getTokenByIndex(spotMeta);
    const normalizedDexName = options.dex?.trim() ?? "";
    const fromPerp = options.fromPerp ?? true;
    const perpMeta = allPerpMetas.find((dexMetadata) => getCoinDexName(dexMetadata.universe[0]?.name ?? "") === normalizedDexName);

    if (!perpMeta) {
        throw new HyperliquidCoreError(`Unable to resolve perpetual dex for ${normalizedDexName}`);
    }

    const collateralToken = tokenByIndex.get(perpMeta.collateralToken);
    if (!collateralToken?.tokenId) {
        throw new HyperliquidCoreError(`Unable to resolve transfer token for ${normalizedDexName}`);
    }

    return {
        sourceDex: fromPerp ? normalizedDexName : "spot",
        destination: options.destination,
        destinationDex: fromPerp ? "spot" : normalizedDexName,
        token: `${collateralToken.name}:${collateralToken.tokenId}`,
        amount: options.amount,
    };
}

export async function buildSendAsset(
    options: BuildHyperliquidSendAssetOptions,
): Promise<HyperliquidSendAsset> {
    const normalizedAsset = options.asset.trim().toUpperCase();

    if (options.marketType === "perp") {
        if (normalizedAsset !== "USDC") {
            throw new HyperliquidCoreError("Perp send only supports USDC");
        }

        return {
            sourceDex: "",
            destination: options.destination,
            destinationDex: "",
            amount: options.amount,
            token: "USDC",
        };
    }

    if (normalizedAsset.includes("/")) {
        throw new HyperliquidCoreError("Spot send asset must be a base asset symbol, not a trading pair");
    }

    return {
        destination: options.destination,
        amount: options.amount,
        sourceDex: "spot",
        destinationDex: "spot",
        token: await resolveSpotTransferToken(normalizedAsset),
    };
}

export async function resolveSpotTransferToken(asset: string): Promise<string> {
    const spotMeta = await getMetadataCache().getSpotMeta();
    const token = spotMeta.tokens.find((item) => item.name.toUpperCase() === asset);

    if (!token?.tokenId) {
        throw new HyperliquidCoreError(`Unable to resolve spot token for ${asset}`);
    }

    return `${token.name}:${token.tokenId}`;
}
