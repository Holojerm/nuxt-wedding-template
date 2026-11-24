<script setup lang="ts">
// Invites a guest to write the couple a letter that opens later. Shown only
// when a wedding sets `letters.showOnSite`; the link leaves this site, which
// never sees a letter.
const props = defineProps<{ url: string; opensOn?: string }>()

const opens = computed(() => (props.opensOn ? formatPlainDate(props.opensOn) : null))
</script>

<template>
  <aside
    aria-label="Write us a letter"
    class="flex flex-col items-start gap-3 border-l-2 border-primary bg-elevated p-6"
  >
    <WeddingLabel text="A letter for later" />
    <p class="text-highlighted">
      Write us a letter.
      {{ opens ? `We will open them on ${opens}.` : 'We will open them later.' }}
    </p>
    <UButton
      :to="url"
      external
      target="_blank"
      color="neutral"
      variant="outline"
      icon="i-lucide-mail"
    >
      Write a letter
    </UButton>
  </aside>
</template>
