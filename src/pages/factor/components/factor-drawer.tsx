import { defineComponent, nextTick, reactive, ref } from "vue";
import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
} from "ant-design-vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import { factorApi, type Factor } from "../../../fetch/factor";
import * as monaco from "monaco-editor";
import { factorDefaultContent } from "../../../utils";
// @ts-expect-error
import prettier from "prettier-standalone";
import { stockApi } from "../../../fetch/stock";
import dayjs from "dayjs";

enum ShowMode {
  Add,
  Edit,
}

const TITLEMAP = {
  [ShowMode.Add]: "新增指标",
  [ShowMode.Edit]: "编辑指标",
};

export default defineComponent({
  emits: ["refresh"],
  setup(_props, { emit }) {
    let monacoIns = null as null | monaco.editor.IStandaloneCodeEditor;
    const state = reactive({
      showMode: ShowMode.Add,
      confirmLoading: false,
      open: false,
      curId: null as number | null,
      form: {
        name: "",
        desc: "",
        fn: "",
        echartsShowType: null as string | null,
      },
    });

    const formRef = ref();
    const formRules = {
      name: [{ required: true, message: "请输入名称" }],
      fn: [{ required: true, message: "请输入指标计算规则" }],
      echartsShowType: [{ required: true, message: "请输入图表类型" }],
    };

    const add = () => {
      state.showMode = ShowMode.Add;
      state.open = true;
      state.form.fn = factorDefaultContent;
      nextTick(() => {
        initMonaco();
        initFormat();
      });
    };

    const edit = (factor: Factor) => {
      state.showMode = ShowMode.Edit;
      state.open = true;
      state.curId = factor.id;
      state.form = {
        name: factor.name,
        desc: factor.desc,
        fn: factor.fn,
        echartsShowType: factor.echartsShowType,
      };
      nextTick(() => {
        initMonaco();
        initFormat();
      });

      monacoIns?.setValue(factor.fn);
    };

    const initMonaco = () => {
      monacoIns = monaco.editor.create(
        document.getElementById("monaco-editor")!,
        {
          theme: "vs-dark",
          value: state.form.fn,
          language: "typescript",
        }
      );
      monacoIns?.layout();
      monacoIns?.onDidChangeModelContent(() => {
        state.form.fn = monacoIns?.getValue() || "";
      });
    };

    const initFormat = () => {
      monacoIns?.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        async () => {
          await formatCode();
        }
      );
    };

    const formatCode = async () => {
      try {
        const formattedCode = await prettier.format(state.form.fn, {
          parser: "babel", // 指定解析器为 TypeScript
          semi: false,
          singleQuote: true, // 使用单引号
          tabWidth: 2,
        });
        monacoIns?.setValue(formattedCode);
        state.form.fn = formattedCode;
        return true;
      } catch {
        return false;
      }
    };

    const validateCode = async () => {
      // 验证所填写代码是否完整地添加了字段
      const res = await stockApi.getStockData({
        ticker: ["NDX"],
        start_date: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
        end_date: dayjs().format("YYYY-MM-DD"),
        type: "daily",
        extra: {
          sma: true,
          rsi: true,
          ema: true,
        },
      });
      if (res.code === 200) {
        try {
          const factorConfig = eval(state.form.fn);
          const data = factorConfig.manipulate(res.data);
          const keys = Object.keys(data[0]);
          const allKeysMatch = data.every((item: any) => {
            return (
              keys.every((key) => key in item) &&
              Object.keys(item).length === keys.length
            );
          });
          return allKeysMatch;
        } catch (error) {
          console.log(error);
          return false;
        }
      }
      return false;
    };

    const onOk = async () => {
      if (!formatCode()) {
        message.error("代码格式化出错");
        return;
      }
      if (!(await validateCode())) {
        message.error("部分元素中key值不一致，请检查");
        return;
      }

      formRef.value.validateFields().then(() => {
        state.confirmLoading = true;
        const data = JSON.parse(JSON.stringify(state.form));
        if (state.showMode === ShowMode.Add) {
          factorApi
            .createFactor(data)
            .then((res) => {
              if (res.code === 200) {
                onClose();
                emit("refresh");
              }
            })
            .finally(() => {
              state.confirmLoading = false;
            });
        }
        if (state.showMode === ShowMode.Edit) {
          data.id = state.curId;
          factorApi
            .updateFactor(data)
            .then((res) => {
              if (res.code === 200) {
                onClose();
                emit("refresh");
              }
            })
            .finally(() => {
              state.confirmLoading = false;
            });
        }
      });
    };

    const onClose = () => {
      formRef.value.clearValidate();
      state.open = false;
      state.confirmLoading = false;
      state.curId = null;
      state.form = {
        name: "",
        desc: "",
        fn: "",
        echartsShowType: null,
      };
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

    return { state, viewSlots, formRef, formRules, add, edit, onClose, onOk };
  },
  render() {
    const { state, viewSlots, formRules, onClose } = this;
    return (
      <Drawer
        destroyOnClose
        visible={state.open}
        title={TITLEMAP[state.showMode]}
        width="100%"
        onClose={onClose}
        closeIcon={null}
        v-slots={viewSlots}
      >
        <Form
          ref="formRef"
          model={state.form}
          labelCol={{ span: 2 }}
          rules={formRules}
        >
          <Form.Item label="指标名称" name="name">
            <Input
              v-model={[state.form.name, "value"]}
              placeholder="请输入指标名称"
            />
          </Form.Item>
          <Form.Item label="指标描述" name="desc">
            <Input.TextArea
              v-model={[state.form.desc, "value"]}
              placeholder="请输入指标描述"
            />
          </Form.Item>
          <Form.Item label="图表类型" name="echartsShowType">
            <Select
              v-model={[state.form.echartsShowType, "value"]}
              placeholder="请选择图表类型"
            >
              <Select.Option value="line">折线图</Select.Option>
              <Select.Option value="bar">柱状图</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="指标计算规则" name="fn">
            <div
              id="monaco-editor"
              style={{ width: "100%", height: "600px" }}
            />
          </Form.Item>
        </Form>
      </Drawer>
    );
  },
});
