<script setup lang="ts">
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()

useSeo({
  title: `Registry · ${wedding.title}`,
  titleMode: 'exact',
  description: `Registry for ${wedding.title}.`,
  noindex: true,
})
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <WeddingLabel text="Gifts" />
    <h1 class="mt-3 text-6xl text-highlighted">Registry</h1>
    <p class="mt-4 text-lg text-toned">{{ wedding.registry.intro }}</p>
    <ul v-if="wedding.registry.links.length" class="mt-10 flex flex-col gap-4">
      <li v-for="link in wedding.registry.links" :key="link.url">
        <UButton
          :to="link.url"
          target="_blank"
          size="xl"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-external-link"
          block
        >
          {{ link.name }}
        </UButton>
        <p v-if="link.note" class="mt-2 text-sm text-muted">{{ link.note }}</p>
      </li>
    </ul>
  </section>
</template>
