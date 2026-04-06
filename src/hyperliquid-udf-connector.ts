import { fetchHLAssets, fetchHLCandles } from "./hyperliquid-api";
import {
  convertTvResolutionToHlInterval,
  convertTvResolutionToMs,
  DEFAULT_SUPPORTED_RESOLUTIONS,
} from "./resolution";
import type {
  Bar,
  DatafeedConfiguration,
  DatafeedErrorCallback,
  HistoryCallback,
  LibrarySymbolInfo,
  OnReadyCallback,
  PeriodParams,
  ResolveCallback,
  ResolutionString,
  SearchSymbolsCallback,
  SubscribeBarsCallback,
  HLMarketAsset,
  HLWsMessage,
  HyperLiquidCandle,
} from "./types";

type Subscription = {
  listenerGuid: string;
  symbol: string;
  resolution: ResolutionString;
  onTick: SubscribeBarsCallback;
};

export type HyperliquidUdfConnectorOptions = {
  infoUrl?: string;
  wsUrl?: string;
  supportedResolutions?: ResolutionString[];
  exchangeName?: string;
  assetsCacheTtlMs?: number;
};

export class HyperliquidUdfConnector {
  private readonly infoUrl: string;
  private readonly wsUrl: string;
  private readonly supportedResolutions: ResolutionString[];
  private readonly exchangeName: string;
  private readonly assetsCacheTtlMs: number;
  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private subscriptions = new Map<string, Subscription>();
  private assetsCache: HLMarketAsset[] = [];
  private assetsCacheTime = 0;

  public constructor(options: HyperliquidUdfConnectorOptions = {}) {
    this.infoUrl = options.infoUrl ?? "https://api.hyperliquid.xyz/info";
    this.wsUrl = options.wsUrl ?? "wss://api.hyperliquid.xyz/ws";
    this.supportedResolutions =
      options.supportedResolutions ?? DEFAULT_SUPPORTED_RESOLUTIONS;
    this.exchangeName = options.exchangeName ?? "hyperliquid";
    this.assetsCacheTtlMs = options.assetsCacheTtlMs ?? 120_000;
  }

  public onReady = (callback: OnReadyCallback): void => {
    const config: DatafeedConfiguration = {
      supported_resolutions: this.supportedResolutions,
      supports_group_request: false,
      supports_marks: false,
      supports_search: true,
      supports_timescale_marks: false,
    };
    setTimeout(() => callback(config), 0);
  };

  public searchSymbols = async (
    userInput: string,
    _exchange: string,
    _symbolType: string,
    onResultReadyCallback: SearchSymbolsCallback,
  ): Promise<void> => {
    const assets = await this.getAssets();
    const search = userInput.toLowerCase();

    const result = assets
      .filter((asset) => !asset.meta.isDelisted)
      .filter((asset) => asset.meta.name.toLowerCase().includes(search))
      .map((asset) => ({
        symbol: asset.meta.name,
        description: "",
        exchange: this.exchangeName,
        ticker: asset.meta.name,
        type: "crypto",
        logo_urls: [
          `https://app.hyperliquid.xyz/coins/${asset.meta.name.toUpperCase()}.svg`,
        ],
      }));

    onResultReadyCallback(result);
  };

  public resolveSymbol = async (
    symbolName: string,
    onResolve: ResolveCallback,
    onError: DatafeedErrorCallback,
  ): Promise<void> => {
    try {
      const assets = await this.getAssets();
      const asset = assets.find((entry) => entry.meta.name === symbolName);
      if (!asset) {
        onError(`Unknown symbol: ${symbolName}`);
        return;
      }

      const symbolInfo: LibrarySymbolInfo = {
        name: symbolName,
        ticker: symbolName,
        description: symbolName,
        type: "crypto",
        session: "24x7",
        timezone: "Etc/UTC",
        format: "price",
        minmov: 1,
        pricescale: Math.pow(10, asset.meta.szDecimals),
        has_seconds: false,
        has_intraday: true,
        has_weekly_and_monthly: true,
        exchange: this.exchangeName,
        listed_exchange: this.exchangeName,
        logo_urls: [
          `https://app.hyperliquid.xyz/coins/${symbolName.toUpperCase()}.svg`,
        ],
      };

      onResolve(symbolInfo);
    } catch (error) {
      onError(error instanceof Error ? error.message : "resolveSymbol failed");
    }
  };

  public getBars = async (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResult: HistoryCallback,
    onError: DatafeedErrorCallback,
  ): Promise<void> => {
    try {
      const hlInterval = convertTvResolutionToHlInterval(resolution);
      const resolutionMs = convertTvResolutionToMs(resolution);
      const bars = await fetchHLCandles({
        symbol: symbolInfo.ticker,
        interval: hlInterval,
        startTime: periodParams.from * 1000,
        endTime: periodParams.to * 1000 - resolutionMs,
        infoUrl: this.infoUrl,
      });

      onResult(bars, { noData: bars.length === 0 });
    } catch (error) {
      onError(error instanceof Error ? error.message : "getBars failed");
    }
  };

  public subscribeBars = (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
  ): void => {
    this.subscriptions.set(listenerGuid, {
      listenerGuid,
      symbol: symbolInfo.ticker,
      resolution,
      onTick,
    });

    this.ensureWs();
    this.sendSubscribe(symbolInfo.ticker, resolution);
  };

  public unsubscribeBars = (listenerGuid: string): void => {
    const existing = this.subscriptions.get(listenerGuid);
    if (!existing) {
      return;
    }

    this.subscriptions.delete(listenerGuid);
    const hasSameChannel = [...this.subscriptions.values()].some(
      (sub) =>
        sub.symbol === existing.symbol && sub.resolution === existing.resolution,
    );

    if (!hasSameChannel) {
      this.sendUnsubscribe(existing.symbol, existing.resolution);
    }

    if (this.subscriptions.size === 0) {
      this.disconnectWs();
    }
  };

  private async getAssets(): Promise<HLMarketAsset[]> {
    const now = Date.now();
    const isFresh = now - this.assetsCacheTime < this.assetsCacheTtlMs;
    if (isFresh && this.assetsCache.length > 0) {
      return this.assetsCache;
    }

    this.assetsCache = await fetchHLAssets(this.infoUrl);
    this.assetsCacheTime = now;
    return this.assetsCache;
  }

  private ensureWs(): void {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.wsUrl);
    this.ws.onopen = () => {
      this.startPing();
      for (const sub of this.subscriptions.values()) {
        this.sendSubscribe(sub.symbol, sub.resolution);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as HLWsMessage;
        if (!isCandleMessage(message)) {
          return;
        }
        const candle = message.data;

        const nextBar: Bar = {
          time: candle.t * 1000,
          open: Number.parseFloat(candle.o),
          high: Number.parseFloat(candle.h),
          low: Number.parseFloat(candle.l),
          close: Number.parseFloat(candle.c),
          volume: Number.parseFloat(candle.v),
        };

        for (const sub of this.subscriptions.values()) {
          const subInterval = convertTvResolutionToHlInterval(sub.resolution);
          if (sub.symbol === candle.s && subInterval === candle.i) {
            sub.onTick(nextBar);
          }
        }
      } catch {
        return;
      }
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.ws = null;
      if (this.subscriptions.size > 0) {
        setTimeout(() => this.ensureWs(), 1000);
      }
    };
  }

  private disconnectWs(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, "No active subscriptions");
      this.ws = null;
    }
  }

  private sendSubscribe(symbol: string, resolution: ResolutionString): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const interval = convertTvResolutionToHlInterval(resolution);
    this.ws.send(
      JSON.stringify({
        method: "subscribe",
        subscription: {
          type: "candle",
          coin: symbol,
          interval,
        },
      }),
    );
  }

  private sendUnsubscribe(symbol: string, resolution: ResolutionString): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const interval = convertTvResolutionToHlInterval(resolution);
    this.ws.send(
      JSON.stringify({
        method: "unsubscribe",
        subscription: {
          type: "candle",
          coin: symbol,
          interval,
        },
      }),
    );
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }
      this.ws.send(JSON.stringify({ method: "ping" }));
    }, 50_000);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

function isCandleMessage(
  message: HLWsMessage,
): message is { channel: "candle"; data: HyperLiquidCandle } {
  if (message.channel !== "candle") {
    return false;
  }
  if (!message.data || typeof message.data !== "object") {
    return false;
  }
  const data = message.data as Partial<HyperLiquidCandle>;
  return typeof data.s === "string" && typeof data.i === "string" && typeof data.t === "number";
}
