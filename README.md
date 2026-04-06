# Hyperliquid UDF Connector (TradingView Charting Library)

Standalone, open-source connector that implements TradingView Datafeed API-compatible methods (`onReady`, `searchSymbols`, `resolveSymbol`, `getBars`, `subscribeBars`, `unsubscribeBars`) for Hyperliquid perpetual markets.

## What this repo includes

- Symbol discovery from Hyperliquid `metaAndAssetCtxs`
- Candle history via Hyperliquid `candleSnapshot`
- Real-time candle streaming via Hyperliquid WebSocket `candle` subscription
- TypeScript-first API that can be passed directly as `datafeed` to TradingView widget

## Install and try demo
### 1. Add TradingView Charting Library into demo assets

Download/Clone the Charting Library [from here](https://github.com/tradingview/charting_library) **[needs license from TradingView for library access]** and place it here:

- `demo/assets/`

Expected files:

- `demo/assets/charting_library/charting_library.js`
- `demo/assets/charting_library/bundles/*`

### 2. Build and try out the demo

```bash
npm install
npm run demo
```

This builds:

- Connector library to `dist/*`
- Demo frontend to `dist/demo/*`
- TradingView private assets to `dist/demo/assets/charting_library/*`

### 3. Run demo from dist

Visit [here](http://localhost:8080/demo/) to see the demo in action. You should see a TradingView chart with Hyperliquid perpetual market data.

Demo logic is TypeScript (`src/demo/main.ts`) compiled to `dist/demo/main.js`.

## Use in your own app

### Widget integration

```ts
import { widget } from "./charting_library";
import { HyperliquidUdfConnector } from "hyperliquid-udf-connector";

const datafeed = new HyperliquidUdfConnector();

new widget({
  datafeed,
  symbol: "BTC",
  interval: "15",
  container: "tv_chart_container",
  library_path: "/charting_library/",
  autosize: true,
});
```

## Private library safety

This repo already ignores TradingView private files:

- `charting_library`
- `public/charting_library`
- `src/charting_library`
- `src/demo/assets/charting_library`
- `dist/demo/assets/charting_library`
