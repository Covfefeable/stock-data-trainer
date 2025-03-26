import { computed, defineComponent, reactive, ref } from "vue";
import { Button, DatePicker, Drawer, Form, Row, Space } from "ant-design-vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import { datePickerPresets } from "../../../utils";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import TrainWorker from "../utils/worker?worker";
import type { Task } from "../../../fetch/task";
import BackTestingChart from "./back-testing-chart";

enum ShowMode {
  Test,
}

const TITLEMAP = {
  [ShowMode.Test]: "任务回测",
};

export default defineComponent({
  emits: ["update"],
  setup(_props) {
    const state = reactive({
      showMode: ShowMode.Test,
      confirmLoading: false,
      open: false,
      currentTask: null as Task | null,
      compareResult: null as { real: number[][]; predict: number[][] } | null,
      form: {
        startDate: null as Dayjs | null,
        endDate: null as Dayjs | null,
      },
    });

    const formRef = ref();
    const formRules = {
      startDate: [{ required: true, message: "请选择开始时间" }],
      endDate: [{ required: true, message: "请选择结束时间" }],
    };

    const test = (task: Task) => {
      state.showMode = ShowMode.Test;
      state.currentTask = task;
      state.open = true;
      state.form.startDate = dayjs(task.endDate).add(1, "day");
      state.form.endDate = dayjs();
    };

    const backTesting = () => {
      formRef.value.validateFields().then(() => {
        state.confirmLoading = true;
        const data = JSON.parse(JSON.stringify(state.form));
        data.startDate = dayjs(data.startDate).format("YYYY-MM-DD");
        data.endDate = dayjs(data.endDate).format("YYYY-MM-DD");

        const worker = new TrainWorker();
        worker.postMessage(
          JSON.stringify({
            type: "backTesting",
            config: state.currentTask,
            range: [data.startDate, data.endDate],
          })
        );
        worker.onmessage = (e) => {
          const res = JSON.parse(e.data);
          if (res.type === "backTestingOk") {
            state.compareResult = res.data;
            state.confirmLoading = false;
            worker.terminate();
          }
        };
      });
    };

    const onClose = () => {
      formRef.value.clearValidate();
      state.open = false;
      state.confirmLoading = false;
      state.compareResult = null;
      state.currentTask = null;
      state.form = {
        startDate: null,
        endDate: null,
      };
    };

    const viewSlots = {
      extra: () => <CloseOutlined onClick={onClose} />,
      footer: () => (
        <Row justify="end">
          <Space>
            <Button onClick={onClose}>关闭</Button>
          </Space>
        </Row>
      ),
    };

    const compare = computed(() => {
      if (state.compareResult) {
        const predict = state.compareResult.predict.map((item) => {
          return [Math.round(item[0]), Math.round(item[1])];
        });
        const real = state.compareResult.real;

        const sameCount = predict.reduce((count, item, index) => {
          if (item[0] === real[index][0] && item[1] === real[index][1]) {
            return count + 1;
          }
          return count;
        }, 0);

        // 买入后未操作情况
        const always1Count = real.reduce((count, _item, index) => {
          if (real[index][0] === 0 && real[index][1] === 1) {
            return count + 1;
          }
          return count;
        }, 0);

        return {
          total: state.compareResult.predict.length,
          current: sameCount,
          always1Count,
          currectRate: (
            (sameCount / state.compareResult.predict.length) *
            100
          ).toFixed(2),
          always1CountRate: (
            (always1Count / state.compareResult.predict.length) *
            100
          ).toFixed(2),
        };
      }
      return null;
    });

    return {
      state,
      viewSlots,
      formRef,
      formRules,
      compare,
      test,
      onClose,
      backTesting,
    };
  },
  render() {
    const { state, viewSlots, formRules, compare, onClose, backTesting } = this;
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
          layout="inline"
          model={state.form}
          rules={formRules}
        >
          <Form.Item label="开始时间" name="startDate">
            <DatePicker
              allowClear={false}
              placeholder="请选择时间"
              v-model={[state.form.startDate, "value"]}
              presets={datePickerPresets}
              disabledDate={(date) => {
                // 不能选择未来时间
                return (
                  date.valueOf() <
                  dayjs(state.currentTask?.endDate).add(1, "day").valueOf()
                );
              }}
            />
          </Form.Item>
          <Form.Item label="结束时间" name="endDate">
            <DatePicker
              allowClear={false}
              placeholder="请选择时间"
              v-model={[state.form.endDate, "value"]}
              disabledDate={(date) => {
                // 不能选择未来时间
                return date.valueOf() > Date.now();
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button loading={state.confirmLoading} onClick={backTesting}>
              回测
            </Button>
          </Form.Item>
          {compare && (
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ marginTop: "20px" }}>
                总数：{compare.total}，预测正确：{compare.current}，准确率：
                {compare.currectRate}%，同期未操作准确率：
                {compare.always1CountRate}%
              </div>
              <BackTestingChart
                compare={state.compareResult}
                task={state.currentTask!}
                range={[
                  dayjs(state.form.startDate).format("YYYY-MM-DD"),
                  dayjs(state.form.endDate).format("YYYY-MM-DD"),
                ]}
              />
            </Space>
          )}
        </Form>
      </Drawer>
    );
  },
});
