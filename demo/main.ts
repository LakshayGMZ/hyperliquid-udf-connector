import { HyperliquidUdfConnector } from "../src/hyperliquid-udf-connector";

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => {
        onChartReady: (cb: () => void) => void;
        remove: () => void;
      };
    };
  }
}

export {};

const statusEl = document.getElementById("status");
const symbolInput = document.getElementById("symbolInput") as HTMLInputElement | null;
const intervalSelect = document.getElementById("intervalSelect") as HTMLSelectElement | null;
const loadChartButton = document.getElementById("loadChartButton");

let tvWidget: { onChartReady: (cb: () => void) => void; remove: () => void } | null = null;

function setStatus(value: string): void {
  if (statusEl) {
    statusEl.textContent = value;
  }
}

function ensureChartingLibrary(): void {
  if (!window.TradingView || !window.TradingView.widget) {
    throw new Error(
      "TradingView Charting Library not found at ./assets/charting_library/charting_library.js",
    );
  }
}

function buildWidget(): void {
  ensureChartingLibrary();

  if (!symbolInput || !intervalSelect) {
    throw new Error("Demo controls not found in DOM");
  }

  if (tvWidget) {
    tvWidget.remove();
    tvWidget = null;
  }

  const symbol = String(symbolInput.value || "BTC").toUpperCase();
  const interval = String(intervalSelect.value || "15");
  const datafeed = new HyperliquidUdfConnector();
  setStatus(`Loading ${symbol} @ ${interval}...`);

  const WidgetCtor = window.TradingView!.widget;
  tvWidget = new WidgetCtor({
    symbol,
    interval,
    container: "tv_chart_container",
    library_path: "./assets/charting_library/",
    locale: "en",
    autosize: true,
    fullscreen: false,
    datafeed,
    theme: "dark",
    disabled_features: ["header_compare", "header_undo_redo"],
  });

  tvWidget.onChartReady(() => {
    setStatus(`Connected: ${symbol} @ ${interval}`);
  });
}

function boot(): void {
  if (loadChartButton) {
    loadChartButton.addEventListener("click", () => {
      try {
        buildWidget();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus(`Error: ${message}`);
        console.error(error);
      }
    });
  }

  try {
    buildWidget();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Error: ${message}`);
    console.error(error);
  }
}

boot();
