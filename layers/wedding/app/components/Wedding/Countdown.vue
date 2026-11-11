<script setup lang="ts">
// Days until the wedding, counted in the wedding's own time zone so a guest in
// London and one in Los Angeles see the same number. Renders on the server
// and does not tick: a day-resolution count needs no timer.
const props = defineProps<{ date: string; timeZone: string }>()

const days = computed(() => {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: props.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const ms = Date.parse(`${props.date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
})
</script>

<template>
  <p v-if="days > 1" class="text-sm uppercase tracking-widest text-muted">
    <span class="tabular-nums text-highlighted">{{ days }}</span> days to go
  </p>
  <p v-else-if="days === 1" class="text-sm uppercase tracking-widest text-muted">Tomorrow</p>
  <p v-else-if="days === 0" class="text-sm uppercase tracking-widest text-primary">Today</p>
</template>
