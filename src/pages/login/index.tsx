import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  message,
  Row,
} from "ant-design-vue";
import { defineComponent, reactive } from "vue";
import md5 from "md5";
import "./index.less";
import { userApi } from "../../fetch/user";
import { useRouter } from "vue-router";
import { useUserStore } from "../../store/user-store";

enum Mode {
  Login,
  Register,
}

const ModeMap = {
  [Mode.Login]: "用户登录",
  [Mode.Register]: "用户注册",
};

export default defineComponent({
  setup() {
    const userStore = useUserStore();
    const router = useRouter();
    const state = reactive({
      mode: Mode.Login,
      form: {
        userName: "",
        userPassword: "",
        code: "",
      },
    });

    const login = async () => {
      const encryptedPassword = md5(state.form.userPassword);
      const res = await userApi.login({
        userName: state.form.userName,
        userPassword: encryptedPassword,
      });
      if (res.code === 200) {
        userStore.updateUserInfo(res.data);
        router.push("/overview");
      }
    };

    const register = async () => {
      const encryptedPassword = md5(state.form.userPassword);
      const res = await userApi.register({
        userName: state.form.userName,
        userPassword: encryptedPassword,
        code: state.form.code,
      });
      if (res.code === 200) {
        message.success("注册成功");
        state.mode = Mode.Login;
        state.form = {
          userName: "",
          userPassword: "",
          code: "",
        };
      }
    };

    return { state, login, register };
  },
  render() {
    const { state, login, register } = this;
    return (
      <Row justify="center" align="middle" style={{ marginTop: "40px" }}>
        <Card
          class="login-card"
          title={ModeMap[state.mode]}
          // extra={
          //   <Button
          //     type="link"
          //     onClick={() => {
          //       state.mode =
          //         state.mode === Mode.Login ? Mode.Register : Mode.Login;
          //     }}
          //   >
          //     {state.mode === Mode.Login ? "注册" : "登录"}
          //   </Button>
          // }
        >
          <Form labelCol={{ span: 6 }}>
            <FormItem label="用户名称" name="userName">
              <Input
                placeholder="请输入用户名称"
                v-model={[state.form.userName, "value"]}
              />
            </FormItem>
            <FormItem label="用户密码" name="userPassword">
              <Input.Password
                placeholder="请输入用户密码"
                v-model={[state.form.userPassword, "value"]}
                onPressEnter={login}
              />
            </FormItem>
            {state.mode === Mode.Register && (
              <FormItem label="邀请代码" name="code">
                <Input
                  placeholder="请输入邀请代码"
                  v-model={[state.form.code, "value"]}
                />
              </FormItem>
            )}
          </Form>
          <Row justify="end">
            {state.mode === Mode.Login && (
              <Button type="primary" onClick={login}>
                登录
              </Button>
            )}
            {state.mode === Mode.Register && (
              <Button type="primary" onClick={register}>
                注册
              </Button>
            )}
          </Row>
        </Card>
      </Row>
    );
  },
});
