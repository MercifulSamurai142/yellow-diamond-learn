
-- Create quiz_results table to track user quiz attempts and scores
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  quiz_id UUID REFERENCES public.quizzes NOT NULL,
  lesson_id UUID REFERENCES public.lessons,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT score_range CHECK (score >= 0 AND score <= 100)
);

-- Add RLS policies
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own quiz results
CREATE POLICY "Users can view their own quiz results" 
  ON public.quiz_results FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Users can insert their own quiz results
CREATE POLICY "Users can insert their own quiz results" 
  ON public.quiz_results FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update or delete quiz results
CREATE POLICY "Only admins can update quiz results" 
  ON public.quiz_results FOR UPDATE 
  TO authenticated 
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can delete quiz results" 
  ON public.quiz_results FOR DELETE 
  TO authenticated 
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Create index for faster lookups
CREATE INDEX idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);
