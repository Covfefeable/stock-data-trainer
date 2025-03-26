import {
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  type PropType,
} from "vue";
import * as echarts from "echarts";
import type { Stock } from "../../../fetch/stock";

export default defineComponent({
  props: {
    factorKeys: {
      type: Array as PropType<string[]>,
      required: true,
    },
    extraKeyShowType: {
      type: String as PropType<string | null>,
    },
    data: {
      type: Array as PropType<Stock[]>,
      required: true,
    },
  },
  setup(props) {
    const kChart = ref(null);
    const rsiChart = ref(null);
    let kChartInstance = null as echarts.ECharts | null;
    let RsiChartInstanse = null as echarts.ECharts | null;

    const initKChart = () => {
      if (kChart.value) {
        kChartInstance =
          echarts.getInstanceByDom(kChart.value) || echarts.init(kChart.value);
        const option = {
          grid: {
            top: "10%",
            left: "5%",
            right: "5%",
            bottom: "15%",
          },
          dataZoom: [
            {
              type: "inside",
              start: 0,
              end: 100,
            },
            {
              show: true,
              type: "slider",
              top: "90%",
              start: 0,
              end: 100,
            },
          ],
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "cross",
            },
          },
          xAxis: {
            type: "category",
            data: props.data.map((item) => item.date),
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
          legend: {
            data: [
              "K线",
              "SMA5",
              "SMA20",
              "SMA30",
              ...props.factorKeys.filter(
                () => props.extraKeyShowType === "line"
              ),
            ],
          },
          series: [
            {
              name: "K线",
              type: "candlestick",
              data: props.data.map((item) => [
                item.open,
                item.close,
                item.low,
                item.high,
              ]),
            },
            {
              name: "SMA5",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: props.data.map((item) => item.sma5),
            },
            {
              name: "SMA20",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: props.data.map((item) => item.sma20),
            },
            {
              name: "SMA30",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: props.data.map((item) => item.sma30),
            },
            ...props.factorKeys
              .filter(() => props.extraKeyShowType === "line")
              .map((key) => {
                return {
                  name: key,
                  type: "line",
                  showSymbol: false,
                  data: props.data.map(
                    (item) => item[key as keyof typeof item]
                  ),
                };
              }),
          ],
        };
        kChartInstance.setOption(option, { notMerge: true });
      }
    };

    const initRsiChart = () => {
      if (rsiChart.value) {
        RsiChartInstanse =
          echarts.getInstanceByDom(rsiChart.value) ||
          echarts.init(rsiChart.value);
        const option = {
          grid: {
            top: "0%",
            left: "5%",
            right: "5%",
            bottom: "30%",
          },
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "cross",
            },
          },
          xAxis: {
            show: false,
            type: "category",
            data: props.data.map((item) => item.date),
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
          legend: {
            data: [
              "RSI6",
              "RSI12",
              "RSI24",
              ...props.factorKeys.filter(
                () => props.extraKeyShowType === "bar"
              ),
            ],
            x: "center",
            y: "bottom",
          },
          series: [
            {
              name: "RSI6",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: props.data.map((item) => item.rsi6),
            },
            {
              name: "RSI12",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: props.data.map((item) => item.rsi12),
            },
            {
              name: "RSI24",
              type: "line",
              smooth: true,
              showSymbol: false,
              data: props.data.map((item) => item.rsi24),
            },
            ...props.factorKeys
              .filter(() => props.extraKeyShowType === "bar")
              .map((key) => {
                return {
                  name: key,
                  type: "bar",
                  showSymbol: false,
                  data: props.data.map(
                    (item) => item[key as keyof typeof item]
                  ),
                };
              }),
          ],
        };
        RsiChartInstanse.setOption(option, { notMerge: true });
      }
    };

    const resizeChart = () => {
      kChartInstance && kChartInstance.resize();
      RsiChartInstanse && RsiChartInstanse.resize();
    };

    const combineCharts = () => {
      echarts.connect([kChartInstance!, RsiChartInstanse!]);
    };

    const reRenderAll = () => {
      kChartInstance && initKChart();
      RsiChartInstanse && initRsiChart();
      combineCharts();
    }

    onMounted(() => {
      initKChart();
      initRsiChart();
      combineCharts();
      window.addEventListener("resize", resizeChart);
    });

    onBeforeUnmount(() => {
      kChartInstance && kChartInstance.dispose();
      RsiChartInstanse && RsiChartInstanse.dispose();
      window.removeEventListener("resize", resizeChart);
    });

    return {
      kChart,
      rsiChart,
      reRenderAll,
    };
  },
  render() {
    return (
      <div>
        <div ref="kChart" style="width: 100%; height: 400px;" />
        <div ref="rsiChart" style="width: 100%; height: 80px;" />
      </div>
    );
  },
});
