import { Dropdown, Menu, MenuItem } from "ant-design-vue";
import { defineComponent } from "vue";
import { useUserStore } from "../../store/user-store";

export default defineComponent({
  setup() {
    const userStore = useUserStore();

    return { userStore };
  },
  render() {
    const { userStore } = this;
    return (
      <Dropdown
        overlay={
          <Menu>
            <MenuItem onClick={userStore.logout}>登出</MenuItem>
          </Menu>
        }
      >
        <span style={{ color: "white" }}>{userStore.userInfo?.userName}</span>
      </Dropdown>
    );
  },
});
