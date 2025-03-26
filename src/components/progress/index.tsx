import { defineComponent, nextTick, ref, watch } from "vue";
import { useProgressStore } from "../../store/progress-store";
import * as echarts from "echarts";
import "./index.less";
import {
  Button,
  List,
  ListItem,
  Popover,
  Progress,
  Space,
  Tooltip,
} from "ant-design-vue";

export default defineComponent({
  setup() {
    const progressStore = useProgressStore();

    const x = ref<number>(20);
    const y = ref<number>(20);

    const setFloatBtnPosition = (e: DragEvent) => {
      const clientWidth = document.body.clientWidth;
      const clientHeight = document.body.clientHeight;
      (x.value = clientWidth - e.clientX - 25),
        (y.value = clientHeight - e.clientY - 50);
    };

    const renderChart = () => {
      nextTick(() => {
        progressStore.trainTaskList.forEach((item) => {
          const el = document.getElementById(`chart-${item.config.name}`);
          if (el) {
            const lossChart = echarts.getInstanceByDom(el) || echarts.init(el);
            const option = {
              grid: {
                top: "15%",
                bottom: "15%",
              },
              xAxis: {
                type: "category",
                data: item.epochLogs.map((item) => item.epoch + 1),
              },
              yAxis: {
                type: "value",
              },
              tooltip: {
                trigger: "axis",
              },
              series: [
                {
                  name: "Loss",
                  data: item.epochLogs.map((item) => item.logs?.loss),
                  type: "line",
                  showSymbol: false,
                  smooth: true,
                },
                {
                  name: "Accuracy",
                  data: item.epochLogs.map((item) => item.logs?.acc),
                  type: "line",
                  showSymbol: false,
                  smooth: true,
                },
              ],
            };
            lossChart.setOption(option);
          }
        });
      });
    };

    watch(
      () => progressStore.trainTaskList,
      () => {
        renderChart();
      },
      { deep: true }
    );
    return { progressStore, setFloatBtnPosition, renderChart, x, y };
  },
  render() {
    const { progressStore, setFloatBtnPosition, renderChart, x, y } = this;
    return (
      <Popover
        trigger="click"
        content={
          <div class="progress-popover">
            <List
              dataSource={progressStore.trainTaskList}
              bordered
              renderItem={({ item }) => {
                return (
                  <ListItem>
                    <Space>
                      <Tooltip title={item.config.name}>
                        <div class="task-name">{item.config.name}</div>
                      </Tooltip>

                      <Progress
                        size="small"
                        percent={Number(item.progress)}
                        style={{ width: "100px" }}
                      />

                      <Popover
                        onOpenChange={renderChart}
                        trigger="click"
                        content={
                          <div class="pop-chart">
                            <div
                              style="width: 300px; height: 150px"
                              id={`chart-${item.config.name}`}
                            />
                          </div>
                        }
                      >
                        <Button type="link">详情</Button>
                      </Popover>
                    </Space>
                  </ListItem>
                );
              }}
            />
          </div>
        }
      >
        <div
          class="progress"
          v-show={progressStore.trainTaskList.length}
          draggable
          onDragend={(e) => {
            e.preventDefault();
            setFloatBtnPosition(e);
          }}
          style={{
            right: x + "px",
            bottom: y + "px",
          }}
        >
          {progressStore.ongoingTask ? (
            <>
              <div>{progressStore.ongoingTask?.progress}</div>
              <div class="percent">%</div>
            </>
          ) : (
            <div class="empty-text">无任务</div>
          )}
        </div>
      </Popover>
    );
  },
});
