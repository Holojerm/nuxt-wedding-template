<script setup lang="ts">
import { addressLines } from '../../../shared/utils/wedding'
import type { HouseholdView } from '../../../shared/utils/wedding-types'

// The couple's back office: headcounts, the guest list with each household's
// personal links and QR codes, editing, reminders, bulk import, CSV export.
// Unlocked by the admin token (README.md › Admin access), never linked from
// the public pages.
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()
useSeo({
  title: `Manage · ${wedding.title}`,
  titleMode: 'exact',
  description: 'Guest list and RSVPs.',
  noindex: true,
})

interface Tally {
  eventId: string
  name: string
  invited: number
  attending: number
  declined: number
  pending: number
  meals: Record<string, number>
}
interface ManageData {
  households: HouseholdView[]
  tallies: Tally[]
  events: { id: string; name: string; isPublic: boolean }[]
  placeholders: string[]
  emailEnabled: boolean
  notifyEmails: string[]
}

const { data, error, refresh } = await useFetch<ManageData>('/api/wedding/manage/households', {
  server: false,
})
const locked = computed(() => error.value?.statusCode === 401)
const toast = useToast()
const errorMessage = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } }).data?.message ?? fallback

const token = ref('')
const signingIn = ref(false)
async function signIn() {
  signingIn.value = true
  try {
    await $fetch('/api/wedding/manage/session', {
      method: 'POST',
      body: { token: token.value.trim() },
    })
    token.value = ''
    await refresh()
  } catch {
    toast.add({ title: 'That token is not right', color: 'error' })
  } finally {
    signingIn.value = false
  }
}
async function signOut() {
  await $fetch('/api/wedding/manage/session', { method: 'DELETE' })
  await refresh()
}

const importText = ref('')
const importing = ref(false)
async function runImport() {
  importing.value = true
  try {
    const res = await $fetch<{ created: number }>('/api/wedding/manage/households', {
      method: 'POST',
      body: { text: importText.value },
    })
    importText.value = ''
    toast.add({ title: `Added ${res.created} households`, color: 'success' })
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Nothing was imported', description: errorMessage(e, ''), color: 'error' })
  } finally {
    importing.value = false
  }
}

async function remove(h: HouseholdView) {
  if (!window.confirm(`Delete ${h.label} and their answers? This cannot be undone.`)) return
  await $fetch(`/api/wedding/manage/households/${h.id}`, { method: 'DELETE' })
  await refresh()
}

// ── Personal links and QR codes ──────────────────────────────────────────
type LinkKind = 'rsvp' | 'address'
const origin = useRequestURL().origin
const personalLink = (h: HouseholdView, kind: LinkKind) => `${origin}/${kind}?code=${h.inviteCode}`
async function copyLink(h: HouseholdView, kind: LinkKind) {
  await navigator.clipboard.writeText(personalLink(h, kind))
  toast.add({
    title: `Copied ${h.label}'s ${kind === 'rsvp' ? 'RSVP' : 'address'} link`,
    color: 'success',
  })
}
const qrFor = ref<HouseholdView | null>(null)
const qrKind = ref<LinkKind>('rsvp')
const qrOpen = computed({
  get: () => qrFor.value !== null,
  set: (open) => {
    if (!open) qrFor.value = null
  },
})
const qrCode = useTemplateRef<{ download: () => void }>('qrCode')

// ── Editing ──────────────────────────────────────────────────────────────
const editing = ref<HouseholdView | null>(null)
const editOpen = computed({
  get: () => editing.value !== null,
  set: (open) => {
    if (!open) editing.value = null
  },
})
async function onEdited() {
  editing.value = null
  toast.add({ title: 'Saved', color: 'success' })
  await refresh()
}

// ── Reminders ────────────────────────────────────────────────────────────
const toRemind = computed(
  () => data.value?.households.filter((h) => !h.respondedAt && h.email).length ?? 0,
)
const reminding = ref(false)
async function remind() {
  if (!window.confirm(`Email a reminder to ${toRemind.value} households that haven’t replied?`))
    return
  reminding.value = true
  try {
    const res = await $fetch<{ sent: number; eligible: number }>('/api/wedding/manage/remind', {
      method: 'POST',
    })
    toast.add({
      title: res.sent ? `Sent ${res.sent} reminders` : 'No reminders sent',
      description:
        res.eligible > res.sent || !res.sent
          ? 'Anyone reminded in the last 24 hours was skipped.'
          : undefined,
      color: res.sent ? 'success' : 'neutral',
    })
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: errorMessage(e, 'Reminders did not send'), color: 'error' })
  } finally {
    reminding.value = false
  }
}

// ── List ─────────────────────────────────────────────────────────────────
const search = ref('')
const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  const all = data.value?.households ?? []
  if (!q) return all
  return all.filter(
    (h) =>
      h.label.toLowerCase().includes(q) ||
      h.guests.some((g) =>
        [`${g.firstName} ${g.lastName}`, ...g.aliases].some((n) => n.toLowerCase().includes(q)),
      ),
  )
})
const withAddress = computed(
  () => data.value?.households.filter((h) => h.mailingAddress).length ?? 0,
)

const guestNames = (h: HouseholdView) =>
  h.guests
    .map((g) => (g.isPlusOne && !g.firstName ? '+ guest' : `${g.firstName} ${g.lastName}`.trim()))
    .join(', ')
const shortDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
</script>

<template>
  <section class="mx-auto max-w-(--ui-container) px-4 py-16 sm:px-6">
    <WeddingLabel text="For the couple" />
    <h1 class="mt-3 text-6xl text-highlighted">Guest list</h1>

    <div v-if="!data && !error" class="mt-10 text-muted">Loading…</div>

    <form v-else-if="locked" class="mt-10 flex max-w-md flex-col gap-4" @submit.prevent="signIn">
      <UFormField label="Admin token" hint="From your password manager">
        <UInput
          v-model="token"
          type="password"
          size="xl"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>
      <UButton type="submit" size="xl" :loading="signingIn">Unlock</UButton>
    </form>

    <UAlert
      v-else-if="error"
      class="mt-10"
      color="error"
      variant="subtle"
      title="Could not load the guest list"
      role="alert"
    />

    <div v-else-if="data" class="mt-10 flex flex-col gap-12">
      <UAlert
        v-if="data.placeholders.length"
        color="warning"
        variant="subtle"
        icon="i-lucide-pencil"
        title="Still placeholder copy on the site"
      >
        <template #description>
          <ul class="list-disc pl-4">
            <li v-for="p in data.placeholders" :key="p">{{ p }}</li>
          </ul>
        </template>
      </UAlert>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="t in data.tallies"
          :key="t.eventId"
          class="border-l-2 border-primary bg-elevated px-5 py-4"
        >
          <WeddingLabel :text="t.name" />
          <p class="mt-2 text-4xl tabular-nums text-highlighted">{{ t.attending }}</p>
          <p class="text-sm text-muted">
            attending · {{ t.declined }} declined · {{ t.pending }} waiting ·
            {{ t.invited }} invited
          </p>
          <p v-if="Object.keys(t.meals).length" class="mt-2 text-sm">
            <span v-for="(n, meal) in t.meals" :key="meal" class="mr-3">{{ meal }} {{ n }}</span>
          </p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-3 bg-elevated px-5 py-4">
          <WeddingLabel text="Email" />
          <template v-if="data.emailEnabled">
            <p class="text-sm">
              Guests who leave an email get a copy of their answers.
              <template v-if="data.notifyEmails.length">
                You hear about each reply at {{ data.notifyEmails.join(', ') }}.
              </template>
              <template v-else
                >To hear about each reply, add your email to the site’s notify list.</template
              >
            </p>
            <UButton
              class="self-start"
              icon="i-lucide-send"
              :disabled="!toRemind"
              :loading="reminding"
              @click="remind"
            >
              Email a reminder ({{ toRemind }})
            </UButton>
          </template>
          <p v-else class="text-sm text-muted">
            Email isn’t set up for this site yet, so no confirmations or reminders go out.
          </p>
        </div>
        <div class="flex flex-col gap-3 bg-elevated px-5 py-4">
          <WeddingLabel text="Printing" />
          <p class="text-sm">
            {{ withAddress }} of {{ data.households.length }} households have sent a mailing
            address. Print a QR sheet to tuck into each envelope, or address labels (Avery 5160) for
            the envelopes themselves.
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              to="/qr-sheet?link=address"
              color="neutral"
              variant="outline"
              icon="i-lucide-qr-code"
            >
              Address QR sheet
            </UButton>
            <UButton
              to="/qr-sheet?link=rsvp"
              color="neutral"
              variant="outline"
              icon="i-lucide-qr-code"
            >
              RSVP QR sheet
            </UButton>
            <UButton to="/labels" color="neutral" variant="outline" icon="i-lucide-tags">
              Address labels
            </UButton>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-4xl text-highlighted">Households ({{ data.households.length }})</h2>
          <div class="flex gap-2">
            <UButton
              to="/api/wedding/manage/export"
              external
              color="neutral"
              variant="outline"
              icon="i-lucide-download"
            >
              Export CSV
            </UButton>
            <UButton color="neutral" variant="ghost" @click="signOut">Lock</UButton>
          </div>
        </div>
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search names"
          aria-label="Search names"
        />
        <ul class="flex flex-col divide-y divide-(--ui-border-muted)">
          <li
            v-for="h in visible"
            :key="h.id"
            class="flex flex-wrap items-start justify-between gap-3 py-4"
          >
            <div class="min-w-0">
              <p class="text-highlighted">
                {{ h.label }}
                <UBadge v-if="h.respondedAt" color="success" variant="subtle" class="ml-2"
                  >Replied</UBadge
                >
                <UBadge v-else color="neutral" variant="subtle" class="ml-2">Waiting</UBadge>
                <UBadge
                  v-if="h.remindedAt && !h.respondedAt"
                  color="neutral"
                  variant="outline"
                  class="ml-1"
                >
                  Reminded {{ shortDate(h.remindedAt) }}
                </UBadge>
              </p>
              <p class="text-sm text-muted">{{ guestNames(h) }}</p>
              <p class="text-sm text-muted">
                Code <span class="font-mono">{{ h.inviteCode }}</span>
                <template v-if="h.invitedEventIds.length">
                  · also {{ h.invitedEventIds.join(', ') }}</template
                >
                <template v-if="h.email"> · {{ h.email }}</template>
              </p>
              <p class="text-sm text-muted">
                <template v-if="h.mailingAddress">{{
                  addressLines(h.mailingAddress).join(', ')
                }}</template>
                <template v-else>No mailing address yet</template>
              </p>
              <p v-if="h.message" class="mt-1 text-sm italic">“{{ h.message }}”</p>
              <p v-if="h.songRequest" class="text-sm">Song: {{ h.songRequest }}</p>
            </div>
            <div class="flex gap-1">
              <UButton
                icon="i-lucide-link"
                color="neutral"
                variant="ghost"
                class="min-touch"
                :aria-label="`Copy ${h.label}'s RSVP link`"
                @click="copyLink(h, 'rsvp')"
              />
              <UButton
                icon="i-lucide-qr-code"
                color="neutral"
                variant="ghost"
                class="min-touch"
                :aria-label="`Show ${h.label}'s QR codes`"
                @click="qrFor = h"
              />
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                class="min-touch"
                :aria-label="`Edit ${h.label}`"
                @click="editing = h"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                class="min-touch"
                :aria-label="`Delete ${h.label}`"
                @click="remove(h)"
              />
            </div>
          </li>
        </ul>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="runImport">
        <h2 class="text-4xl text-highlighted">Add guests</h2>
        <p class="text-muted">
          One household per line:
          <span class="font-mono text-sm"
            >Label | Guest One; Guest Two; + guest | email | event-ids</span
          >. Only the first two parts are required. Add other names the RSVP lookup should accept
          with <span class="font-mono text-sm">=</span>, like
          <span class="font-mono text-sm">Robert Smith = Bob Smith</span>. Private events:
          <span class="font-mono text-sm">{{
            data.events
              .filter((e) => !e.isPublic)
              .map((e) => e.id)
              .join(', ') || 'none'
          }}</span
          >.
        </p>
        <UTextarea
          v-model="importText"
          :rows="6"
          class="w-full font-mono"
          aria-label="Households to add"
          placeholder="The Okafor Family | Ada Okafor; Chidi Okafor | ada@example.com | brunch&#10;Sam Lee | Sam Lee = Samuel Lee; + guest"
        />
        <UButton
          type="submit"
          :loading="importing"
          :disabled="!importText.trim()"
          class="self-start"
        >
          Add households
        </UButton>
      </form>
    </div>

    <UModal
      v-model:open="qrOpen"
      :title="qrFor ? `${qrFor.label}` : 'QR code'"
      description="Scan with a phone camera."
    >
      <template #body>
        <div v-if="qrFor" class="flex flex-col gap-4">
          <UTabs
            v-model="qrKind"
            :items="[
              { label: 'RSVP', value: 'rsvp' },
              { label: 'Address', value: 'address' },
            ]"
            :content="false"
          />
          <div class="mx-auto w-64">
            <WeddingQrCode
              ref="qrCode"
              :value="personalLink(qrFor, qrKind)"
              :label="`${qrFor.label} ${qrKind}`"
            />
          </div>
          <p class="break-all text-center font-mono text-sm text-muted">
            {{ personalLink(qrFor, qrKind) }}
          </p>
          <div class="flex justify-center gap-2">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-copy"
              @click="copyLink(qrFor, qrKind)"
            >
              Copy link
            </UButton>
            <UButton icon="i-lucide-download" @click="qrCode?.download()">Download SVG</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="editOpen" :title="editing ? `Edit ${editing.label}` : 'Edit'">
      <template #body>
        <WeddingHouseholdEditor
          v-if="editing && data"
          :household="editing"
          :events="data.events"
          @saved="onEdited"
          @cancel="editing = null"
        />
      </template>
    </UModal>
  </section>
</template>
