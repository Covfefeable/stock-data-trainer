import { Tooltip } from 'ant-design-vue'
import type { TooltipPlacement } from 'ant-design-vue/lib/tooltip'
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    content: {
      type: String,
      default: ''
    },
    maxWidth: {
      type: Number,
      default: 150
    },
    placement: {
      type: String,
      default: 'top'
    }
  },
  render() {
    const { content, maxWidth, placement } = this.$props

    const style = {
      width: 'fit-content',
      maxWidth: `${maxWidth}px`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    } as const

    return (
      <Tooltip title={content} placement={placement as TooltipPlacement}>
        <section style={style}>{this.$props.content}</section>
      </Tooltip>
    )
  }
})
