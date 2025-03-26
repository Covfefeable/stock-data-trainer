import { Layout, Menu, Row, Space } from "ant-design-vue";
import { defineComponent, reactive } from "vue";
import { RouterView, useRouter } from "vue-router";
import { menu } from "./router/menu";
import type { Key } from "ant-design-vue/es/_util/type";
import dayjs from "dayjs";
import Progress from "./components/progress";
import { useUserStore } from "./store/user-store";
import UserDropdown from "./components/user-dropdown";

export default defineComponent({
  setup() {
    const userStore = useUserStore();
    const router = useRouter();
    const state = reactive({
      selectedMenu: [] as Key[],
      selectedSubMenu: [] as Key[],
    });

    const selectIndex = () => {
      state.selectedMenu = [menu[0].key, menu[0].children[0].key];
      router.push(menu[0].children[0].key as string);
    };

    return { state, userStore, selectIndex };
  },
  render() {
    const { userStore, selectIndex } = this;
    return (
      <Layout
        // @ts-expect-error anywory it's work
        onDragover={(e) => {
          e.preventDefault();
        }}
      >
        {userStore.isLogin && (
          <Layout.Header>
            <Row justify="space-between">
              <Space>
                <section
                  class="logo"
                  onClick={() => {
                    selectIndex();
                  }}
                >
                  Stock Data Trainer
                </section>
                <Menu
                  theme="dark"
                  mode="horizontal"
                  items={menu}
                  v-model={[this.state.selectedMenu, "selectedKeys"]}
                  onSelect={(item) => {
                    this.$router.push(item.key as string);
                  }}
                />
              </Space>
              <UserDropdown />
            </Row>
          </Layout.Header>
        )}

        <Layout.Content>
          <RouterView />
        </Layout.Content>
        <Layout.Footer>
          Stock Data Trainer ©{dayjs().get("year")} Created by Covfefeable
        </Layout.Footer>
        <Progress />
      </Layout>
    );
  },
});
