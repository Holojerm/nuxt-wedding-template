<script setup lang="ts">
import { EMPTY_ADDRESS } from '../../../shared/utils/wedding'
import type { InvitationView, MailingAddress } from '../../../shared/utils/wedding-types'

// Save-the-date address collection. The couple sends each household its
// personal link (`/address?code=XXXXXX`); a guest without one can find
// themselves by name. Never linked from the public nav.
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()
useSeo({
  title: `Your address · ${wedding.title}`,
  titleMode: 'exact',
  description: `Send ${wedding.title} your mailing address for the invitation.`,
  noindex: true,
})

const step = ref<'find' | 'form' | 'done'>('find')
const name = ref('')
const looking = ref(false)
const problem = ref<string | null>(null)
const invitation = ref<InvitationView | null>(null)
const address = reactive<MailingAddress>({ ...EMPTY_ADDRESS, country: 'United States' })
const email = ref('')
const saving = ref(false)

async function lookup(body: { name: string } | { code: string }) {
  looking.value = true
  problem.value = null
  try {
    const res = await $fetch<{ invitations: InvitationView[] }>('/api/wedding/lookup', {
      method: 'POST',
      body,
    })
    // Two namesakes: ask them to use their link rather than guess.
    if (res.invitations.length !== 1) {
      problem.value =
        res.invitations.length === 0
          ? 'We couldn’t find that name. Try it exactly as the couple would write it.'
          : 'More than one guest has that name. Please use the link the couple sent you.'
      return
    }
    invitation.value = res.invitations[0]!
    Object.assign(address, invitation.value.household.mailingAddress ?? {})
    step.value = 'form'
  } catch {
    problem.value = 'Something went wrong. Please try again.'
  } finally {
    looking.value = false
  }
}

const route = useRoute()
onMounted(() => {
  const code = route.query.code
  if (typeof code === 'string' && code) void lookup({ code })
})

async function save() {
  if (!invitation.value) return
  if (!address.line1.trim() || !address.city.trim()) {
    problem.value = 'Please fill in the street address and city.'
    return
  }
  saving.value = true
  problem.value = null
  try {
    await $fetch('/api/wedding/address', {
      method: 'POST',
      body: { householdId: invitation.value.household.id, address, email: email.value.trim() },
    })
    step.value = 'done'
  } catch {
    problem.value = `That didn’t save. Please try again, or email ${wedding.rsvp.contactEmail}.`
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <WeddingLabel text="Save the date" />
    <h1 class="mt-3 text-6xl text-highlighted">Your address</h1>
    <p class="mt-4 text-lg text-toned">
      Tell us where to send your invitation{{
        wedding.date ? ` for ${formatPlainDate(wedding.date)}` : ''
      }}.
    </p>

    <form
      v-if="step === 'find'"
      class="mt-10 flex flex-col gap-4"
      @submit.prevent="lookup({ name })"
    >
      <UFormField label="Your full name">
        <UInput v-model="name" size="xl" autocomplete="name" class="w-full" />
      </UFormField>
      <UButton type="submit" size="xl" block :loading="looking" :disabled="name.trim().length < 3">
        Continue
      </UButton>
    </form>

    <form
      v-else-if="step === 'form' && invitation"
      class="mt-10 flex flex-col gap-4"
      @submit.prevent="save"
    >
      <p class="text-lg">
        For <span class="text-highlighted">{{ invitation.household.label }}</span>
      </p>
      <UFormField label="Street address">
        <UInput v-model="address.line1" size="xl" autocomplete="address-line1" class="w-full" />
      </UFormField>
      <UFormField label="Apartment, suite, etc." hint="Optional">
        <UInput v-model="address.line2" size="xl" autocomplete="address-line2" class="w-full" />
      </UFormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="City">
          <UInput v-model="address.city" size="xl" autocomplete="address-level2" class="w-full" />
        </UFormField>
        <UFormField label="State or region">
          <UInput v-model="address.region" size="xl" autocomplete="address-level1" class="w-full" />
        </UFormField>
        <UFormField label="ZIP or postal code">
          <UInput
            v-model="address.postalCode"
            size="xl"
            autocomplete="postal-code"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Country">
          <UInput v-model="address.country" size="xl" autocomplete="country-name" class="w-full" />
        </UFormField>
      </div>
      <UFormField label="Email" hint="Optional, for updates from the couple">
        <UInput v-model="email" type="email" size="xl" autocomplete="email" class="w-full" />
      </UFormField>
      <UButton type="submit" size="xl" block :loading="saving">Save address</UButton>
    </form>

    <UAlert
      v-else-if="step === 'done'"
      class="mt-10"
      color="success"
      variant="subtle"
      icon="i-lucide-check"
      title="Thank you. Watch your mailbox."
      role="status"
    />

    <UAlert
      v-if="problem"
      class="mt-6"
      color="warning"
      variant="subtle"
      :title="problem"
      role="alert"
    />
  </section>
</template>
