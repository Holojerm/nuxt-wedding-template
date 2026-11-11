# Wedding site research

Inputs for the engine and its two themes. Researched 2026-11-03. URLs below were fetched or returned
HTTP 200 on that date unless marked otherwise. Vendor-authored comparisons are flagged; treat
their rankings as marketing.

## Key takeaways

1. **Skip the lookup when you can.** Print a personal link or QR code on each invitation
   that opens straight into that household's RSVP. Name search is the fallback, and a typed
   code comes last, since older guests lose codes. WedSites offers all three modes.
2. **Name lookup has to forgive typos.** Zola and Joy both make guests type their name exactly
   as the couple stored it, and that is the most common complaint in forums. Store aliases
   (Bob/Robert, maiden names), ignore case and accents, accept a last name plus a pick-list, and
   always show a "Can't find your name? Text/email us" link.
3. **One person RSVPs for the whole household.** Each person still answers for each event, picks
   their own meal and adds their own dietary notes. Count attendance from those per-person
   records, not from submissions. Minted's party-size dropdown, which lost names and duplicated
   guests, shows what goes wrong otherwise.
4. **Show guests only the events they're invited to.** Joy and Zola hide private events (the
   rehearsal dinner, for example) from guests who aren't on that event's list. Any event that
   needs no reply is still listed, marked "no RSVP needed".
5. **Make answers editable without accounts.** Joy asks for an optional account before a guest can
   change an answer, which is a barrier. Instead, email a confirmation that summarizes every
   answer and includes a magic edit link that works until the deadline.
6. **Set a real deadline that actually closes the form.** WedSites' deadline only drives reminders
   and doesn't close the form. Use 3–4 weeks out (6–8 for destination weddings), close the form
   gently with a contact path, and let the admin extend it.
7. **Design the RSVP form for older guests first.** That means 18px+ body text, 44–48px tap
   targets, large Yes/No buttons instead of small radios, visible labels (not an asterisk alone),
   a review step before submit, and plain-language error messages (W3C WAI-AGE).
8. **Answer the logistics questions on the home page.** Date, venue, dress code, hotel link and
   the RSVP button should all sit above the fold. Missing dress code and transit info are the
   most-cited guest complaints. Give a named dress code plus a few example images
   (greylynandryan.com uses inspiration tiles).
9. **No ads, no upsells, no third-party sign-in.** These are the biggest weaknesses of the free
   platforms: vendor ads and messy exports on The Knot, a stationery upsell on Minted, a registry
   pitch on Zola. Riley & Grey charges $39/mo largely because it is ad-free.
10. **Lean editorial, not template.** Every standout site pairs a strong serif display face with a
    plain sans for details, has one confident hero, and writes in a distinct voice. The detail
    pages stay plain and scannable even when the home page is playful.
11. **Design from the real building.** Find out what the venue actually is before borrowing
    from it (a neo-Georgian brick museum is not Beaux-Arts), then take its materials and rooms:
    the brick, the marble, the staircase, the garden outside the doors.
12. **Borrow the museum wall label.** Its tombstone format (title / maker / date / medium /
    credit line) maps neatly onto event cards: name / place / time / dress code / note. Number
    sections like catalogue plates and give photos accession-style captions. Keep it as a light
    garnish so the information stays plain.

---

## 1. Platforms

| Name | URL | Strengths | Weaknesses | Steal this |
|---|---|---|---|---|
| Joy | https://withjoy.com | BRIDES 2025 "Best Experience" (per Joy's press release). Free. Multi-event RSVP with guest tags; each guest sees only their events and questions. Name search that ignores case, with a "Try again" retry. No account needed to RSVP in the browser. CSS editing. | Exact-name matching. Changing an answer needs an optional account, and the app requires one. Premium designs are paid. Many options can feel crowded. | Per-event visibility by tag. "No reply needed" events on the same schedule. A "Contact the couple" escape hatch when a name isn't found. |
| Zola | https://www.zola.com/wedding-planning/website | Free and all-in-one (registry, guest list, site). No guest account. Only invited guests can RSVP. Multi-event, with seating synced from RSVPs. Clean CSV export. | Registry-first, so outside registries are awkward. Strict letter-for-letter name match (forum reports). Seating charts and texting are paid add-ons. | Invite-only RSVP mode. Collect allergies and shuttle needs inside the RSVP. Reminders. |
| The Knot | https://www.theknot.com/content/best-wedding-websites | Free. Quick setup. Bundles checklist and budget tools. Per-event guest details. Option to show who else is attending. | Ad-supported vendor ecosystem. Templates rank below Joy and Zola. CSV mixes in registry and vendor contacts. Limited customization in the app. The FTC complaint (Grassley, Oct 2025) concerns vendor ads, not guests. | Little. A useful counter-example. |
| Minted | https://www.minted.com/ido | Strongest free design: independent-artist templates that match its printed suites. Multi-event RSVP. No guest account. Free CSV export. | Weak household model (party-size dropdown leaves plus-ones nameless, duplicate guests). No good per-person meal choice. Pushes stationery purchases. | Matching print and web as one identity system. Its "Museum" invitation line and Met collaboration show the museum aesthetic sells. |
| Riley & Grey | https://www.rileygrey.com | Most design-led platform, with a curated set of high-end templates (Aesthete, Signature, Vert…). No ads. Guests find the site by name, email and/or password. Advanced Mode controls each guest's events and what they see. Custom questions. | $39/mo or $299/yr. Customization is limited by design. Meal choice is only a custom question. | Restraint: a few curated layouts, not a builder. Combine guest-list matching, a password and search-engine hiding for privacy. |
| Paperless Post | https://www.paperlesspost.com/blog/best-wedding-websites/ | Invitation and site in one. Tracks opens and RSVPs. Reminders to people who haven't opened or replied. The deadline auto-closes the RSVP window. Password-protected custom URL. | Pays per message with "coins", and advanced features cost extra. Built invitation-first, so the site is block-based. | Reminders aimed at people who haven't opened or replied. A deadline that closes the form on its own. |
| Squarespace | https://www.squarespace.com/templates/browse/topic/weddings | Best raw design control. Most of the strong couple sites below use it. | No free plan (~$16–19/mo). RSVP is a generic form sent to email or Sheets: no guest list, households or events. | Layouts and typography, not RSVP. |
| Wix | https://www.wix.com/website/templates/html/events/weddings | Many templates, drag-and-drop, an "Editorial Wedding" template. | Free plan shows Wix branding. Wedding features (RSVP, guestbook) are hard to find. | Nothing specific. |
| Appy Couple | https://www.appycouple.com | Native guest app plus a synced website. Push notifications for day-of updates. One-time fee (~$29–49, per a competitor). | Guests must download an app, which is wrong for older guests. Reported glitches. No multi-language support. The builder is awkward on mobile. | Day-of push-style updates. Do this as SMS or email from our own site instead. |
| Greenvelope | https://www.greenvelope.com | Digital invitations with RSVP tracking, survey questions, meal selection and reminders to guest subsets. Very high Trustpilot volume. | Invitation-first with a thin site. A reviewer had to move the deadline just to edit guests' answers. Mobile app lacks features. | Reminders to segments ("hasn't answered the ceremony"). |
| Basic Invite | (bot-blocked; not verified) | Stationery company with a site add-on. | Not verified. | — |
| WedSites | https://www.wedsites.com | Wedding-specific. Lookup by name, by email or by personal link only. Restrict RSVPs to the A-list or B-list. Household-level plus-ones and kids. Configurable close action. | Small company. Free tier is branded. The deadline doesn't close the form. | Three lookup modes. Personal links that skip lookup. A closed-RSVP redirect target. |
| Carrd | https://carrd.co | Cheap, fast, lovely one-page sites. | No RSVP model. Native forms are capped (per a third party), and RSVP needs an embed. | The one-page format for a save-the-date. |
| AI builders (Lovable, Framer) | e.g. https://ourgreekwedding2027.com (Lovable) | The 2025–26 newcomer category. Couples build custom sites with working RSVP. Framer templates offer multi-step RSVP and image-reveal motion. | Quality varies, and AI templates fall back on the same Playfair, Cormorant and cream look. | Multi-step RSVP (one question per screen) works well on phones. |

## 2. Standout couple sites and galleries

| Name | URL | Strengths | Weaknesses | Steal this |
|---|---|---|---|---|
| Greylyn & Ryan (Squarespace) | https://www.greylynandryan.com | Monogram, names stacked around an ampersand, letterspaced "R S V P", cream and olive palette with serifs. Dress code shown as image tiles (Ladies / Gentlemen). Three named contacts with phone numbers. | Travel is only a link on the home page. A leftover cart icon. | Dress-code inspiration tiles. Named humans to call. RSVP repeated in the nav, mid-page and footer. |
| Tong & Evan (Squarespace) | https://www.evandavidlin.com | One identical card per event: icon, name, **bold time**, VENUE in caps with a location hint, dress code. A single primary RSVP button. Accordion Activities page. | Generic hero. Cart icon. | **The event-card format.** Dress code on every event. Location hints like "by the lobby". |
| Jeremy & Madeline (Squarespace) | https://www.jeremyandmadeline.com | A summer-camp theme carried through the type, wording and layout. Segmented three-day itinerary. A prominent adults-only policy. | Theme over clarity in places. | Commit to one theme everywhere. State sensitive policies (kids, plus-ones) up front. |
| Sarah & Matt (Squarespace) | https://www.simonianwedding.com | Hero video, Polaroid-style photos, hand sketches, micro-animations. | Heavier page. | Restrained micro-motion and a personal illustration layer. |
| Stef & Phil (Squarespace) | https://www.stefandphil.com | Peach, beige and olive blocks with Mexican-textile patterns. Playful hero copy. A Mexico City travel guide. | — | A city guide as a gift to guests, which fits NYC (Museum Mile, Central Park). |
| Claudia & Marijn (Squarespace) | https://www.claudiaandmarijn.com | Oversized olive-gold headline over blurred couple photos. Expandable FAQ. | Low-contrast type over photos is a risk. | Big type laid over softened photography. Accordion FAQ. |
| Dennis & Nina (Squarespace) | https://www.dinawedding.com | Content in three languages (EN, SK, NL) side by side in columns. Thorough Practical Information page. | Dense. | Multilingual columns if either family needs them. A single "Practical info" page. |
| Michelle & Tonye | https://www.michelleandtonye.com | Awwwards Mobile of the Week. One scrolling page with persistent anchors (When & Where, Story, Registry, Livestream, Gallery). | RSVP sent off-site. Dead livestream link left up after the wedding. | A mobile-first single scroll with anchor nav. **Plan the post-wedding state** (thank-you note, photos). |
| Veley / Ross | http://veleyross.wedding (bot-blocked to curl; fetched) | Awwwards Site of the Day and Developer Award (2019). Small-caps labels, huge "10 / 14" date numerals, drag-to-explore gallery, airport, lodging and food sections. | Gimmicky interactions, RSVP off-site. | Big date numerals as graphics. Small-caps section labels. |
| Awwwards wedding tag | https://www.awwwards.com/websites/wedding/ | Mostly photographers and venues. A few couple sites (Japanese invitation sites such as wedding.s-tmro.com). | Few couple sites. | Browse for motion ideas. |
| Sitebuilder Report gallery | https://www.sitebuilderreport.com/inspiration/wedding-websites-examples | 26 annotated real sites, the source of most picks above. | Mostly Squarespace. | Quick survey of what's normal. |
| Siteinspire / Typewolf | https://www.typewolf.com | Typewolf is good for font pairing (e.g. Editorial Old). | Neither has a wedding category (checked). | Use for type choices, not for wedding layouts. |

Recurring patterns across the strong sites:
- **Type:** a high-contrast serif for names and headlines, a plain sans for times and places, and letterspaced small caps for labels.
- **Layout:** one hero, generous space, and identical repeated cards for events. Everything else is a scannable list or accordion.
- **Photos:** a few large photos rather than a grid of 80. Blurred or softened photos only behind big type.
- **Voice:** one consistent personality (camp, wry, formal), while the logistics stay literal.
- **Common miss:** an off-site RSVP and a site left stale after the wedding.

## 3. Museum and editorial direction (the `catalogue` theme)

### Museum and catalogue devices that map onto wedding content

| Device | Museum convention | Wedding translation |
|---|---|---|
| Wall label / tombstone | Title, maker, date, medium, credit line. Short (~17 words) in plain sans. | Event card: **The Ceremony** / Rotunda, 1st floor / Sat, 5:30 pm / Black tie optional / "Seating opens 5:00". |
| Section or room panels | Big intro text that opens each gallery. | Each page opens with a two-line curatorial intro in the couple's voice. |
| Catalogue plate numbers | "Pl. 12", "Fig. 3" | Number the sections (No. 01 Story, No. 02 Schedule…) and photos ("Fig. 7, Montauk, 2021"). |
| Accession numbers | e.g. 2027.06.12 | Use the wedding date as a recurring motif: footer, favicon, "object numbers" for photos. |
| Exhibition title / poster | Show title, dates, institution | Hero: "Maya & Theo — An Exhibition in One Evening — the museum's name". |
| Visitor information | Hours, admission, access, coat check | FAQ styled as "Visitor Information": arrival, coat check, accessibility (elevator vs. staircase), photography policy. |
| Audio guide | Numbered stops | An optional story told as numbered "stops" through the couple's history. |
| Colophon | Credits page in catalogues | Footer credits: photographers, florist, "Typeset in …". |

Precedents: Minted's "Museum" invitation suite and its Met collaboration, Papier × V&A (museum-
licensed stationery sells), Cooper Hewitt's custom typeface identity (Pentagram, 2014), the New
Museum's catalogue published as a vertical web document. Exhibition text guides (e.g. Canadian
Museum for Human Rights standards) favor short captions in a sober sans with a clear hierarchy,
which also happens to be the most readable option for older guests.

### Type and palette starting points (to be decided in each site's DESIGN.md)

- Display: a classical high-contrast serif, ideally with real small caps and old-style figures.
  Test thin strokes at mobile sizes, since hairlines break on low-DPI screens. Check web
  licenses.
- Labels and details: a neutral grotesk in the spirit of museum label type (Univers-like), with
  tabular figures for times.
- Palette for `catalogue`: brick red, marble cream, bronze, garden green, ink.
  Avoid the generic AI-template combination of Playfair, Cormorant, cream and gold.
- `letterpress`: same content model and RSVP engine, with a venue-neutral type and palette.

## 4. RSVP UX

| Topic | Evidence | Recommendation |
|---|---|---|
| Entry method | WedSites: name (default), email, or personal link only. Zola and Joy: name. Riley & Grey: name, email and/or password. | **Personal link or QR on the invitation first**, name search second, a short code only as a fallback printed on the card. |
| Name matching | Exact-match complaints (Zola, Joy forums). Joy ignores case and offers "Try again". | Normalize case, accents and punctuation. Store aliases per guest. Match on last name, then show a household pick-list of first names only. Rate-limit lookups so the list can't be scraped. |
| Privacy | Invite-only modes (Zola, WedSites). Riley & Grey adds a password and search hiding. | Public info pages (`noindex`), RSVP gated by lookup. No site-wide password wall, because older relatives get locked out. |
| Household | Joy and WedSites: one person replies for everyone and responses are stored per guest. Minted's party-size model fails. | Invitation (party) → guests → per-event responses. Count from guest rows. |
| Per-event | Joy and Zola: invited events only, with questions per event. | Show only invited events. "No reply needed" events are listed but not asked. Use per-event questions (e.g. shuttle only for the ceremony). |
| Meals and dietary | Zola: collect allergies and shuttle needs in the RSVP. Minted lacks per-person meals. | Meal per attending guest per meal-bearing event. Free-text dietary per guest. Kids' meal option. |
| Plus-ones | WedSites: per guest or household. Zola: "Guest" placeholder that the guest renames. | Plus-ones are an explicit slot on the invitation. The guest enters the name, which is optional until the deadline. Nobody can add guests outside a slot. |
| Deadline | Typically 3–4 weeks out (6–8 for destination). Paperless Post auto-closes. WedSites doesn't. | Show the date on the RSVP screen and in emails. Auto-close with a friendly message and contact info. Admin can extend. |
| Reminders | Paperless Post and Greenvelope remind non-responders by segment. | Email one week before the deadline, only to parties with unanswered events. Include the direct link. |
| Confirmation | Rarely documented by platforms. | Immediate email: who's coming to what, meals, notes, and a magic link to edit. Send to every guest email in the party. |
| Editing | Joy requires an account to edit. Zola tells guests to contact the couple. | Edit through the emailed link or a repeat lookup until the deadline, then read-only with "contact us". Log changes for the couple. |
| Older guests | W3C WAI-AGE: instructions up front, visible labels, inline validation, no asterisk-only required fields, logical grouping. 44–48px targets, 18px+ body. | One step per screen on mobile: find invitation → each event (Yes/No per person) → meals → notes → review → done. Big buttons, no dropdowns for two choices, a phone-number fallback. |
| Non-digital guests | Zola: couples enter paper replies manually. | Admin can record a response on someone's behalf. Mark the source as "phone" or "paper". |

## 5. Pitfalls to avoid

| Pitfall | Seen on | Avoid by |
|---|---|---|
| Vendor ads and upsells on the guest view | The Knot (ad-supported), Minted (stationery), Zola (registry), Wix free plan (branding) | Self-hosted, no ads. Registry links go out to whatever stores the couple chooses. |
| Account or app required | Joy app, Joy edit flow, Appy Couple | Browser only. Magic links, no accounts. |
| Strict name matching | Zola, Joy (forums) | Aliases, normalization, a pick-list, a contact link. |
| Password walls too tight or too loose | General advice (WedSites blog) | Gate only the RSVP. Keep logistics readable. Add `noindex`. |
| Unclear dress code | Most-cited guest complaint | Name it ("Black tie optional"), define it in one line, show 4–6 example images, put it on every event card. |
| Missing transit and parking | Most-cited guest complaint | Subway, bus, taxi drop-off, parking, accessible entrance, and the airport-to-hotel route. Show a map and the walk time from the hotels. |
| Hotel block buried | WedSites blog | A Travel button on the home page. Block rate, booking link, cutoff date, address, plus cheaper alternatives. |
| Slow photo galleries | Squarespace and Wix sites with huge images | Resize at the edge (see `.claude/docs/images.md`), lazy-load, a curated 12–30 photo set, a lightbox with captions. |
| Hero video and heavy motion | simonianwedding.com, Awwwards sites | A still poster image first. Respect `prefers-reduced-motion`. Never put RSVP behind an animation. |
| Low-contrast text over photos | jasonatnina.com (reviewer note), blurred-photo heroes | Scrim or solid panel behind text. AA contrast in both color modes. |
| Stale site after the wedding | michelleandtonye.com (dead livestream link) | A post-wedding mode: thank-you note, photos, and RSVP and travel retired. |
| RSVP off-site | veleyross.wedding, michelleandtonye.com | RSVP built in, same domain, same design. |
| Exports needing cleanup | The Knot CSV | Admin CSV of one row per guest per event, with meal and dietary columns, ready for the caterer. |
