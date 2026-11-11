<script setup lang="ts">
import type { InvitationView } from '../../../shared/utils/wedding-types'

// One form for the whole party: each person answers each event they are
// invited to with two big buttons, then a meal if the event serves one.
// Built for a grandparent on a phone first. research.md › Key takeaways 3, 7.
const props = defineProps<{ invitation: InvitationView; contactEmail: string; timeZone: string }>()
const emit = defineEmits<{ saved: [InvitationView & { emailed?: boolean }] }>()

interface GuestDraft {
  id: string
  isPlusOne: boolean
  firstName: string
  lastName: string
  dietary: string
  events: Record<string, { attending: boolean | null; meal: string | undefined }>
}

const drafts = ref<GuestDraft[]>(
  props.invitation.household.guests.map((g) => ({
    id: g.id,
    isPlusOne: g.isPlusOne,
    firstName: g.firstName,
    lastName: g.lastName,
    dietary: g.dietary ?? '',
    events: Object.fromEntries(
      props.invitation.events.map((e) => [
        e.id,
        {
          attending: g.responses[e.id]?.attending ?? null,
          meal: g.responses[e.id]?.meal ?? undefined,
        },
      ]),
    ),
  })),
)
const email = ref(props.invitation.household.email ?? '')
const message = ref(props.invitation.household.message ?? '')
const songRequest = ref(props.invitation.household.songRequest ?? '')
const saving = ref(false)
const error = ref<string | null>(null)

const guestName = (g: GuestDraft) =>
  g.isPlusOne ? 'Your guest' : [g.firstName, g.lastName].filter(Boolean).join(' ')

/** Every question answered, in the order a guest would fix them. */
function firstProblem(): string | null {
  for (const g of drafts.value) {
    for (const e of props.invitation.events) {
      const answer = g.events[e.id]
      // An unnamed plus-one slot nobody is bringing can stay unanswered.
      if (g.isPlusOne && !g.firstName.trim() && answer?.attending !== true) continue
      if (answer?.attending === null || answer?.attending === undefined) {
        return `Please answer ${e.name} for ${guestName(g)}.`
      }
      if (answer.attending && e.meals?.length && !answer.meal) {
        return `Please choose a meal for ${guestName(g)} at ${e.name}.`
      }
    }
    if (g.isPlusOne && Object.values(g.events).some((a) => a.attending) && !g.firstName.trim()) {
      return 'Please tell us your guest’s name.'
    }
  }
  return null
}

async function submit() {
  error.value = firstProblem()
  if (error.value) return
  saving.value = true
  try {
    const saved = await $fetch<InvitationView & { emailed?: boolean }>('/api/wedding/rsvp', {
      method: 'POST',
      body: {
        householdId: props.invitation.household.id,
        email: email.value.trim(),
        message: message.value,
        songRequest: songRequest.value,
        guests: drafts.value.map((g) => ({
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          dietary: g.dietary,
          events: Object.entries(g.events)
            .filter(([, a]) => a.attending !== null)
            .map(([eventId, a]) => ({
              eventId,
              attending: a.attending === true,
              meal: a.meal ?? null,
            })),
        })),
      },
    })
    emit('saved', saved)
  } catch (e: unknown) {
    const data = (e as { data?: { message?: string } }).data
    error.value =
      data?.message ?? `Something went wrong. Try again, or email ${props.contactEmail}.`
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-10" novalidate @submit.prevent="submit">
    <fieldset
      v-for="g in drafts"
      :key="g.id"
      class="flex flex-col gap-6 border-t border-default pt-8"
    >
      <legend class="wedding-display text-4xl text-highlighted">
        {{ g.isPlusOne ? 'Bringing a guest?' : guestName(g) }}
      </legend>

      <div v-if="g.isPlusOne" class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Guest’s first name">
          <UInput v-model="g.firstName" size="xl" autocomplete="off" class="w-full" />
        </UFormField>
        <UFormField label="Guest’s last name">
          <UInput v-model="g.lastName" size="xl" autocomplete="off" class="w-full" />
        </UFormField>
      </div>

      <div v-for="e in invitation.events" :key="e.id" class="flex flex-col gap-3">
        <p :id="`q-${g.id}-${e.id}`" class="text-lg text-highlighted">
          {{ e.name }}
          <span class="block text-sm text-muted">
            {{ formatEventDay(e.startsAt, timeZone) }} · {{ e.venue }}
          </span>
        </p>
        <div role="group" :aria-labelledby="`q-${g.id}-${e.id}`" class="grid grid-cols-2 gap-3">
          <UButton
            size="xl"
            block
            :variant="g.events[e.id]?.attending === true ? 'solid' : 'outline'"
            :aria-pressed="g.events[e.id]?.attending === true"
            icon="i-lucide-check"
            @click="g.events[e.id]!.attending = true"
          >
            Joyfully accepts
          </UButton>
          <UButton
            size="xl"
            block
            color="neutral"
            :variant="g.events[e.id]?.attending === false ? 'solid' : 'outline'"
            :aria-pressed="g.events[e.id]?.attending === false"
            icon="i-lucide-x"
            @click="g.events[e.id]!.attending = false"
          >
            Regretfully declines
          </UButton>
        </div>
        <UFormField
          v-if="e.meals?.length && g.events[e.id]?.attending"
          :label="`Meal at ${e.name}`"
        >
          <URadioGroup v-model="g.events[e.id]!.meal" :items="e.meals" variant="table" size="xl" />
        </UFormField>
      </div>

      <UFormField label="Allergies or dietary needs" hint="Optional">
        <UInput v-model="g.dietary" size="xl" class="w-full" />
      </UFormField>
    </fieldset>

    <fieldset class="flex flex-col gap-6 border-t border-default pt-8">
      <legend class="wedding-display text-4xl text-highlighted">Anything else</legend>
      <UFormField label="Email" hint="Optional: we’ll send you a copy of your answers">
        <UInput v-model="email" type="email" size="xl" autocomplete="email" class="w-full" />
      </UFormField>
      <UFormField label="A note for the couple" hint="Optional">
        <UTextarea v-model="message" :rows="3" size="xl" class="w-full" />
      </UFormField>
      <UFormField label="A song that will get you dancing" hint="Optional">
        <UInput v-model="songRequest" size="xl" class="w-full" />
      </UFormField>
    </fieldset>

    <UAlert v-if="error" color="error" variant="subtle" :title="error" role="alert" />

    <UButton type="submit" size="xl" block :loading="saving">Send RSVP</UButton>
  </form>
</template>
