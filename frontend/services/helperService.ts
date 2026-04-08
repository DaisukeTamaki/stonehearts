import type { GoCoordinateType } from "~/types/goTypes";

class HelperService {
  private static instance: HelperService;
  static getInstance(): HelperService {
    if (!HelperService.instance) HelperService.instance = new HelperService();
    return HelperService.instance;
  }

  generateSGFCoordinate(x: number, y: number): string {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    return `${letters[x]}${letters[y]}`;
  }

  parseSGFCoordinate(coord: string): GoCoordinateType {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    return { x: letters.indexOf(coord[0]), y: letters.indexOf(coord[1]) };
  }

  formatWinrate(winrate: number): string {
    return `${(winrate * 100).toFixed(1)}%`;
  }

  formatScoreLead(scoreLead: number): string {
    const sign = scoreLead > 0 ? "+" : "";
    return `${sign}${scoreLead.toFixed(1)}`;
  }
}

export const helperService = HelperService.getInstance();
