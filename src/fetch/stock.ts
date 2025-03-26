import fetchData, { type Res } from ".";

export type StockIntervalType = "daily" | "weekly" | "monthly" | "yearly";

export interface ExtraInd {
  sma: boolean;
  rsi: boolean;
  ema: boolean;
}

interface StockQuery {
  ticker: string[];
  type: string;
  start_date: string;
  end_date: string;
  extra?: ExtraInd;
}

interface SyncQuery {
  type: StockIntervalType;
  ticker: string;
  country_code: string;
  start_date: string;
  end_date: string;
}

export interface Stock {
  close: number;
  date: string;
  high: number;
  id: number;
  low: number;
  open: number;
  ticker: string;
  type: StockIntervalType;
  volume: number;
  [key: `rsi${number}`]: number;
  [key: `sma${number}`]: number;
  [key: `ema${number}`]: number;
}

export const stockApi = {
  getTickerList: async (): Promise<Res<string[]>> =>
    await fetchData("/api/v2/ticker/list", {
      method: "GET",
    }),
  syncStockData: async (payload: SyncQuery): Promise<any> =>
    await fetchData("/api/v2/history/save", {
      method: "GET",
      params: payload,
    }),
  getStockData: async (payload: StockQuery): Promise<Res<Stock[]>> =>
    await fetchData("/api/v2/history/get", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
