import { defineComponent, onMounted, reactive, ref } from "vue";
import { factorApi, type Factor } from "../../fetch/factor";
import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Popconfirm,
  Row,
  Space,
  Table,
} from "ant-design-vue";
import FactorDrawer from "./components/factor-drawer";
import OverflowTip from "../../components/overflow-tip";

export default defineComponent({
  emits: ["add"],
  setup() {
    const factorDrawerRef = ref<InstanceType<typeof FactorDrawer>>();
    const state = reactive({
      tableLoading: false,
      filter: {
        name: "",
      },
      dataSource: [] as Factor[],
      pagination: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
      },
    });

    const getFactorList = async (pageNum?: number, pageSize?: number) => {
      state.tableLoading = true;
      const res = await factorApi.getFactorList({
        pageNum: pageNum || state.pagination.pageNum,
        pageSize: pageSize || state.pagination.pageSize,
        ...state.filter,
      });
      state.tableLoading = false;
      if (res.code === 200) {
        state.dataSource = res.data.list;
      }
    };

    const deleteFactor = async (id: number) => {
      const res = await factorApi.deleteFactor({
        id,
      });
      if (res.code === 200) {
        message.success("删除成功");
        getFactorList();
      }
    };

    onMounted(() => {
      getFactorList(1);
    });

    return { state, factorDrawerRef, getFactorList, deleteFactor };
  },
  render() {
    const { state, factorDrawerRef, getFactorList, deleteFactor } = this;
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
              <FormItem>
                <Button
                  type="primary"
                  onClick={() => {
                    getFactorList(1);
                  }}
                >
                  查询
                </Button>
              </FormItem>
            </Form>
            <Button
              type="primary"
              onClick={() => {
                factorDrawerRef?.add();
              }}
            >
              创建指标
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
                getFactorList(pageNum, pageSize);
              },
            }}
          >
            <Table.Column title="指标名称" dataIndex="name" />
            <Table.Column
              title="指标描述"
              dataIndex="desc"
              customRender={(col) => (
                <OverflowTip content={col.text} maxWidth={400} />
              )}
            />
            <Table.Column title="创建时间" dataIndex="createTime" />
            <Table.Column
              width={250}
              dataIndex="id"
              fixed="right"
              title="操作"
              customRender={(col) => {
                const r = col.record as Factor;
                return (
                  <Space>
                    <Button
                      type="link"
                      onClick={() => {
                        factorDrawerRef?.edit(r);
                      }}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确认删除此指标？该操作无法恢复"
                      onConfirm={() => {
                        deleteFactor(col.text);
                      }}
                    >
                      <Button type="link" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                );
              }}
            />
          </Table>
          <FactorDrawer
            ref="factorDrawerRef"
            onRefresh={() => {
              getFactorList();
            }}
          />
        </main>
      </div>
    );
  },
});
