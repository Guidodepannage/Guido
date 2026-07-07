-- ======================================================================
--  GUIDO — Activation de compte par l'invité (Phase "branchement app")
--  À coller dans Supabase : SQL Editor > New query > Run.
--  Permet à un utilisateur invité de passer son propre statut à "actif"
--  après avoir défini son mot de passe (sans pouvoir modifier autre chose).
-- ======================================================================

create or replace function public.activer_mon_compte()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set status = 'actif'
   where id = auth.uid()
     and status = 'invite';
$$;

grant execute on function public.activer_mon_compte() to authenticated;
