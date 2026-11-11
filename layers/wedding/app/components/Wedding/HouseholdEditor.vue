<script setup lang="ts">
import { splitName } from '../../../shared/utils/wedding'
import type { HouseholdView } from '../../../shared/utils/wedding-types'

// Edits one household in place on /manage: how it's addressed, its email,
// which private events it's invited to, and its guests (names, aliases,
// plus-one slots). Removing a guest removes their answers too.
const props = defineProps<{
  household: HouseholdView
  events: { id: string; name: string; isPublic: boolean }[]
}>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

interface GuestDraft {
  id?: string
  name: string
  isPlusOne: boolean
  aliases: string
}

const label = ref(props.household.label)
const email = ref(props.household.email ?? '')
const invited = ref<string[]>([...props.household.invitedEventIds])
const guests = ref<GuestDraft[]>(
  props.household.guests.map((g) => ({
    id: g.id,
    name: [g.firstName, g.lastName].filter(Boolean).join(' '),
    isPlusOne: g.isPlusOne,
    aliases: g.aliases.join(', '),
  })),
)
const privateEvents = computed(() => props.events.filter((e) => !e.isPublic))
const saving = ref(false)
const problem = ref<string | null>(null)

function addGuest(isPlusOne: boolean) {
  guests.value.push({ name: '', isPlusOne, aliases: '' })
}

async function save() {
  problem.value = null
  saving.value = true
  try {
    await $fetch(`/api/wedding/manage/households/${props.household.id}`, {
      method: 'PATCH',
      body: {
        label: label.value,
        email: email.value.trim() || null,
        invitedEventIds: invited.value,
        guests: guests.value
          .filter((g) => g.isPlusOne || g.name.trim())
          .map((g) => ({
            ...(g.id ? { id: g.id } : {}),
            ...(() => {
              const { first, last } = splitName(g.name)
              return { firstName: first, lastName: last }
            })(),
            isPlusOne: g.isPlusOne,
            aliases: g.aliases
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean),
          })),
      },
    })
    emit('saved')
  } catch (e: unknown) {
    problem.value = (e as { data?: { message?: string } }).data?.message ?? 'That didn’t save.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-5" @submit.prevent="save">
    <UFormField label="Addressed as">
      <UInput v-model="label" class="w-full" />
    </UFormField>
    <UFormField label="Email" hint="For confirmations and reminders">
      <UInput v-model="email" type="email" class="w-full" />
    </UFormField>
    <UFormField v-if="privateEvents.length" label="Also invited to">
      <UCheckboxGroup
        v-model="invited"
        :items="privateEvents.map((e) => ({ label: e.name, value: e.id }))"
      />
    </UFormField>

    <fieldset class="flex flex-col gap-4">
      <legend class="mb-2 text-sm text-highlighted">Guests</legend>
      <div
        v-for="(g, i) in guests"
        :key="g.id ?? `new-${i}`"
        class="flex flex-col gap-2 border-l-2 border-muted pl-3"
      >
        <div class="flex items-end gap-2">
          <UFormField
            :label="g.isPlusOne ? 'Plus-one (blank until they RSVP)' : 'Full name'"
            class="flex-1"
          >
            <UInput v-model="g.name" class="w-full" />
          </UFormField>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            class="min-touch"
            :aria-label="`Remove ${g.name || 'this guest'}`"
            @click="guests.splice(i, 1)"
          />
        </div>
        <UFormField
          v-if="!g.isPlusOne"
          label="Also finds them"
          hint="Nicknames, maiden names; comma-separated"
        >
          <UInput v-model="g.aliases" placeholder="e.g. Bob Smith" class="w-full" />
        </UFormField>
      </div>
      <div class="flex gap-2">
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-plus"
          @click="addGuest(false)"
        >
          Guest
        </UButton>
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-plus"
          @click="addGuest(true)"
        >
          Plus-one
        </UButton>
      </div>
    </fieldset>

    <UAlert v-if="problem" color="error" variant="subtle" :title="problem" role="alert" />
    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="ghost" @click="emit('cancel')">Cancel</UButton>
      <UButton type="submit" :loading="saving">Save</UButton>
    </div>
  </form>
</template>
