-- Zendi Labs contact form storage.
-- Mirrors eversteadrecoveryliving.com's pattern (app/api/contact/route.ts):
-- form submissions land in a Supabase table instead of being emailed.
--
-- This shares the SAME Supabase project as eversteadrecoveryliving.com
-- (to avoid a second paid organization) — the table is prefixed
-- `zendilabs_` so it can't collide with Everstead's own `contact_messages`
-- table or any of its other tables. Run this once in that project's SQL editor.

create table if not exists public.zendilabs_contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  phone text,
  project_type text not null,
  description text not null,
  timeline text,
  budget text,
  contact_method text
);

alter table public.zendilabs_contact_messages enable row level security;

-- This site is static (no server), so the browser inserts directly using the
-- public "publishable" key. This policy is the only thing standing between the
-- public internet and this table — it intentionally allows INSERT only.
-- There is no SELECT/UPDATE/DELETE policy, so submissions cannot be read back,
-- changed, or deleted through the public key; only via the Supabase dashboard
-- or a service-role key. It also only grants access to THIS table, so it has
-- no effect on Everstead's own tables/policies in the same project.
create policy "Public can submit Zendi Labs contact messages"
  on public.zendilabs_contact_messages
  for insert
  to anon
  with check (true);

-- Lets the admin page (admin.html) read submissions once the viewer has a real
-- Supabase Auth session — this is what "authenticated" means here, not just
-- possessing the public key. Public/anon visitors still cannot read this table;
-- only a signed-in user can. Create the admin login in the Supabase dashboard
-- under Authentication -> Users -> Add user (email + password), then sign in
-- with those credentials on admin.html.
create policy "Signed-in users can view Zendi Labs contact messages"
  on public.zendilabs_contact_messages
  for select
  to authenticated
  using (true);
