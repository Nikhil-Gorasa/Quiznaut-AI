-- Supabase SQL schema for AI Quiz Builder (run in SQL Editor)

create table if not exists public.quizzes (
  id text primary key,
  title text not null,
  topic text,
  difficulty text check (difficulty in ('Easy','Medium','Hard')) not null default 'Medium',
  questions jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.quizzes enable row level security;

-- Public read access (anyone can fetch a quiz by id)
create policy if not exists "Quizzes are readable by everyone"
  on public.quizzes for select
  using (true);

-- Insert allowed to anonymous clients (optional; you can restrict via custom logic)
create policy if not exists "Anonymous can insert quizzes"
  on public.quizzes for insert
  with check (true);

-- Prevent updates/deletes by default (omit policies)

-- Quiz scores table for leaderboard functionality
create table if not exists public.quiz_scores (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null references public.quizzes(id) on delete cascade,
  player_name text not null,
  score integer not null check (score >= 0 and score <= 100),
  correct_answers integer not null check (correct_answers >= 0),
  total_questions integer not null check (total_questions > 0),
  answers jsonb not null,
  created_at timestamptz not null default now()
);

-- Enable RLS on quiz_scores
alter table public.quiz_scores enable row level security;

-- Public read access for leaderboard
create policy if not exists "Quiz scores are readable by everyone"
  on public.quiz_scores for select
  using (true);

-- Allow anonymous users to insert their scores
create policy if not exists "Anonymous can insert quiz scores"
  on public.quiz_scores for insert
  with check (true);


