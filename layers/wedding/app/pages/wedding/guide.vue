<script setup lang="ts">
// "Nearby": what to do around the venue for guests in town for the weekend.
// Only linked when the wedding's config has a `guide`.
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()
if (!wedding.guide) throw createError({ statusCode: 404, message: 'Not found', fatal: true })
const guide = wedding.guide

useSeo({
  title: `Nearby · ${wedding.title}`,
  titleMode: 'exact',
  description: `Things to do near the ${wedding.venue.name}.`,
  noindex: true,
})

const mapsLink = (q: string) => `https://maps.google.com/?q=${encodeURIComponent(q)}`
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <WeddingLabel :text="wedding.city" />
    <h1 class="mt-3 text-6xl text-highlighted">Nearby</h1>
    <p class="mt-4 text-lg text-toned">{{ guide.intro }}</p>

    <div v-for="(section, i) in guide.sections" :key="section.title" class="mt-14">
      <WeddingLabel :number="i + 1" :text="section.title" />
      <ul class="mt-4 flex flex-col">
        <li v-for="item in section.items" :key="item.name" class="border-b border-muted py-5">
          <h2 class="text-3xl text-highlighted">{{ item.name }}</h2>
          <p class="mt-1 text-lg">{{ item.note }}</p>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a
              v-if="item.address"
              :href="mapsLink(`${item.name}, ${item.address}`)"
              target="_blank"
              rel="noopener"
              class="rounded-sm text-muted underline underline-offset-4 hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
              >{{ item.address }}</a
            >
            <a
              v-if="item.url"
              :href="item.url"
              target="_blank"
              rel="noopener"
              class="rounded-sm text-muted underline underline-offset-4 hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
              >Website</a
            >
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
