import fetchData, { type Page, type Res } from ".";
import type { StockIntervalType } from "./stock";

interface TaskQuery {
  name: string;
  startDate: string | null;
  endDate: string | null;
  pageNum: number;
  pageSize: number;
}

export interface Task {
  name: string;
  desc: string;
  ticker: string[];
  type: StockIntervalType;
  startDate: string;
  endDate: string;
  factors: number[],
  primaryTicker: string;
  primaryKey: string;
  reservedKeys: string[];
  model: string;
  stepNum: number;
  inputKeys: string[];
  outputKey: string;
  outputType: string;
  epochs: number;
  batchSize: number;
  finished: boolean;
}

export interface ModelFile {
  weightBinFile: string;
  modelJsonFile: string;
}

export const taskApi = {
  createTask: async (payload: Task): Promise<Res<Task>> =>
    await fetchData("/api/v2/task/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getTaskList: async (payload: TaskQuery): Promise<Res<Page<Task>>> =>
    await fetchData("/api/v2/task/list", {
      method: "GET",
      params: payload,
    }),
  delTask: async (payload: { id: number }): Promise<Res<void>> =>
    await fetchData("/api/v2/task/delete", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getTaskModel: async (payload: { name: string }): Promise<Res<ModelFile>> =>
    await fetchData("/api/v2/task/model/get", {
      method: "GET",
      params: payload,
    }),
};
