-- À exécuter une seule fois dans l’éditeur SQL de Supabase.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null check (char_length(display_name) between 2 and 50),
  personal_message text not null default '' check (char_length(personal_message) <= 160),
  avatar_url text,
  status text not null default 'Available' check (status in ('Available', 'Busy', 'Away', 'Offline')),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null,
  addressee_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint friendships_requester_id_fkey foreign key (requester_id) references public.profiles(id) on delete cascade,
  constraint friendships_addressee_id_fkey foreign key (addressee_id) references public.profiles(id) on delete cascade,
  constraint friendship_not_self check (requester_id <> addressee_id)
);

create unique index if not exists friendships_unique_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  kind text not null default 'text' check (kind in ('text', 'nudge')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint message_not_self check (sender_id <> recipient_id)
);

create index if not exists messages_conversation_index on public.messages (sender_id, recipient_id, created_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, status, avatar_url)
  values (
    new.id,
    lower(new.email),
    left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)), 50),
    case when new.raw_user_meta_data ->> 'status' in ('Available', 'Busy', 'Away', 'Offline')
      then new.raw_user_meta_data ->> 'status' else 'Available' end,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.messages enable row level security;

create policy "Profils visibles par les membres"
  on public.profiles for select to authenticated using (true);
create policy "Chaque membre modifie son profil"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Les participants voient leurs contacts"
  on public.friendships for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Un membre envoie une invitation"
  on public.friendships for insert to authenticated
  with check (auth.uid() = requester_id and requester_id <> addressee_id and status = 'pending');
create policy "Le destinataire accepte une invitation"
  on public.friendships for update to authenticated
  using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id and status = 'accepted');
create policy "Un participant supprime une invitation"
  on public.friendships for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Les participants lisent leurs messages"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Un contact accepté envoie un message"
  on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = sender_id and f.addressee_id = recipient_id)
          or (f.addressee_id = sender_id and f.requester_id = recipient_id))
    )
  );
create policy "Le destinataire marque un message comme lu"
  on public.messages for update to authenticated
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.friendships;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
