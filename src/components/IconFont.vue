<template>
  <svg :class="['icon-font', className]" :style="style" aria-hidden="true">
    <use :xlink:href="iconName"></use>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  className: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 14
  },
  color: {
    type: String,
    default: ''
  }
})

const iconName = computed(() => `#${props.name}`)

// 如果有自定义颜色，通过 style 设置
const style = computed(() => {
  const styles = {}
  if (props.size) {
    if (typeof props.size === 'number') {
      styles.width = `${props.size}px`
      styles.height = `${props.size}px`
    } else {
      styles.width = props.size
      styles.height = props.size
    }
  }
  if (props.color) {
    styles.color = props.color
    styles.fill = props.color
  }
  return styles
})
</script>

<style scoped>
.icon-font {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>
