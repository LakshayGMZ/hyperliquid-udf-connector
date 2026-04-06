import type { ResolutionString } from "./types";

export function convertTvResolutionToMs(resolution: ResolutionString): number {
  if (resolution.endsWith("S")) {
    return Number.parseInt(resolution.slice(0, -1), 10) * 1000;
  }
  if (resolution.endsWith("D")) {
    return Number.parseInt(resolution.slice(0, -1), 10) * 24 * 60 * 60 * 1000;
  }
  if (resolution.endsWith("W")) {
    return Number.parseInt(resolution.slice(0, -1), 10) * 7 * 24 * 60 * 60 * 1000;
  }
  if (resolution.endsWith("M")) {
    return Number.parseInt(resolution.slice(0, -1), 10) * 30 * 24 * 60 * 60 * 1000;
  }
  return Number.parseInt(resolution, 10) * 60 * 1000;
}

export function convertTvResolutionToHlInterval(resolution: ResolutionString): string {
  switch (resolution) {
    case "1":
      return "1m";
    case "3":
      return "3m";
    case "5":
      return "5m";
    case "15":
      return "15m";
    case "30":
      return "30m";
    case "60":
      return "1h";
    case "120":
      return "2h";
    case "240":
      return "4h";
    case "480":
      return "8h";
    case "720":
      return "12h";
    case "1D":
      return "1d";
    case "3D":
      return "3d";
    case "1W":
      return "1w";
    case "1M":
      return "1M";
    default:
      throw new Error(`Unsupported resolution: ${resolution}`);
  }
}

export const DEFAULT_SUPPORTED_RESOLUTIONS: ResolutionString[] = [
  "1",
  "3",
  "5",
  "15",
  "30",
  "60",
  "120",
  "240",
  "480",
  "720",
  "1D",
  "3D",
  "1W",
  "1M",
];
