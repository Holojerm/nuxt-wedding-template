<script setup lang="ts">
import { renderSVG } from 'uqr'

// A scannable QR code for a household's personal link. Black on white with a
// quiet zone, regardless of theme: printers and phone cameras read that best.
// The SVG comes from uqr, built only from `value`, so v-html is safe here.
const props = defineProps<{ value: string; label: string }>()

const svg = computed(() =>
  renderSVG(props.value, {
    border: 2,
    ecc: 'M',
    pixelSize: 8,
    whiteColor: 'white',
    blackColor: 'black',
  }),
)

function download() {
  const url = URL.createObjectURL(new Blob([svg.value], { type: 'image/svg+xml' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.label.replace(/[^\w-]+/g, '-').toLowerCase()}-qr.svg`
  a.click()
  URL.revokeObjectURL(url)
}

defineExpose({ download })
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div
    role="img"
    :aria-label="`QR code for ${label}`"
    class="aspect-square w-full [&>svg]:size-full"
    v-html="svg"
  />
</template>
