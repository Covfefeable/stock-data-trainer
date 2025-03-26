import { computed, defineComponent, reactive, ref } from "vue";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  RadioGroup,
  Row,
  Select,
  Space,
  Textarea,
  Tooltip,
} from "ant-design-vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import { stockApi } from "../../../fetch/stock";
import { datePickerPresets } from "../../../utils";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { taskApi, type Task } from "../../../fetch/task";
import { factorApi, type Factor } from "../../../fetch/factor";
import { addExtraFactors } from "../utils/model";

enum ShowMode {
  Add,
  Copy,
}

const TITLEMAP = {
  [ShowMode.Add]: "创建任务",
  [ShowMode.Copy]: "复制任务",
};

export default defineComponent({
  emits: ["update"],
  setup(_props, { emit }) {
    const state = reactive({
      showMode: ShowMode.Add,
      confirmLoading: false,
      open: false,
      tickerList: [] as string[],
      factorList: [] as Factor[],
      stockData: [] as any[],
      form: {
        name: "",
        desc: "",
        ticker: [] as string[],
        type: null as string | null,
        startDate: null as Dayjs | null,
        endDate: null as Dayjs | null,
        factors: [] as number[],

        primaryTicker: null as string | null,
        primaryKey: null as string | null,
        reservedKeys: [] as string[],

        model: null as string | null,
        stepNum: 7,
        inputKeys: [] as string[],
        outputKey: null as null | string,
        outputType: null as string | null,

        epochs: 50,
        batchSize: 100,
      },
    });

    const formRef = ref();
    const formRules = {
      name: [{ required: true, message: "请输入任务名称" }],
      ticker: [{ required: true, message: "请选择代码" }],
      type: [{ required: true, message: "请选择类型" }],
      startDate: [{ required: true, message: "请选择开始时间" }],
      endDate: [{ required: true, message: "请选择结束时间" }],
      primaryTicker: [{ required: true, message: "请选择主代码" }],
      primaryKey: [{ required: true, message: "请选择主字段" }],
      reservedKeys: [{ required: true, message: "请选择保留字段" }],
      model: [{ required: true, message: "请选择模型" }],
      stepNum: [{ required: true, message: "请输入时间步长" }],
      inputKeys: [{ required: true, message: "请选择输入特征" }],
      outputKey: [{ required: true, message: "请选择输出特征" }],
      outputType: [{ required: true, message: "请选择输出形式" }],
      epochs: [{ required: true, message: "请输入训练论述" }],
      batchSize: [{ required: true, message: "请输入批次大小" }],
    };

    const add = () => {
      state.showMode = ShowMode.Add;
      state.open = true;
      getTickerList();
      getFactorList();
    };

    const copy = async (task: Task) => {
      state.showMode = ShowMode.Copy;
      state.open = true;
      getTickerList();
      getFactorList();
      state.form = {
        ...task,
        factors: task.factors.map(Number),
        startDate: dayjs(task.startDate),
        endDate: dayjs(task.endDate),
      };

      const res = await stockApi.getStockData({
        ticker: state.form.ticker!,
        start_date: dayjs(state.form.startDate).format("YYYY-MM-DD"),
        end_date: dayjs(state.form.endDate).format("YYYY-MM-DD"),
        type: state.form.type!,
        extra: {
          sma: true,
          rsi: true,
          ema: true,
        },
      });
      if (res.code === 200) {
        state.stockData = await addExtraFactors(state.form.factors, res.data);
        state.stockData = state.stockData.map((item) => {
          const newItem: any = {};
          Object.keys(item).forEach((key) => {
            newItem[`${item.ticker}_${key}`] = item[key];
          });
          return newItem;
        });
      }
    };

    const onOk = () => {
      formRef.value.validateFields().then(() => {
        state.confirmLoading = true;
        const data = JSON.parse(JSON.stringify(state.form));
        data.startDate = dayjs(data.startDate).format("YYYY-MM-DD");
        data.endDate = dayjs(data.endDate).format("YYYY-MM-DD");
        data.factors = data.factors.length ? data.factors : null
        taskApi
          .createTask(data)
          .then((res) => {
            if (res.code === 200) {
              onClose();
            }
          })
          .finally(() => {
            state.confirmLoading = false;
            emit("update");
          });
      });
    };

    const onClose = () => {
      formRef.value.clearValidate();
      state.open = false;
      state.confirmLoading = false;
      state.stockData = [];
      state.form = {
        name: "",
        desc: "",
        ticker: [],
        type: null,
        startDate: null,
        endDate: null,
        factors: [],
        primaryTicker: null,
        primaryKey: null,
        reservedKeys: [],
        model: null,
        stepNum: 7,
        inputKeys: [],
        outputKey: null,
        outputType: null,
        epochs: 50,
        batchSize: 100,
      };
    };

    const getTickerList = async () => {
      const res = await stockApi.getTickerList();
      if (res.code === 200) {
        state.tickerList = res.data;
      }
    };

    const getFactorList = async () => {
      const res = await factorApi.getFactorList({
        pageNum: 1,
        pageSize: 9999,
        name: "",
      });
      if (res.code === 200) {
        state.factorList = res.data.list;
      }
    };

    const getTrainData = async () => {
      if (
        state.form.startDate &&
        state.form.endDate &&
        state.form.ticker?.length &&
        state.form.type
      ) {
        const payload = {
          ticker: state.form.ticker!,
          start_date: dayjs(state.form.startDate).format("YYYY-MM-DD"),
          end_date: dayjs(state.form.endDate).format("YYYY-MM-DD"),
          type: state.form.type!,
          extra: {
            sma: true,
            rsi: true,
            ema: true,
          },
        };
        const res = await stockApi.getStockData(payload);
        if (res.code === 200) {
          state.stockData = await addExtraFactors(state.form.factors, res.data);
          state.stockData = state.stockData.map((item) => {
            const newItem: any = {};
            Object.keys(item).forEach((key) => {
              newItem[`${item.ticker}_${key}`] = item[key];
            });
            return newItem;
          });

          state.form.primaryTicker = null;
          state.form.primaryKey = null;
          state.form.reservedKeys = [];
          state.form.inputKeys = [];
        }
      }
    };

    const viewSlots = {
      extra: () => <CloseOutlined onClick={onClose} />,
      footer: () => (
        <Row justify="end">
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              loading={state.confirmLoading}
              onClick={onOk}
            >
              确定
            </Button>
          </Space>
        </Row>
      ),
    };

    const uniqueStockKeys = computed(() => {
      const keys: Set<string> = new Set();
      state.stockData.forEach((item) => {
        Object.keys(item).forEach((key) => {
          keys.add(key);
        });
      });
      return Array.from(keys);
    });

    return {
      state,
      viewSlots,
      formRef,
      formRules,
      uniqueStockKeys,
      getTrainData,
      add,
      copy,
      onClose,
      onOk,
    };
  },
  render() {
    const {
      state,
      viewSlots,
      formRules,
      uniqueStockKeys,
      getTrainData,
      onClose,
    } = this;
    return (
      <Drawer
        visible={state.open}
        title={TITLEMAP[state.showMode]}
        width={700}
        onClose={onClose}
        closeIcon={null}
        v-slots={viewSlots}
      >
        <Form
          ref="formRef"
          model={state.form}
          labelCol={{ span: 4 }}
          rules={formRules}
        >
          <Form.Item label="任务名称" name="name">
            <Input
              v-model={[state.form.name, "value"]}
              placeholder="请输入任务名称"
              maxlength={64}
            />
          </Form.Item>
          <Form.Item label="任务描述" name="desc">
            <Textarea
              v-model={[state.form.desc, "value"]}
              placeholder="请输入任务描述"
            />
          </Form.Item>
          <Form.Item label="代码" name="ticker">
            <Select
              mode="multiple"
              placeholder="请选择代码"
              v-model={[state.form.ticker, "value"]}
              onChange={getTrainData}
            >
              {state.tickerList.map((ticker) => (
                <Select.Option value={ticker}>{ticker}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="类型" name="type">
            <Select
              v-model={[state.form.type, "value"]}
              placeholder="请选择类型"
              onChange={getTrainData}
            >
              <Select.Option value="daily">日线</Select.Option>
              <Select.Option value="weekly">周线</Select.Option>
              <Select.Option value="monthly">月线</Select.Option>
              <Select.Option value="yearly">年线</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="开始时间" name="startDate">
            <DatePicker
              allowClear={false}
              placeholder="请选择时间"
              v-model={[state.form.startDate, "value"]}
              presets={datePickerPresets}
              onChange={getTrainData}
            />
          </Form.Item>
          <Form.Item label="结束时间" name="endDate">
            <DatePicker
              allowClear={false}
              placeholder="请选择时间"
              v-model={[state.form.endDate, "value"]}
              onChange={getTrainData}
              disabledDate={(date) => {
                // 不能选择未来时间
                return date.valueOf() > Date.now();
              }}
            />
          </Form.Item>
          <Form.Item label="自定义指标" name="factors">
            <Select
              mode="multiple"
              placeholder="请选择自定义指标"
              v-model={[state.form.factors, "value"]}
              onChange={getTrainData}
            >
              {state.factorList.map((item) => (
                <Select.Option value={item.id}>{item.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {!!state.stockData.length && (
            <>
              <Divider>数据处理</Divider>
              <Form.Item label="主代码" name="primaryTicker">
                <Select
                  v-model={[state.form.primaryTicker, "value"]}
                  placeholder="请选择主代码，数据将以此代码过滤和补全"
                >
                  {state.form.ticker.map((item) => (
                    <Select.Option value={item}>{item}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="唯一键"
                name="primaryKey"
                tooltip="一般为主代码的日期字段"
              >
                <Select
                  v-model={[state.form.primaryKey, "value"]}
                  placeholder="请选择唯一键，数据将以此字段过滤和补全"
                  onChange={() => {
                    if (
                      !state.form.reservedKeys.includes(state.form.primaryKey!)
                    ) {
                      state.form.reservedKeys.push(state.form.primaryKey!);
                    }
                  }}
                >
                  {uniqueStockKeys
                    .filter((item) =>
                      item.startsWith(state.form.primaryTicker!)
                    )
                    .map((item) => (
                      <Select.Option value={item}>{item}</Select.Option>
                    ))}
                </Select>
              </Form.Item>
              <Form.Item label="保留字段" name="reservedKeys">
                <CheckboxGroup v-model={[state.form.reservedKeys, "value"]}>
                  {uniqueStockKeys.map((item) => (
                    <Checkbox
                      value={item}
                      disabled={item === state.form.primaryKey}
                    >
                      {item}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </Form.Item>
              <Form.Item label=" " colon={false}>
                <p>
                  共获取{state.stockData.length}条数据，预计生成
                  {
                    state.stockData.filter((item) =>
                      Object.keys(item).includes(state.form.primaryKey!)
                    ).length
                  }
                  条样本数据
                </p>
              </Form.Item>
            </>
          )}
          {!!state.form.reservedKeys.length && (
            <>
              <Divider>模型设计</Divider>
              <Form.Item label="模型" name="model">
                <Select
                  v-model={[state.form.model, "value"]}
                  placeholder="请选择模型"
                >
                  <Select.Option value="classic_lstm">
                    classic LSTM
                  </Select.Option>
                  <Select.Option value="classic_dense">
                    classic Dense
                  </Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="时间步长" name="stepNum">
                <InputNumber v-model={[state.form.stepNum, "value"]} />
              </Form.Item>
              <Form.Item label="输入特征" name="inputKeys">
                <CheckboxGroup v-model={[state.form.inputKeys, "value"]}>
                  {state.form.reservedKeys.map((item) => (
                    <Checkbox value={item}>{item}</Checkbox>
                  ))}
                </CheckboxGroup>
              </Form.Item>
              <Form.Item label="输出特征" name="outputKey">
                <RadioGroup v-model={[state.form.outputKey, "value"]}>
                  {state.form.reservedKeys.map((item) => (
                    <Radio value={item}>{item}</Radio>
                  ))}
                </RadioGroup>
              </Form.Item>
              <Form.Item label="输出形式" name="outputType">
                <Select
                  v-model={[state.form.outputType, "value"]}
                  placeholder="请选择输出形式"
                >
                  <Select.Option value="singlePricePredict" disabled>
                    <Tooltip title="模型输出一个标量值，代表预测的未来某一时刻的股票价格，比如预测下一个交易日的收盘价。">
                      价格预测 - 单步
                    </Tooltip>
                  </Select.Option>
                  <Select.Option value="multiplePricePredict" disabled>
                    <Tooltip title="模型输出一个向量，向量中的每个元素对应未来不同时间步的预测价格。例如，预测未来 5 个交易日的收盘价，输出可能是 [121.2, 122.5, 123.1, 124.0, 125.3]。">
                      价格预测 - 多步
                    </Tooltip>
                  </Select.Option>
                  <Select.Option value="probabilityTrendPredict">
                    <Tooltip title="模型输出一个概率向量，向量的每个元素表示股票价格处于不同趋势类别的概率。例如，输出 [0.3, 0.7]，分别对应下跌、上涨的概率。">
                      趋势预测 - 概率
                    </Tooltip>
                  </Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="训练轮数" name="epochs">
                <Input
                  placeholder="请输入训练轮数"
                  v-model={[state.form.epochs, "value"]}
                />
              </Form.Item>
              <Form.Item label="批次大小" name="batchSize">
                <Input
                  placeholder="请输入批次大小"
                  v-model={[state.form.batchSize, "value"]}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Drawer>
    );
  },
});
