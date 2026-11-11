<script setup lang="ts">
// The museum wall-label eyebrow: a catalogue number and a short title.
// DESIGN.md › Motifs. Decorative only — the real heading follows it.
defineProps<{ number?: number; text: string }>()
</script>

<template>
  <p class="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-secondary">
    <span v-if="number !== undefined" class="tabular-nums"
      >No. {{ String(number).padStart(2, '0') }}</span
    >
    <span v-if="number !== undefined" aria-hidden="true" class="h-px w-8 bg-current" />
    <span>{{ text }}</span>
  </p>
</template>
