import {
  Button,
  DatePicker,
  Form,
  FormItem,
  message,
  Row,
  Select,
} from "ant-design-vue";
import { computed, defineComponent, nextTick, onMounted, reactive, ref } from "vue";
import {
  stockApi,
  type Stock,
  type StockIntervalType,
} from "../../fetch/stock";
import dayjs, { Dayjs, type ManipulateType } from "dayjs";
import { datePickerPresets } from "../../utils";
import KChart from "./components/k-chart";
import { useUserStore } from "../../store/user-store";
import { factorApi, type Factor } from "../../fetch/factor";
import { addExtraFactors, getExtraFactorKeys } from "../train/utils/model";

export default defineComponent({
  setup() {
    const kChartRef = ref<InstanceType<typeof KChart>>()
    const userStore = useUserStore();
    const state = reactive({
      syncLoading: false,
      filter: {
        ticker: null as string | null,
        startDate: null as Dayjs | null,
        endDate: null as Dayjs | null,
        type: "daily",
      },
      factor: null as number | null,
      factorKeys: [] as string[],
      factorList: [] as Factor[],
      tickerList: [] as string[],
      stockData: [] as Stock[],
    });

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

    const query = async () => {
      const res = await stockApi.getStockData({
        ticker: [state.filter.ticker!],
        start_date: dayjs(state.filter.startDate).format("YYYY-MM-DD"),
        end_date: dayjs(state.filter.endDate).format("YYYY-MM-DD"),
        type: state.filter.type,
        extra: {
          sma: true,
          rsi: true,
          ema: true,
        },
      });
      if (res.code === 200) {
        state.stockData = await addExtraFactors([state.factor!], res.data);
        state.factorKeys = await getExtraFactorKeys(state.stockData);
        nextTick(() => {
          kChartRef.value?.reRenderAll()
        })
      }
    };

    const syncStock = async () => {
      state.syncLoading = true;
      const stockInterval = [
        { value: "daily", dayjsUnit: "day", amount: 7 },
        { value: "weekly", dayjsUnit: "week", amount: 2 },
        { value: "monthly", dayjsUnit: "month", amount: 2 },
        { value: "yearly", dayjsUnit: "year", amount: 2 },
      ];
      for (let i = 0; i < stockInterval.length; i++) {
        for (let j = 0; j < state.tickerList.length; j++) {
          await stockApi.syncStockData({
            ticker: state.tickerList[j],
            type: stockInterval[i].value as StockIntervalType,
            country_code: "USA",
            start_date: dayjs()
              .subtract(
                stockInterval[i].amount,
                stockInterval[i].dayjsUnit as ManipulateType
              )
              .format("YYYY-MM-DD"),
            end_date: dayjs().format("YYYY-MM-DD"),
          });
        }
      }
      state.syncLoading = false;
      message.success("同步成功");
      query();
    };

    const extraKeyShowType = computed(() => {
      return (
        state.factorList.find((item) => item.id === state.factor)
          ?.echartsShowType || null
      );
    });

    onMounted(async () => {
      await getFactorList();
      await getTickerList();
      state.filter.ticker = state.tickerList[0];
      state.filter.startDate = dayjs().subtract(1, "year");
      state.filter.endDate = dayjs();
      query();
    });

    return { state, userStore, extraKeyShowType, kChartRef, query, syncStock };
  },
  render() {
    const { state, userStore, extraKeyShowType, query, syncStock } = this;
    return (
      <div>
        <header>
          <Row justify="space-between">
            <Form layout="inline">
              <FormItem label="代码">
                <Select
                  placeholder="请选择代码"
                  v-model={[state.filter.ticker, "value"]}
                >
                  {state.tickerList.map((ticker) => (
                    <Select.Option value={ticker}>{ticker}</Select.Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem label="类型">
                <Select
                  v-model={[state.filter.type, "value"]}
                  placeholder="请选择类型"
                >
                  <Select.Option value="daily">日线</Select.Option>
                  <Select.Option value="weekly">周线</Select.Option>
                  <Select.Option value="monthly">月线</Select.Option>
                  <Select.Option value="yearly">年线</Select.Option>
                </Select>
              </FormItem>
              <FormItem label="自定义指标" name="factor">
                <Select
                  allowClear
                  placeholder="请选择自定义指标"
                  v-model={[state.factor, "value"]}
                >
                  {state.factorList.map((item) => (
                    <Select.Option value={item.id}>{item.name}</Select.Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem label="开始日期">
                <DatePicker
                  allowClear={false}
                  placeholder="请选择时间"
                  v-model={[state.filter.startDate, "value"]}
                  presets={datePickerPresets}
                />
              </FormItem>
              <FormItem label="结束日期">
                <DatePicker
                  allowClear={false}
                  placeholder="请选择时间"
                  v-model={[state.filter.endDate, "value"]}
                  disabledDate={(date) => {
                    // 不能选择未来时间
                    return date.valueOf() > Date.now();
                  }}
                />
              </FormItem>
              <FormItem>
                <Button type="primary" onClick={query}>
                  查询
                </Button>
              </FormItem>
            </Form>
            {userStore.isAdmin && (
              <Button disabled={state.syncLoading} onClick={syncStock}>
                同步数据
              </Button>
            )}
          </Row>
        </header>
        <main>
          <KChart
            ref="kChartRef"
            data={state.stockData}
            factorKeys={state.factorKeys}
            extraKeyShowType={extraKeyShowType}
          />
        </main>
      </div>
    );
  },
});
