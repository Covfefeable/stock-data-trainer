import { defineStore } from "pinia";
import type { Task } from "../fetch/task";
import * as tf from "@tensorflow/tfjs";

interface TrainTask {
  progress: string;
  finished: boolean;
  epochLogs: Array<{ epoch: number; logs: tf.Logs }>;
  config: Task;
}

export const useProgressStore = defineStore("progress", {
  state: () => ({
    trainTaskList: [] as TrainTask[],
  }),
  getters: {
    ongoingTask(state): TrainTask | undefined {
      return state.trainTaskList.find(task => !task.finished);
    }
  },
  actions: {
    async updateProgress(task: Task, data: { epoch: number; logs: tf.Logs }) {
      const { name } = task;
      const currentTask = this.trainTaskList.find(
        (item) => item.config.name === name
      );
      if (!currentTask) {
        this.trainTaskList.push({
          progress: ((data.epoch + 1) / (task.epochs) * 100).toFixed(2),
          finished: false,
          epochLogs: [
            {
              epoch: data.epoch,
              logs: data.logs,
            },
          ],
          config: task,
        });
      } else {
        currentTask.progress = ((data.epoch + 1) / (task.epochs) * 100).toFixed(2)
        currentTask.finished = data.epoch === task.epochs - 1
        currentTask.epochLogs[data.epoch] = data
      }
    },
  },
});
