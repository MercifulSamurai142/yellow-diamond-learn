
-- Create a function to save quiz results
CREATE OR REPLACE FUNCTION public.save_quiz_result(
  user_id_param UUID,
  quiz_id_param UUID,
  lesson_id_param UUID,
  score_param INTEGER,
  passed_param BOOLEAN,
  answers_json_param JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.quiz_results (
    user_id,
    quiz_id,
    lesson_id,
    score,
    passed,
    answers_json
  ) VALUES (
    user_id_param,
    quiz_id_param,
    lesson_id_param,
    score_param,
    passed_param,
    answers_json_param
  );
END;
$$;

-- Create a function for raw insertion as fallback
CREATE OR REPLACE FUNCTION public.insert_quiz_result(
  user_id_input UUID,
  quiz_id_input UUID,
  lesson_id_input UUID,
  score_input INTEGER,
  passed_input BOOLEAN,
  answers_json_input JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.quiz_results (
    user_id,
    quiz_id,
    lesson_id,
    score,
    passed,
    answers_json
  ) VALUES (
    user_id_input,
    quiz_id_input,
    lesson_id_input,
    score_input,
    passed_input,
    answers_json_input
  );
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.save_quiz_result TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_quiz_result TO authenticated;
