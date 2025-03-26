import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Popconfirm,
  RangePicker,
  Row,
  Table,
  Tag,
} from "ant-design-vue";
import { defineComponent, onMounted, reactive, ref } from "vue";
import EditTaskDrawer from "./components/edit-task-drawer";
import { taskApi, type Task } from "../../fetch/task";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import TrainWorker from "./utils/worker?worker";
import { useProgressStore } from "../../store/progress-store";
import BackTestingDrawer from "./components/back-testing-drawer";
import OverflowTip from "../../components/overflow-tip";

export default defineComponent({
  setup() {
    const progressStore = useProgressStore();
    const editTaskDrawerRef = ref<InstanceType<typeof EditTaskDrawer>>();
    const backTestingDrawerRef = ref<InstanceType<typeof BackTestingDrawer>>();
    const state = reactive({
      tableLoading: false,
      generating: false,
      filter: {
        name: "",
        timeRange: [null, null] as [Dayjs | null, Dayjs | null],
      },
      pagination: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
      },
      dataSource: [] as Task[],
    });

    const getTaskList = async (pageNum?: number, pageSize?: number) => {
      state.tableLoading = true;
      const res = await taskApi.getTaskList({
        pageNum: pageNum || state.pagination.pageNum,
        pageSize: pageSize || state.pagination.pageSize,
        startDate: state.filter.timeRange?.[0]
          ? dayjs(state.filter.timeRange[0]).format("YYYY-MM-DD")
          : null,
        endDate: state.filter.timeRange?.[0]
          ? dayjs(state.filter.timeRange[1]).format("YYYY-MM-DD")
          : null,
        ...state.filter,
      });
      state.tableLoading = false;
      if (res.code === 200) {
        state.dataSource = res.data.list;
      }
    };

    const deleteTask = async (id: number) => {
      const res = await taskApi.delTask({
        id,
      });
      if (res.code === 200) {
        getTaskList(1);
      }
    };

    const train = async (task: Task) => {
      const currentTask = progressStore.trainTaskList.find(
        (item) => item.config.name === task.name
      );
      if (currentTask && !currentTask.finished) {
        message.error("当前任务正在进行！");
        return;
      }
      const worker = new TrainWorker();
      worker.postMessage(
        JSON.stringify({
          type: "generateData",
          data: task,
        })
      );
      state.generating = true;
      worker.onmessage = (e) => {
        const res = JSON.parse(e.data);
        if (res.type === "generateDataOk") {
          state.generating = false;
          worker.postMessage(
            JSON.stringify({
              type: "startTrain",
              config: task,
              data: res.data,
            })
          );
        }
        if (res.type === "trainOk") {
          worker.terminate();
          getTaskList();
        }
        if (res.type === "updateProgress") {
          progressStore.updateProgress(task, res.data);
        }
      };
    };

    const backTesting = async (task: Task) => {
      backTestingDrawerRef.value?.test(task);
    };

    onMounted(() => {
      getTaskList(1);
    });

    return {
      state,
      editTaskDrawerRef,
      backTestingDrawerRef,
      getTaskList,
      deleteTask,
      train,
      backTesting,
    };
  },
  render() {
    const {
      state,
      editTaskDrawerRef,
      getTaskList,
      deleteTask,
      train,
      backTesting,
    } = this;
    return (
      <div>
        <header>
          <Row justify="space-between">
            <Form layout="inline">
              <FormItem label="任务名称">
                <Input
                  placeholder="请输入任务名称"
                  v-model={[state.filter.name, "value"]}
                />
              </FormItem>
              <FormItem label="创建时间">
                <RangePicker
                  v-model={[state.filter.timeRange, "value"]}
                  placeholder={["开始时间", "结束时间"]}
                />
              </FormItem>
              <FormItem>
                <Button
                  type="primary"
                  onClick={() => {
                    getTaskList(1);
                  }}
                >
                  查询
                </Button>
              </FormItem>
            </Form>
            <Button
              type="primary"
              onClick={() => {
                editTaskDrawerRef?.add();
              }}
            >
              创建任务
            </Button>
          </Row>
        </header>
        <main>
          <Table
            loading={state.tableLoading}
            dataSource={state.dataSource}
            tableLayout="auto"
            scroll={{ x: "max-content" }}
            pagination={{
              current: state.pagination.pageNum,
              pageSize: state.pagination.pageSize,
              total: state.pagination.total,
              onChange: (pageNum, pageSize) => {
                getTaskList(pageNum, pageSize);
              },
            }}
          >
            <Table.Column title="任务名称" dataIndex="name" />
            <Table.Column
              title="任务描述"
              dataIndex="desc"
              customRender={(col) => (
                <OverflowTip content={col.text} maxWidth={400} />
              )}
            />
            <Table.Column
              title="时间范围"
              customRender={(col) => {
                const r = col.record as Task;
                return `${r.startDate} - ${r.endDate}`;
              }}
            />
            <Table.Column
              title="代码"
              customRender={(col) => {
                const r = col.record as Task;
                return r.ticker.map((item) => <Tag color="blue">{item}</Tag>);
              }}
            />
            <Table.Column title="创建时间" dataIndex="createTime" />
            <Table.Column
              width={250}
              dataIndex="id"
              fixed="right"
              title="操作"
              customRender={(col) => {
                const r = col.record as Task;
                return (
                  <div>
                    {r.finished ? (
                      r.type === "daily" && (
                        <Button
                          type="link"
                          onClick={() => {
                            backTesting(r);
                          }}
                        >
                          回测
                        </Button>
                      )
                    ) : (
                      <Button
                        type="link"
                        disabled={state.generating}
                        onClick={() => {
                          train(col.record as Task);
                        }}
                      >
                        训练
                      </Button>
                    )}

                    <Button
                      type="link"
                      onClick={() => {
                        editTaskDrawerRef?.copy(col.record as Task);
                      }}
                    >
                      复制
                    </Button>
                    <Popconfirm
                      title="确认删除此任务？该操作无法恢复"
                      onConfirm={() => {
                        deleteTask(col.text);
                      }}
                    >
                      <Button type="link" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                );
              }}
            />
          </Table>
          <EditTaskDrawer ref="editTaskDrawerRef" onUpdate={getTaskList} />
          <BackTestingDrawer ref="backTestingDrawerRef" />
        </main>
      </div>
    );
  },
});
