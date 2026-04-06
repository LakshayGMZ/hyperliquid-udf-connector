import type { Bar, HLAssetResponse, HLMarketAsset, HyperLiquidCandle } from "./types";

const DEFAULT_HL_INFO_URL = "https://api.hyperliquid.xyz/info";

export async function fetchHLAssets(infoUrl: string = DEFAULT_HL_INFO_URL): Promise<HLMarketAsset[]> {
  const response = await fetch(infoUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      type: "metaAndAssetCtxs",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Hyperliquid assets: HTTP ${response.status}`);
  }

  const data = (await response.json()) as HLAssetResponse;
  return data[0].universe.map((meta, index) => ({
    meta,
    price: data[1][index],
  }));
}

export async function fetchHLCandles(
  args: {
    symbol: string;
    interval: string;
    startTime: number;
    endTime: number;
    infoUrl?: string;
  },
): Promise<Bar[]> {
  const response = await fetch(args.infoUrl ?? DEFAULT_HL_INFO_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: {
        coin: args.symbol,
        interval: args.interval,
        startTime: args.startTime,
        endTime: args.endTime,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Hyperliquid candles: HTTP ${response.status}`);
  }

  const data = (await response.json()) as HyperLiquidCandle[];
  return data.map((candle) => ({
    time: candle.T,
    open: Number.parseFloat(candle.o),
    high: Number.parseFloat(candle.h),
    low: Number.parseFloat(candle.l),
    close: Number.parseFloat(candle.c),
    volume: Number.parseFloat(candle.v),
  }));
}
