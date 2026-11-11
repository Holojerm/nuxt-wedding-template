-- Two households for the public demo, so visitors can try the RSVP by name.
-- Apply with: bunx wrangler d1 execute nuxt-wedding-template-db --remote --file scripts/seed-demo.sql
INSERT OR IGNORE INTO wedding_households (id, wedding_slug, label, invite_code, invited_event_ids, created_at)
VALUES
  ('demo-household-lee', 'mayatheo', 'Sam Lee', 'SAM234', '[]', unixepoch()),
  ('demo-household-okafor', 'mayatheo', 'The Okafor Family', 'ADA567', '["brunch"]', unixepoch());
INSERT OR IGNORE INTO wedding_guests (id, household_id, wedding_slug, first_name, last_name, name_key, is_plus_one, sort_order)
VALUES
  ('demo-guest-sam', 'demo-household-lee', 'mayatheo', 'Sam', 'Lee', 'sam lee', 0, 0),
  ('demo-guest-sam-plus', 'demo-household-lee', 'mayatheo', '', '', '', 1, 1),
  ('demo-guest-ada', 'demo-household-okafor', 'mayatheo', 'Ada', 'Okafor', 'ada okafor', 0, 0),
  ('demo-guest-chidi', 'demo-household-okafor', 'mayatheo', 'Chidi', 'Okafor', 'chidi okafor', 0, 1);
