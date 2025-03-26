import {
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  type PropType,
  reactive,
} from "vue";
import * as echarts from "echarts";
import type { Task } from "../../../fetch/task";
import { stockApi } from "../../../fetch/stock";

export default defineComponent({
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true,
    },
    range: {
      type: Array as PropType<Array<string>>,
      required: true,
    },
    compare: {
      type: Object as PropType<{
        real: number[][];
        predict: number[][];
      } | null>,
      required: true,
    },
  },
  setup(props) {
    const profitChart = ref(null);
    let profitChartInstance = null as echarts.ECharts | null;
    const state = reactive({
      data: [] as any[],
    });

    const initProfitChart = () => {
      if (profitChart.value) {
        profitChartInstance =
          echarts.getInstanceByDom(profitChart.value) ||
          echarts.init(profitChart.value);
        const option = {
          grid: {
            top: "10%",
            left: "8%",
            right: "0%",
            bottom: "20%",
          },
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "cross",
            },
          },
          xAxis: {
            type: "category",
            data: state.data.map((item) => item.date),
            boundaryGap: false,
            axisLine: { onZero: false },
            splitLine: { show: false },
            min: "dataMin",
            max: "dataMax",
          },
          yAxis: {
            scale: true,
            splitArea: {
              show: true,
            },
          },
          series: [
            {
              name: "Max",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: state.data.map((item) => item.maxProfit),
              lineStyle: {
                opacity: 0.2,
              },
            },
            {
              name: "Predict",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: state.data.map((item) => item.predictProfit),
            },
            {
              name: "AlwaysBuy",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: state.data.map((item) => item.alwaysBuyProfit),
              lineStyle: {
                opacity: 0.2,
              },
            },
          ],
        };
        profitChartInstance.setOption(option);
      }
    };

    const resizeChart = () => {
      profitChartInstance && profitChartInstance.resize();
    };

    const getDataAndCalcProfit = async () => {
      const res = await stockApi.getStockData({
        ticker: props.task.ticker,
        start_date: props.range[0],
        end_date: props.range[1],
        type: props.task.type,
        extra: {
          sma: true,
          rsi: true,
          ema: true,
        },
      });
      if (res.code === 200) {
        state.data = res.data.slice(props.task.stepNum);
        let alwaysBuySum = 10000;
        let predictSum = 10000;
        let maxSum = 10000;
        state.data.forEach((item, index) => {
          const change =
            (item.close - (state.data[index - 1]?.close || item.open)) /
            (state.data[index - 1]?.close || item.open);
          if (props.compare) {
            alwaysBuySum = alwaysBuySum + change * alwaysBuySum;
            item.alwaysBuyProfit = alwaysBuySum;

            if (
              props.compare.predict[index][1] > props.compare.predict[index][0]
            ) {
              predictSum += change * predictSum;
            }
            item.predictProfit = predictSum;
            if (props.compare.real[index][1] > props.compare.real[index][0]) {
              maxSum += change * maxSum;
            }
            item.maxProfit = maxSum;
          }
        });
      }
    };

    onMounted(async () => {
      await getDataAndCalcProfit();
      initProfitChart();
      window.addEventListener("resize", resizeChart);
    });

    onBeforeUnmount(() => {
      profitChartInstance && profitChartInstance.dispose();
      window.removeEventListener("resize", resizeChart);
    });

    return {
      profitChart,
    };
  },
  render() {
    return (
      <div>
        <div ref="profitChart" style="width: 100%; height: 100px;" />
      </div>
    );
  },
});
