-- Allow authenticated users to read and moderate new place submissions.
-- This is a simple starter rule for the admin review dashboard.
-- If you want stricter access later, replace this with a role-based policy.

create policy "Authenticated users can view all places"
on public.places
for select
using (auth.uid() is not null);

create policy "Authenticated users can update place review status"
on public.places
for update
using (auth.uid() is not null)
with check (auth.uid() is not null);
