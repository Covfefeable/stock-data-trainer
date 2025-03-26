import * as tf from "@tensorflow/tfjs";
import type { Stock } from "../../../fetch/stock";
import { factorApi } from "../../../fetch/factor";

export class ClassicLstmModel {
  private model: tf.Sequential;

  constructor(shape: number[]) {
    this.model = tf.sequential();
    this.model.add(
      tf.layers.lstm({
        inputShape: shape,
        units: 64,
        activation: "sigmoid",
        kernelInitializer: "glorotNormal",
      })
    );
    this.model.add(tf.layers.dropout({ rate: 0.2 }));
    this.model.add(tf.layers.dense({ units: 2, activation: "softmax" }));
    this.model.compile({
      loss: "categoricalCrossentropy",
      optimizer: tf.train.adam(0.002),
      metrics: ["accuracy"],
    });
  }

  public getModel(): tf.Sequential {
    return this.model;
  }
}

export class ClassicDenseModel {
  private model: tf.Sequential;

  constructor(shape: number[]) {
    this.model = tf.sequential();
    this.model.add(
      tf.layers.dense({
        inputShape: shape,
        units: 64,
        activation: "sigmoid",
        kernelInitializer: "glorotNormal",
      })
    );
    this.model.add(
      tf.layers.dense({
        units: 32,
        activation: "relu",
      })
    );
    this.model.add(tf.layers.flatten());
    this.model.add(tf.layers.dropout({ rate: 0.2 }));
    this.model.add(tf.layers.dense({ units: 2, activation: "softmax" }));
    this.model.compile({
      loss: "categoricalCrossentropy",
      optimizer: tf.train.adam(0.002),
      metrics: ["accuracy"],
    });
  }

  public getModel(): tf.Sequential {
    return this.model;
  }
}

export class Base64ModelLoader {
  modelJson: string;
  weightsData: string;
  constructor(modelJson: string, weightsData: string) {
    this.modelJson = modelJson;
    this.weightsData = weightsData;
  }

  async load() {
    // 解码并解析模型JSON
    const modelJsonStr = atob(this.modelJson);
    const modelConfig = JSON.parse(modelJsonStr);

    // 解码权重数据
    const weightsDataBuffer = this._base64ToArrayBuffer(this.weightsData);

    // 创建权重数据
    const weightSpecs = modelConfig.weightsManifest[0].weights;
    // const tensorValues = this._loadWeights(weightsDataBuffer, weightSpecs);

    // 返回模型拓扑结构和权重
    return {
      modelTopology: modelConfig.modelTopology,
      weightSpecs: weightSpecs,
      weightData: weightsDataBuffer,
      kernelSpecs: modelConfig.kernelSpecs,
    };
  }

  // Base64 转 ArrayBuffer
  _base64ToArrayBuffer(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // 加载权重
  _loadWeights(weightsData: any, weightSpecs: any) {
    // const dataView = new DataView(weightsData);
    let offset = 0;
    const tensors = [];

    for (const spec of weightSpecs) {
      const { name, shape, dtype } = spec;
      const size = shape.reduce((a: number, b: number) => a * b, 1);
      let data;

      if (dtype === "float32") {
        data = new Float32Array(weightsData, offset, size);
        offset += size * 4;
      } else if (dtype === "int32") {
        data = new Int32Array(weightsData, offset, size);
        offset += size * 4;
      } else {
        throw new Error(`Unsupported dtype: ${dtype}`);
      }

      tensors.push({ name, data });
    }

    return tensors;
  }
}

export const addExtraFactors = async (factorIds: number[], data: Stock[]) => {
  if (!factorIds.length) {
    return data;
  } else {
    const res = await factorApi.getFactorList({
      pageNum: 1,
      pageSize: 9999,
      name: "",
    });
    if (res.code === 200) {
      const factorList = res.data.list;
      factorIds.forEach((factorId) => {
        const factor = factorList.find((item) => item.id === Number(factorId));
        if (factor) {
          const { fn } = factor;
          try {
            const factorConfig = eval(fn);
            data = factorConfig.manipulate(data);
          } catch (error) {
            console.error(
              `Error processing factor with id ${factorId}:`,
              error
            );
          }
        }
      });
    }
    return data;
  }
};

export const getExtraFactorKeys = async (data: Stock[]) => {
  if (!data.length) {
    return [];
  }
  const diffKeys = Object.keys(data[0]).filter((key) => key.includes("$f_"));

  return diffKeys;
};
