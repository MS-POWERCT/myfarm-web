<template>
  <img
    v-if="src"
    class="farm-icon"
    :src="src"
    :alt="label"
    :style="{ width: sizePx, height: sizePx }"
  />
</template>

<script setup>
import { computed } from 'vue'
import { farmIconSrc } from '@/utils/farmIcon'

const props = defineProps({
  handbook: { type: Object, default: null },
  icon: { type: String, default: '' },
  name: { type: String, default: '' },
  size: { type: [Number, String], default: 22 },
})

const src = computed(() =>
  farmIconSrc(props.handbook || { icon: props.icon, name: props.name })
)

const label = computed(() => props.handbook?.name || props.name || '')

const sizePx = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size
)
</script>

<style scoped>
.farm-icon {
  display: block;
  object-fit: contain;
  flex-shrink: 0;
  pointer-events: none;
}
</style>
