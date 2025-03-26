import dayjs from "dayjs";
import { stockApi, type Stock } from "../../../fetch/stock";
import { taskApi, type Task } from "../../../fetch/task";
import * as tf from "@tensorflow/tfjs";
import {
  addExtraFactors,
  Base64ModelLoader,
  ClassicDenseModel,
  ClassicLstmModel,
} from "./model";

const formatData = (config: Task, data: Stock[]) => {
  let stockData = [] as any[];
  const tickers: Set<string> = new Set();
  data.forEach((item) => {
    tickers.add(item.ticker);
  });
  const uniqueTickers = Array.from(tickers);

  stockData = data.map((item) => {
    const newItem: any = {};
    Object.keys(item).forEach((key) => {
      newItem[`${item.ticker}_${key}`] = item[key as keyof typeof item];
    });
    return newItem;
  });

  const primaryList = stockData.filter((item) => {
    const tickerKey = Object.keys(item).find((key) =>
      key.includes("_ticker")
    ) as keyof typeof item;
    return item[tickerKey] === config.primaryTicker;
  });

  // 合并数据
  primaryList.forEach((primaryItem, index) => {
    const generalPrimaryKey = config.primaryKey.split("_")?.[1];
    const primaryKeyValue = primaryItem[config.primaryKey];
    uniqueTickers
      .filter((item) => item !== config.primaryTicker)
      .forEach((el) => {
        const sameDateData = stockData.find(
          (item) => item[`${el}_${generalPrimaryKey}`] === primaryKeyValue
        );
        primaryList[index] = {
          ...primaryItem,
          ...sameDateData,
        };
      });
  });

  const finalList = primaryList.map((primaryItem) => {
    const keys = Object.keys(primaryItem);
    keys.forEach((item) => {
      if (!config.reservedKeys.includes(item)) {
        delete primaryItem[item];
      }
    });

    // 缺失的数据补0
    Object.keys(primaryItem).forEach((item) => {
      primaryItem[item] === undefined && (primaryItem[item] = 0);
    });
    return primaryItem;
  });

  return finalList;
};

const generateData = async (config: Task) => {
  const res = await stockApi.getStockData({
    ticker: config.ticker!,
    start_date: dayjs(config.startDate).format("YYYY-MM-DD"),
    end_date: dayjs(config.endDate).format("YYYY-MM-DD"),
    type: config.type!,
    extra: {
      sma: true,
      rsi: true,
      ema: true,
    },
  });
  if (res.code === 200) {
    const data = await addExtraFactors(config.factors, res.data)
    return formatData(config, data);
  }
};

const startTrain = async (config: Task, data: any[]) => {
  const {
    model,
    stepNum,
    inputKeys,
    outputKey,
    outputType,
    epochs,
    batchSize,
  } = config;
  const dataWithOutputkey: any[] = JSON.parse(JSON.stringify(data));
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (!inputKeys.includes(key)) {
        delete item[key];
      }
    });
  });
  dataWithOutputkey.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (!inputKeys.includes(key) && key !== outputKey) {
        delete item[key];
      }
    });
  });
  let input = [] as number[][][];
  let output = [] as number[][];
  if (model === "classic_lstm") {
    for (let i = 0; i < data.length - stepNum; i++) {
      const inputData = data
        .slice(i, i + stepNum)
        .map((item) => Object.values(item).map(Number));
      input.push(inputData);

      if (outputType === "probabilityTrendPredict") {
        genPbOutput(i, dataWithOutputkey, stepNum, outputKey, output);
      }
    }
    input = normalizeMultiDimArray(input);
    console.log(input, output);

    const inputTensor = tf.tensor3d(input);
    const outputTensor = tf.tensor(output);
    const tfModel = new ClassicLstmModel([
      input[0].length,
      input[0][0].length,
    ]).getModel();
    await trainAndSave(
      tfModel,
      inputTensor,
      outputTensor,
      epochs,
      batchSize,
      config
    );
  }

  if (model === "classic_dense") {
    for (let i = 0; i < data.length - stepNum; i++) {
      const inputData = data
        .slice(i, i + stepNum)
        .map((item) => Object.values(item).map(Number));
      input.push(inputData);

      if (outputType === "probabilityTrendPredict") {
        genPbOutput(i, dataWithOutputkey, stepNum, outputKey, output);
      }
    }
    input = normalizeMultiDimArray(input);
    console.log(input, output);

    const inputTensor = tf.tensor3d(input);
    const outputTensor = tf.tensor(output);
    const tfModel = new ClassicDenseModel([
      input[0].length,
      input[0][0].length,
    ]).getModel();
    await trainAndSave(
      tfModel,
      inputTensor,
      outputTensor,
      epochs,
      batchSize,
      config
    );
  }
};

const startPredict = async (config: Task, data: any[]) => {
  const { model, stepNum, inputKeys, outputType, outputKey } = config;
  const dataWithOutputkey: any[] = JSON.parse(JSON.stringify(data));
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (!inputKeys.includes(key)) {
        delete item[key];
      }
    });
  });
  dataWithOutputkey.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (!inputKeys.includes(key) && key !== outputKey) {
        delete item[key];
      }
    });
  });
  let input = [] as number[][][];
  let output = [] as number[][];

  if (model === "classic_lstm") {
    for (let i = 0; i < data.length - stepNum; i++) {
      const inputData = data
        .slice(i, i + stepNum)
        .map((item) => Object.values(item).map(Number));
      input.push(inputData);

      if (outputType === "probabilityTrendPredict") {
        genPbOutput(i, dataWithOutputkey, stepNum, outputKey, output);
      }
    }
    if (data.length === stepNum) {
      input.push(data.map((item) => Object.values(item).map(Number)));
    }
    input = normalizeMultiDimArray(input);

    const modelRes = await taskApi.getTaskModel({
      name: config.name,
    });
    if (modelRes.code === 200) {
      const modelLoader = new Base64ModelLoader(
        modelRes.data.modelJsonFile,
        modelRes.data.weightBinFile
      );

      const tfModel = await tf.loadLayersModel(modelLoader);

      const compareResult = {
        real: output,
        predict: [] as number[][],
      };
      input.forEach((item) => {
        const inputTensor = tf.tensor3d([item]);
        const output = tfModel.predict(inputTensor) as tf.Tensor<tf.Rank>;
        const outputArray = output.arraySync();
        compareResult.predict.push((outputArray as number[][])[0]);
      });
      return compareResult;
    }
  }

  if (model === "classic_dense") {
    for (let i = 0; i < data.length - stepNum; i++) {
      const inputData = data
        .slice(i, i + stepNum)
        .map((item) => Object.values(item).map(Number));
      input.push(inputData);

      if (outputType === "probabilityTrendPredict") {
        genPbOutput(i, dataWithOutputkey, stepNum, outputKey, output);
      }
    }
    if (data.length === stepNum) {
      input.push(data.map((item) => Object.values(item).map(Number)));
    }
    input = normalizeMultiDimArray(input);

    const modelRes = await taskApi.getTaskModel({
      name: config.name,
    });
    if (modelRes.code === 200) {
      const modelLoader = new Base64ModelLoader(
        modelRes.data.modelJsonFile,
        modelRes.data.weightBinFile
      );

      const tfModel = await tf.loadLayersModel(modelLoader);

      const compareResult = {
        real: output,
        predict: [] as number[][],
      };
      input.forEach((item) => {
        const inputTensor = tf.tensor3d([item]);
        const output = tfModel.predict(inputTensor) as tf.Tensor<tf.Rank>;
        const outputArray = output.arraySync();
        compareResult.predict.push((outputArray as number[][])[0]);
      });
      return compareResult;
    }
  }
};

const backTesting = async (config: Task, range: string[]) => {
  const res = await stockApi.getStockData({
    ticker: config.ticker!,
    start_date: range[0],
    end_date: range[1],
    type: config.type!,
    extra: {
      sma: true,
      rsi: true,
      ema: true,
    },
  });
  if (res.code === 200) {
    if (res.data.length < config.stepNum + 1) {
      console.error("时间段不能小于步长");
      return;
    }
    const data = await addExtraFactors(config.factors, res.data)
    const formattedData = formatData(config, data);
    const compareResult = await startPredict(config, formattedData);
    return compareResult;
  }
};

onmessage = async (config: MessageEvent<string>) => {
  const task = JSON.parse(config.data);
  if (task.type === "generateData") {
    const data = await generateData(task.data);
    postMessage(
      JSON.stringify({
        type: "generateDataOk",
        data,
      })
    );
  }
  if (task.type === "startTrain") {
    await startTrain(task.config, task.data);
    postMessage(
      JSON.stringify({
        type: "trainOk",
      })
    );
  }
  if (task.type === "backTesting") {
    const result = await backTesting(task.config, task.range);
    postMessage(
      JSON.stringify({
        type: "backTestingOk",
        data: result,
      })
    );
  }
  if (task.type === "predictCurrent") {
    const data = formatData(task.config, task.data);
    const result = await startPredict(task.config, data);
    postMessage(
      JSON.stringify({
        type: "predictCurrentOk",
        data: result,
      })
    );
  }
};

const normalizeMultiDimArray = (arr: number[][][]) => {
  // 找出第三维度每个index的最小值和最大值
  const minVals = Array(arr[0][0].length).fill(Infinity);
  const maxVals = Array(arr[0][0].length).fill(-Infinity);

  // 遍历多维数组，找到每个index的最小值和最大值
  arr.forEach((subArr) => {
    subArr.forEach((innerArr: number[]) => {
      innerArr.forEach((val, index) => {
        minVals[index] = Math.min(minVals[index], val);
        maxVals[index] = Math.max(maxVals[index], val);
      });
    });
  });

  // 对数组进行归一化
  function normalize(subArr: number[][]): any {
    return subArr.map((innerArr) =>
      innerArr.map(
        (val: number, index: number) =>
          (val - minVals[index]) / (maxVals[index] - minVals[index])
      )
    );
  }

  return arr.map(normalize);
};

const genPbOutput = (
  // 生成概率分类输出的output
  i: number,
  data: any[],
  stepNum: number,
  outputKey: string,
  output: number[][]
) => {
  const nowData = JSON.parse(JSON.stringify(data[i + stepNum - 1]));
  const nextData = JSON.parse(JSON.stringify(data[i + stepNum]));
  const nowValue = Number(nowData[outputKey]);
  const nextValue = Number(nextData[outputKey]);
  if (nowValue > nextValue) {
    output.push([1, 0]);
  } else if (nowValue <= nextValue) {
    output.push([0, 1]);
  }
};

const trainAndSave = async (
  tfModel: tf.Sequential,
  inputTensor: tf.Tensor,
  outputTensor: tf.Tensor,
  epochs: number,
  batchSize: number,
  config: Task
) => {
  tfModel.summary();
  await tfModel.fit(inputTensor, outputTensor, {
    epochs,
    batchSize,
    shuffle: true,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        postMessage(
          JSON.stringify({
            type: "updateProgress",
            data: {
              epoch,
              logs,
            },
          })
        );
      },
    },
  });

  await tfModel.save(
    `${import.meta.env.VITE_API_BASE_URL}/api/v2/task/model/save?name=${
      config.name
    }`
  );
};
