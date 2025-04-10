
CREATE OR REPLACE FUNCTION public.get_user_quiz_results(user_id_param UUID, quiz_ids_param UUID[])
RETURNS TABLE (
  id UUID,
  user_id UUID,
  quiz_id UUID,
  score INTEGER,
  passed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT qr.id, qr.user_id, qr.quiz_id, qr.score, qr.passed, qr.created_at
  FROM quiz_results qr
  WHERE qr.user_id = user_id_param
  AND qr.quiz_id = ANY(quiz_ids_param)
  ORDER BY qr.created_at DESC;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_quiz_results TO authenticated;
