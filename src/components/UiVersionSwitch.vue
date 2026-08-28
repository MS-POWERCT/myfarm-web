<template>
  <div class="ui-ver">
    <div class="ui-ver-row">
      <button
        v-for="opt in options"
        :key="opt.id"
        type="button"
        :class="{ on: opt.id === current }"
        @click="onPick(opt.id)"
      >
        <b>{{ opt.label }}</b>
        <span>{{ opt.hint }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { UI_VERSION, UI_VERSION_OPTIONS, setUiVersion } from '@/config/ui'

const options = UI_VERSION_OPTIONS
const current = UI_VERSION

const onPick = (id) => {
  if (id === current) return
  setUiVersion(id)
}
</script>

<style scoped>
.ui-ver {
  margin-bottom: 12px;
}

.ui-ver-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  cursor: pointer;
}

button span {
  font-size: 10px;
  opacity: 0.55;
}

button.on {
  border-color: currentColor;
  background: rgba(255, 255, 255, 0.14);
  font-weight: 700;
}

button.on span {
  opacity: 0.8;
}
</style>
