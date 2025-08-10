-- Quiznaut AI - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create the quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    topic TEXT,
    difficulty TEXT,
    questions JSONB NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for public access)
-- You can modify this later for more restrictive access
CREATE POLICY "Allow all operations on quizzes" ON public.quizzes
    FOR ALL USING (true)
    WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON public.quizzes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.quizzes TO anon;
GRANT ALL ON public.quizzes TO authenticated;

-- Optional: Create a view for public quiz access (if you want to restrict some fields)
CREATE OR REPLACE VIEW public.quiz_summaries AS
SELECT 
    id,
    title,
    topic,
    difficulty,
    created_at,
    jsonb_array_length(questions) as question_count
FROM public.quizzes
ORDER BY created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON public.quiz_summaries TO anon;
GRANT SELECT ON public.quiz_summaries TO authenticated;

-- Create quiz_scores table for leaderboard
CREATE TABLE IF NOT EXISTS public.quiz_scores (
    id SERIAL PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    correct_answers INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_scores_quiz_id ON public.quiz_scores(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_score ON public.quiz_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_created_at ON public.quiz_scores(created_at);

-- Enable RLS for quiz_scores
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Create policy for quiz_scores
CREATE POLICY "Allow all operations on quiz_scores" ON public.quiz_scores
    FOR ALL USING (true)
    WITH CHECK (true);

-- Grant permissions for quiz_scores
GRANT ALL ON public.quiz_scores TO anon;
GRANT ALL ON public.quiz_scores TO authenticated;

-- Run this in your Supabase SQL Editor to add the missing quiz_scores table

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

-- Verify the table was created
select * from information_schema.tables where table_name = 'quiz_scores';
