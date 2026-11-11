<script setup lang="ts">
import type { InvitationView } from '../../../shared/utils/wedding-types'

// Three steps: find the invitation, answer, see the answers back. A personal
// link (`/rsvp?code=XXXXXX`, printed as a QR code) skips the first step.
// research.md › Key takeaways 1.
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()

useSeo({
  title: `RSVP · ${wedding.title}`,
  titleMode: 'exact',
  description: `Reply to ${wedding.title}'s invitation.`,
  noindex: true,
})

type Step = 'find' | 'choose' | 'answer' | 'done'
const step = ref<Step>('find')
const name = ref('')
const code = ref('')
const looking = ref(false)
const notFound = ref(false)
const closed = ref(rsvpClosed(wedding, useWeddingNow()))
const matches = ref<InvitationView[]>([])
const invitation = ref<InvitationView | null>(null)
const error = ref<string | null>(null)

const deadline = computed(() =>
  wedding.rsvp.deadline ? formatPlainDate(wedding.rsvp.deadline) : null,
)

async function lookup(body: { name: string } | { code: string }) {
  looking.value = true
  notFound.value = false
  error.value = null
  try {
    const res = await $fetch<{ closed: boolean; invitations: InvitationView[] }>(
      '/api/wedding/lookup',
      { method: 'POST', body },
    )
    closed.value = res.closed
    matches.value = res.invitations
    if (res.invitations.length === 0) notFound.value = true
    else if (res.invitations.length === 1) open(res.invitations[0]!)
    else step.value = 'choose'
  } catch (e: unknown) {
    const status = (e as { statusCode?: number }).statusCode
    error.value =
      status === 429
        ? 'Too many tries. Wait a few minutes and try again.'
        : 'Something went wrong. Please try again.'
  } finally {
    looking.value = false
  }
}

function open(found: InvitationView) {
  invitation.value = found
  const answered = found.household.respondedAt !== null
  step.value = answered ? 'done' : closed.value ? 'done' : 'answer'
}

const emailed = ref(false)
function onSaved(saved: InvitationView & { emailed?: boolean }) {
  invitation.value = saved
  emailed.value = saved.emailed === true
  step.value = 'done'
  window.scrollTo({ top: 0 })
}

const route = useRoute()
onMounted(() => {
  const fromLink = route.query.code
  if (typeof fromLink === 'string' && fromLink) {
    code.value = fromLink
    void lookup({ code: fromLink })
  }
})

const guestLabel = (g: InvitationView['household']['guests'][number]) =>
  [g.firstName, g.lastName].filter(Boolean).join(' ') || 'Guest'

function answerFor(g: InvitationView['household']['guests'][number], eventId: string) {
  const r = g.responses[eventId]
  if (!r) return 'No answer'
  return r.attending ? `Attending${r.meal ? ` · ${r.meal}` : ''}` : 'Not attending'
}
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <WeddingLabel text="Kindly reply" />
    <h1 class="mt-3 text-6xl text-highlighted">RSVP</h1>
    <p v-if="deadline" class="mt-4 text-lg text-toned">Please reply by {{ deadline }}.</p>

    <!-- Find -->
    <div v-if="step === 'find'" class="mt-10 flex flex-col gap-8">
      <UAlert
        v-if="closed"
        color="neutral"
        variant="subtle"
        icon="i-lucide-mail"
        title="RSVPs have closed"
        :description="`You can still look up your answers. To change anything, email ${wedding.rsvp.contactEmail}.`"
      />
      <form class="flex flex-col gap-4" @submit.prevent="lookup({ name })">
        <UFormField label="Your full name" hint="As it appears on your invitation">
          <UInput
            v-model="name"
            size="xl"
            autocomplete="name"
            placeholder="First and last name"
            class="w-full"
          />
        </UFormField>
        <UButton
          type="submit"
          size="xl"
          block
          :loading="looking"
          :disabled="name.trim().length < 3"
        >
          Find my invitation
        </UButton>
      </form>

      <details class="text-muted">
        <summary class="cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:ring-primary">
          Have the code from your invitation?
        </summary>
        <form class="mt-4 flex flex-col gap-4" @submit.prevent="lookup({ code })">
          <UFormField label="Invitation code">
            <UInput v-model="code" size="xl" autocomplete="off" class="w-full uppercase" />
          </UFormField>
          <UButton
            type="submit"
            size="xl"
            color="neutral"
            variant="outline"
            block
            :loading="looking"
          >
            Use code
          </UButton>
        </form>
      </details>

      <UAlert
        v-if="notFound"
        color="warning"
        variant="subtle"
        title="We couldn’t find that name"
        role="status"
      >
        <template #description>
          Try the name exactly as it’s printed on your invitation, or email
          <a :href="`mailto:${wedding.rsvp.contactEmail}`" class="underline underline-offset-4">{{
            wedding.rsvp.contactEmail
          }}</a>
          and we’ll sort it out.
        </template>
      </UAlert>
      <UAlert v-if="error" color="error" variant="subtle" :title="error" role="alert" />
    </div>

    <!-- Choose between namesakes -->
    <div v-else-if="step === 'choose'" class="mt-10 flex flex-col gap-4">
      <p class="text-lg">More than one invitation matches. Which is yours?</p>
      <UButton
        v-for="m in matches"
        :key="m.household.id"
        size="xl"
        color="neutral"
        variant="outline"
        block
        @click="open(m)"
      >
        {{
          m.household.guests
            .filter((g) => !g.isPlusOne)
            .map((g) => g.firstName)
            .join(', ')
        }}
      </UButton>
    </div>

    <!-- Answer -->
    <div v-else-if="step === 'answer' && invitation" class="mt-10">
      <p class="mb-8 text-lg">
        Welcome, <span class="text-highlighted">{{ invitation.household.label }}</span
        >.
      </p>
      <WeddingRsvpForm
        :invitation="invitation"
        :contact-email="wedding.rsvp.contactEmail"
        :time-zone="wedding.timeZone"
        @saved="onSaved"
      />
    </div>

    <!-- Done: the answers read back, so a mistake is caught here, not at the door -->
    <div v-else-if="step === 'done' && invitation" class="mt-10 flex flex-col gap-8">
      <UAlert
        v-if="invitation.household.respondedAt"
        color="success"
        variant="subtle"
        icon="i-lucide-check"
        :title="`Thank you, ${invitation.household.label}. Here’s what we have.`"
        :description="
          emailed ? 'We’ve emailed you a copy, with a link to change your answers.' : undefined
        "
        role="status"
      />
      <UAlert
        v-if="closed"
        color="neutral"
        variant="subtle"
        title="RSVPs have closed"
        :description="`To change anything, email ${wedding.rsvp.contactEmail}.`"
      />
      <div
        v-for="e in invitation.events"
        :key="e.id"
        class="border-l-2 border-primary bg-elevated px-6 py-5"
      >
        <h2 class="text-3xl text-highlighted">{{ e.name }}</h2>
        <ul class="mt-3 flex flex-col gap-1">
          <li
            v-for="g in invitation.household.guests.filter((g) => !g.isPlusOne || g.firstName)"
            :key="g.id"
            class="flex justify-between gap-4"
          >
            <span>{{ guestLabel(g) }}</span>
            <span class="text-muted">{{ answerFor(g, e.id) }}</span>
          </li>
        </ul>
      </div>
      <UButton
        v-if="invitation.household.respondedAt"
        :to="`/wedding.ics?h=${invitation.household.id}`"
        external
        size="xl"
        color="neutral"
        variant="outline"
        icon="i-lucide-calendar-plus"
        block
      >
        Add your events to your calendar
      </UButton>
      <UButton
        v-if="!closed"
        size="xl"
        color="neutral"
        variant="outline"
        block
        @click="step = 'answer'"
      >
        Change answers
      </UButton>
      <UButton to="/schedule" size="xl" variant="link">See the schedule</UButton>
    </div>
  </section>
</template>
