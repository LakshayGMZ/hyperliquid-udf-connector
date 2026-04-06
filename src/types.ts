export type ResolutionString = string;

export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type LibrarySymbolInfo = {
  name: string;
  ticker: string;
  description: string;
  type: string;
  session: string;
  timezone: string;
  format: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_seconds: boolean;
  has_weekly_and_monthly: boolean;
  exchange: string;
  listed_exchange: string;
  logo_urls?: string[];
};

export type SearchSymbolResultItem = {
  symbol: string;
  description: string;
  exchange: string;
  ticker: string;
  type: string;
  logo_urls?: string[];
};

export type PeriodParams = {
  from: number;
  to: number;
  firstDataRequest: boolean;
  countBack: number;
};

export type DatafeedConfiguration = {
  supported_resolutions: ResolutionString[];
  supports_group_request: boolean;
  supports_marks: boolean;
  supports_search: boolean;
  supports_timescale_marks: boolean;
};

export type OnReadyCallback = (configuration: DatafeedConfiguration) => void;
export type SearchSymbolsCallback = (result: SearchSymbolResultItem[]) => void;
export type ResolveCallback = (symbolInfo: LibrarySymbolInfo) => void;
export type DatafeedErrorCallback = (reason: string) => void;
export type HistoryMetadata = { noData?: boolean };
export type HistoryCallback = (bars: Bar[], meta: HistoryMetadata) => void;
export type SubscribeBarsCallback = (bar: Bar) => void;

export type HLAssetResponse = [{ universe: HLAssetMeta[] }, HLAssetPriceData[]];

export type HLMarketAsset = {
  meta: HLAssetMeta;
  price: HLAssetPriceData;
};

export type HLAssetMeta = {
  szDecimals: number;
  name: string;
  maxLeverage: number;
  marginTableId: number;
  isDelisted?: boolean;
};

export type HLAssetPriceData = {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium?: string;
  oraclePx: string;
  markPx: string;
  midPx?: string;
  impactPxs?: string[];
  dayBaseVlm: string;
};

export type HyperLiquidCandle = {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
};

export type HLWsMessage =
  | { channel: "candle"; data: HyperLiquidCandle }
  | { channel: "pong" }
  | { channel: string; data?: unknown };

