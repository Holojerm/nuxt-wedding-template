import type { WeddingConfig } from '../shared/utils/wedding-types'

// The sample wedding: a fictional couple at a real, public venue. Copy this
// file to start your own, then delete it. Anything you list in `placeholders`
// shows on /manage and puts a "draft" ribbon on the public pages until the
// list is empty.
export const mayatheo: WeddingConfig = {
  slug: 'mayatheo',
  // Every hostname that should serve this wedding: your custom domain, and the
  // workers.dev address if you use it. The second entry is the public demo.
  hosts: ['mayatheo.example.com', 'nuxt-wedding-template.jeremy-ettlinger.workers.dev'],
  couple: { first: 'Maya', second: 'Theo' },
  title: 'Maya & Theo',
  theme: 'letterpress',
  date: '2027-06-12',
  timeZone: 'America/New_York',
  city: 'Pittsburgh',
  venue: {
    name: 'Phipps Conservatory',
    address: '1 Schenley Drive, Pittsburgh, PA 15213',
    mapsUrl: 'https://maps.google.com/?q=Phipps+Conservatory,+1+Schenley+Drive,+Pittsburgh',
    url: 'https://www.phipps.conservatory.org',
  },
  tagline: 'Request the pleasure of your company under glass, at the edge of Schenley Park.',
  story: [
    'Maya and Theo met in a community garden plot neither of them was any good at keeping. Seven summers and one surviving fig tree later, Theo proposed on the bench beside it.',
    'This is where the long version goes: how you met, the first apartment, the proposal. Two or three short paragraphs read best on a phone.',
  ],
  events: [
    {
      id: 'welcome',
      name: 'Welcome drinks',
      startsAt: '2027-06-11T19:00:00-04:00',
      endsAt: '2027-06-11T22:00:00-04:00',
      venue: 'The Porch at Schenley',
      address: '221 Schenley Drive, Pittsburgh',
      dress: 'Come as you are',
      description: 'An easy evening for everyone in town early.',
      isPublic: true,
    },
    {
      id: 'ceremony',
      name: 'Ceremony',
      startsAt: '2027-06-12T17:30:00-04:00',
      endsAt: '2027-06-12T18:00:00-04:00',
      venue: 'Phipps Conservatory, Broderie Room',
      address: '1 Schenley Drive, Pittsburgh',
      dress: 'Garden formal',
      description: 'Please arrive by 5:00 pm. The ceremony starts on time.',
      isPublic: true,
    },
    {
      id: 'reception',
      name: 'Dinner & dancing',
      startsAt: '2027-06-12T18:00:00-04:00',
      endsAt: '2027-06-12T23:00:00-04:00',
      venue: 'Phipps Conservatory, Palm Court',
      address: '1 Schenley Drive, Pittsburgh',
      dress: 'Garden formal',
      description: 'Cocktails among the palms, then dinner and dancing.',
      meals: ['Beef', 'Fish', 'Vegetarian'],
      isPublic: true,
    },
    {
      id: 'brunch',
      name: 'Farewell brunch',
      startsAt: '2027-06-13T10:30:00-04:00',
      endsAt: '2027-06-13T13:00:00-04:00',
      venue: 'To be announced',
      address: 'Oakland, Pittsburgh',
      description: 'One more round of coffee before everyone heads home.',
      // A private event: only households invited to it on /manage ever see it.
      isPublic: false,
    },
  ],
  travel: {
    intro:
      'The conservatory sits at the entrance to Schenley Park in Oakland, about fifteen minutes from downtown. Leave extra time on a Saturday evening.',
    hotels: [
      {
        name: 'The Oaklander Hotel',
        address: '5130 Bigelow Boulevard',
        note: 'Closest to the conservatory, about a 15-minute walk.',
      },
      {
        name: 'Kimpton Hotel Monaco',
        address: '620 William Penn Place',
        note: 'Downtown, fifteen minutes by car.',
      },
    ],
    gettingThere: [
      'Bus: the 61 and 71 lines run from downtown to Forbes Avenue in Oakland, a 10-minute walk away.',
      'Car: there is metered parking along Schenley Drive. A cab or car service is easiest on the night.',
      'Airport: Pittsburgh International is about 35 minutes by car.',
    ],
  },
  registry: {
    intro: 'Your presence is the gift. For those who have asked, registry links will appear here.',
    links: [],
  },
  faq: [
    {
      q: 'What should I wear?',
      a: 'Garden formal: a suit or a dress you can dance in. The glasshouse stays warm, and the paths are brick, so mind your heels.',
    },
    {
      q: 'Can I bring a guest?',
      a: 'Your invitation lists everyone it includes. If it says "and guest", you can add their name when you RSVP.',
    },
    {
      q: 'Are children invited?',
      a: 'We love your kids, and this is an adults-only evening, except for children named on the invitation.',
    },
    {
      q: 'Is the venue accessible?',
      a: 'Yes. Every room is step-free. Tell us on your RSVP if you need anything else.',
    },
    {
      q: 'Can I take photos?',
      a: 'Please keep phones away during the ceremony. After that, take all the pictures you like.',
    },
    {
      q: 'When do I need to RSVP by?',
      a: 'By the date on the RSVP page. You can change your answer any time before then.',
    },
  ],
  // Freely licensed photographs from Wikimedia Commons, scaled down. Each
  // license requires the credit the plate prints. Replace them with your own.
  photos: [
    {
      src: '/weddings/mayatheo/broderie.jpg',
      width: 1920,
      height: 1282,
      alt: 'A formal knot garden of clipped hedges and red flowers under a curved glass roof, ringed by trellis',
      caption: 'The Broderie Room, a parterre garden under glass, where the ceremony will be.',
      credit: {
        author: 'Dllu',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Phipps_Conservatory_Parterre_de_Broderie.jpg',
        note: 'scaled down',
      },
    },
    {
      src: '/weddings/mayatheo/palm-court.jpg',
      width: 1920,
      height: 1282,
      alt: 'Tall palms rising to a glass roof at dusk, around a planted bed with a harp at its center',
      caption: 'The Palm Court, the oldest room in the glasshouse of 1893.',
      credit: {
        author: 'Dllu',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Phipps_Conservatory_winter_2015_Palm_Court.jpg',
        note: 'scaled down',
      },
    },
    {
      src: '/weddings/mayatheo/sunken-garden.jpg',
      width: 1920,
      height: 1272,
      alt: 'A round brick planter of yellow flowers around a stone fountain, under a long arched glass roof',
      caption: 'The Sunken Garden, a few steps down from the Palm Court.',
      credit: {
        author: 'Dllu',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Phipps_Conservatory_Sunken_Garden_fall_2015.jpg',
        note: 'scaled down',
      },
    },
  ],
  guide: {
    intro:
      'Oakland is Pittsburgh’s museum and university district. If you’re in town for the weekend, these are all within a walk or a short ride.',
    sections: [
      {
        title: 'Next door',
        items: [
          {
            name: 'Schenley Park',
            note: 'Four hundred acres of trails and overlooks that start at the conservatory’s back door.',
          },
          {
            name: 'Schenley Plaza',
            note: 'A lawn, a carousel and food stands, five minutes’ walk toward Forbes Avenue.',
            address: '4100 Forbes Avenue',
          },
        ],
      },
      {
        title: 'Museums',
        items: [
          {
            name: 'Carnegie Museums of Art and Natural History',
            note: 'Two museums under one roof. Plan on a whole morning.',
            address: '4400 Forbes Avenue',
            url: 'https://carnegiemuseums.org',
          },
          {
            name: 'Cathedral of Learning',
            note: 'A 42-story Gothic tower. The Nationality Rooms on the first floor are worth the detour.',
            address: '4200 Fifth Avenue',
          },
        ],
      },
    ],
  },
  rsvp: {
    deadline: '2027-04-30',
    contactEmail: 'hello@mayatheo.example.com',
    notifyEmails: [],
  },
  // Empty keeps /manage locked. README.md › Admin access creates a token.
  adminTokenSha256: '',
  placeholders: [],
}
