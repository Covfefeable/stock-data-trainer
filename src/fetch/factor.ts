import type { Page, Res } from ".";
import fetchData from ".";

export interface FactorQuery {
  pageNum: number;
  pageSize: number;
  name: string;
}

export interface Factor {
  id: number;
  name: string;
  desc: string;
  createTime: string;
  fn: string;
  echartsShowType: string
}

export const factorApi = {
  createFactor: async (payload: Omit<Factor, "id">): Promise<Res<Factor>> =>
    await fetchData("/api/v2/factor/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateFactor: async (payload: Factor): Promise<Res<Factor>> =>
    await fetchData("/api/v2/factor/update", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteFactor: async (payload: { id: number }): Promise<Res<number>> =>
    await fetchData("/api/v2/factor/delete", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getFactorList: async (payload: FactorQuery): Promise<Res<Page<Factor>>> =>
    await fetchData("/api/v2/factor/list", {
      method: "GET",
      params: payload,
    }),
};
