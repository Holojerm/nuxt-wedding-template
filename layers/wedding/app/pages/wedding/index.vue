<script setup lang="ts">
// The landing page answers the four questions guests actually have — when,
// where, what to wear, how to reply — before anything decorative.
// research.md › Key takeaways 8.
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()

useSeo({
  title: wedding.title,
  titleMode: 'exact',
  description: `${wedding.title} are getting married at the ${wedding.venue.name}.`,
  noindex: true,
})

const main = computed(
  () => wedding.events.find((e) => e.id === 'ceremony') ?? wedding.events.find((e) => e.isPublic),
)
const publicEvents = computed(() => wedding.events.filter((e) => e.isPublic))
const dateLine = computed(() => (wedding.date ? formatPlainDate(wedding.date) : 'Date to come'))
const deadline = computed(() =>
  wedding.rsvp.deadline ? formatPlainDate(wedding.rsvp.deadline) : null,
)

// Day resolution in the wedding's time zone, so server and client agree.
const now = useWeddingNow()
const closed = rsvpClosed(wedding, now)
const daysLeft = rsvpDaysLeft(wedding, now)
// The nudge appears for the last two weeks only; earlier it would just be noise.
const nudge =
  daysLeft === null || daysLeft > 14
    ? null
    : daysLeft === 0
      ? 'Today is the last day to reply'
      : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left to reply`
</script>

<template>
  <div>
    <WeddingToday :wedding="wedding" :now="now" />

    <section
      class="mx-auto flex max-w-(--ui-container) flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28"
    >
      <WeddingLabel :text="`${wedding.city} · ${wedding.date?.slice(0, 4) ?? ''}`" />
      <h1 class="text-6xl leading-none text-highlighted sm:text-8xl">
        {{ wedding.couple.first }}
        <span class="block py-2 text-4xl italic text-primary sm:text-5xl">and</span>
        {{ wedding.couple.second }}
      </h1>
      <p class="max-w-xl text-lg text-toned">{{ wedding.tagline }}</p>
      <p class="text-sm uppercase tracking-widest text-highlighted">
        {{ dateLine }} · {{ wedding.venue.name }}
      </p>
      <WeddingCountdown v-if="wedding.date" :date="wedding.date" :time-zone="wedding.timeZone" />
      <div class="flex flex-wrap justify-center gap-3">
        <UButton v-if="!closed" to="/rsvp" size="xl">RSVP</UButton>
        <UButton
          v-else
          :to="`mailto:${wedding.rsvp.contactEmail}`"
          external
          size="xl"
          icon="i-lucide-mail"
        >
          RSVPs have closed · Email us
        </UButton>
        <UButton
          to="/wedding.ics"
          external
          size="xl"
          color="neutral"
          variant="outline"
          icon="i-lucide-calendar-plus"
        >
          Add to calendar
        </UButton>
      </div>
      <p v-if="nudge && !closed" class="text-sm uppercase tracking-widest text-primary">
        {{ nudge }} · by {{ deadline }}
      </p>
    </section>

    <section aria-labelledby="glance" class="border-y border-muted bg-muted">
      <div class="mx-auto max-w-(--ui-container) px-4 py-12 sm:px-6">
        <h2 id="glance" class="sr-only">At a glance</h2>
        <dl class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt><WeddingLabel text="When" /></dt>
            <dd class="mt-2 text-highlighted">
              {{ dateLine }}
              <span v-if="main" class="block text-muted">
                {{ formatEventTime(main.startsAt, wedding.timeZone) }}
              </span>
            </dd>
          </div>
          <div>
            <dt><WeddingLabel text="Where" /></dt>
            <dd class="mt-2 text-highlighted">
              {{ wedding.venue.name }}
              <a
                :href="wedding.venue.mapsUrl"
                target="_blank"
                rel="noopener"
                class="block rounded-sm text-muted underline underline-offset-4 hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
              >
                {{ wedding.venue.address }}
              </a>
            </dd>
          </div>
          <div v-if="main?.dress">
            <dt><WeddingLabel text="Dress" /></dt>
            <dd class="mt-2 text-highlighted">
              {{ main.dress }}
              <NuxtLink
                to="/faq"
                class="block rounded-sm text-muted underline underline-offset-4 hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
              >
                What that means
              </NuxtLink>
            </dd>
          </div>
          <div>
            <dt><WeddingLabel text="Reply" /></dt>
            <dd class="mt-2 text-highlighted">
              <template v-if="deadline">By {{ deadline }}</template>
              <template v-else>When you can</template>
              <NuxtLink
                to="/rsvp"
                class="block rounded-sm text-muted underline underline-offset-4 hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
              >
                RSVP online
              </NuxtLink>
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <section aria-labelledby="story" class="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <WeddingLabel :number="1" text="The story" />
      <h2 id="story" class="mt-3 text-5xl text-highlighted">How we got here</h2>
      <div class="mt-6 flex flex-col gap-4 text-lg leading-relaxed text-default">
        <p v-for="(paragraph, i) in wedding.story" :key="i">{{ paragraph }}</p>
      </div>
    </section>

    <section
      v-if="wedding.photos.length"
      aria-labelledby="venue"
      class="mx-auto max-w-(--ui-container) px-4 pb-20 sm:px-6"
    >
      <div class="mx-auto max-w-2xl">
        <WeddingLabel :number="2" text="The venue" />
        <h2 id="venue" class="mt-3 text-5xl text-highlighted">{{ wedding.venue.name }}</h2>
      </div>
      <div class="mt-10 flex flex-col gap-12">
        <WeddingPlate :photo="wedding.photos[0]!" :number="1" />
        <div v-if="wedding.photos.length > 1" class="grid items-start gap-12 md:grid-cols-2">
          <WeddingPlate
            v-for="(photo, i) in wedding.photos.slice(1)"
            :key="photo.src"
            :photo="photo"
            :number="i + 2"
            sizes="lg:100vw xl:100vw xxl:50vw 3xl:560px"
          />
        </div>
      </div>
    </section>

    <section aria-labelledby="weekend" class="mx-auto max-w-2xl px-4 pb-24 sm:px-6">
      <WeddingLabel :number="wedding.photos.length ? 3 : 2" text="The weekend" />
      <h2 id="weekend" class="mt-3 text-5xl text-highlighted">Schedule</h2>
      <div class="mt-8 flex flex-col gap-6">
        <WeddingEventCard
          v-for="event in publicEvents"
          :key="event.id"
          :event="event"
          :time-zone="wedding.timeZone"
        />
      </div>
      <div class="mt-8">
        <UButton
          to="/travel"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
        >
          Travel and hotels
        </UButton>
      </div>
    </section>
  </div>
</template>
