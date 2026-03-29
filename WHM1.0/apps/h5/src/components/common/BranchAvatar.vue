<script setup lang="ts">
import { computed } from 'vue'
import { resolveIcon } from '@/utils/icons'

const props = withDefaults(
  defineProps<{
    icon: string
    color: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    size: 'md',
  },
)

const sizeMap = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
} as const

const iconSizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const

const iconComponent = computed(() => resolveIcon(props.icon))
const avatarSizeClass = computed(() => sizeMap[props.size])
const iconSizeClass = computed(() => iconSizeMap[props.size])
</script>

<template>
  <div
    :class="[
      'inline-flex shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-white',
      avatarSizeClass,
      props.color,
    ]"
  >
    <component :is="iconComponent" :class="iconSizeClass" />
  </div>
</template>

