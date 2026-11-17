create or replace function public.get_public_place_interaction_counts(place_ids uuid[])
returns table (
  place_id uuid,
  like_count bigint,
  review_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if to_regclass('public.reviews') is null then
    return query
      select
        p.id,
        (select count(*) from public.user_likes ul where ul.place_id = p.id),
        coalesce(p.rating_count, 0)::bigint
      from public.places p
      where p.id = any(place_ids)
        and p.status in ('approved', 'published');
  else
    return query execute
      'select
         p.id,
         (select count(*) from public.user_likes ul where ul.place_id = p.id),
         (select count(*) from public.reviews r where r.place_id = p.id)
       from public.places p
       where p.id = any($1)
         and p.status in (''approved'', ''published'')'
      using place_ids;
  end if;
end;
$$;

revoke all on function public.get_public_place_interaction_counts(uuid[]) from public;
grant execute on function public.get_public_place_interaction_counts(uuid[]) to anon, authenticated;
