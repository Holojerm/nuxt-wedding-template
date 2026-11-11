<script setup lang="ts">
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()

useSeo({
  title: `FAQ · ${wedding.title}`,
  titleMode: 'exact',
  description: `Questions and answers for ${wedding.title}'s guests.`,
  noindex: true,
})
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <WeddingLabel text="Questions" />
    <h1 class="mt-3 text-6xl text-highlighted">FAQ</h1>
    <!-- Plain headings and paragraphs rather than an accordion: every answer is
         findable with the browser's own search, and nothing hides behind a tap. -->
    <div class="mt-10 flex flex-col">
      <div v-for="item in wedding.faq" :key="item.q" class="border-b border-muted py-6">
        <h2 class="text-3xl text-highlighted">{{ item.q }}</h2>
        <p class="mt-2 text-lg leading-relaxed">{{ item.a }}</p>
      </div>
    </div>
    <p class="mt-10 text-muted">
      Something else?
      <a
        :href="`mailto:${wedding.rsvp.contactEmail}`"
        class="rounded-sm underline underline-offset-4 hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
        >Email us</a
      >.
    </p>
  </section>
</template>
