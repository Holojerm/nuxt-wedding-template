<script setup lang="ts">
import type { WeddingPhoto } from '../../../shared/utils/wedding-types'

// A photograph set like a catalogue plate: matted, numbered, captioned, with
// the photographer's credit that a CC license requires. DESIGN.md › Imagery.
//
// `sizes` must name a screen on every entry: a bare `100vw` resolves against
// no screen and emits 1px and 2px srcset candidates. The app's screens are
// tiny (xs is 64px), so phones are covered by lg/xl/xxl and their 2x copies.
// `format="auto"` lets the edge pick AVIF or WebP; without it, JPEG ships.
const props = withDefaults(
  defineProps<{ photo: WeddingPhoto; number?: number; eager?: boolean; sizes?: string }>(),
  { number: undefined, eager: false, sizes: 'lg:100vw xl:100vw xxl:100vw 3xl:1100px' },
)

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const plate = computed(() =>
  props.number ? `Plate ${ROMAN[props.number - 1] ?? props.number}` : null,
)
</script>

<template>
  <figure class="flex flex-col gap-3">
    <div class="border border-default bg-elevated p-2 sm:p-3">
      <NuxtImg
        :src="photo.src"
        :width="photo.width"
        :height="photo.height"
        :sizes="sizes"
        format="auto"
        :alt="photo.alt"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : 'auto'"
        decoding="async"
        class="block h-auto w-full"
      />
    </div>
    <figcaption class="flex flex-col gap-1">
      <WeddingLabel v-if="plate" :text="plate" />
      <span class="italic text-toned">{{ photo.caption }}</span>
      <span v-if="photo.credit" class="text-xs text-muted">
        Photo:
        <a
          :href="photo.credit.sourceUrl"
          target="_blank"
          rel="noopener"
          class="rounded-sm underline underline-offset-2 hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
          >{{ photo.credit.author }}</a
        >,
        <a
          :href="photo.credit.licenseUrl"
          target="_blank"
          rel="noopener license"
          class="rounded-sm underline underline-offset-2 hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
          >{{ photo.credit.license }}</a
        ><template v-if="photo.credit.note">, {{ photo.credit.note }}</template>
      </span>
    </figcaption>
  </figure>
</template>
