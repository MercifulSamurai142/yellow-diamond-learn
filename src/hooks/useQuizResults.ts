
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define a custom type for quiz results since it's not being recognized in the generated types
export interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  lesson_id: string;
  score: number;
  passed: boolean;
  answers_json: any;
  created_at: string;
}

export const useQuizResults = (quizId?: string, lessonId?: string) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QuizResult | null>(null);
  
  const fetchResults = async () => {
    if (!user || !quizId) return null;
    
    setIsLoading(true);
    
    try {
      // Use the RPC function instead of direct table access
      const { data, error } = await supabase
        .rpc('get_user_quiz_results', { 
          user_id_param: user.id, 
          quiz_ids_param: [quizId]
        });
      
      if (error) throw error;
      
      // If we have results, get the most recent one
      if (data && data.length > 0) {
        const mostRecentResult = data[0] as unknown as QuizResult;
        setResults(mostRecentResult);
        return mostRecentResult;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load quiz results'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveQuizResult = async (score: number, passed: boolean, answersJson: any) => {
    if (!user || !quizId || !lessonId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing required information to save quiz result'
      });
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Use the RPC function instead of direct table access
      const { data, error } = await supabase
        .rpc('save_quiz_result', {
          user_id_param: user.id,
          quiz_id_param: quizId,
          lesson_id_param: lessonId,
          score_param: score,
          passed_param: passed,
          answers_json_param: answersJson
        });
      
      if (error) throw error;
      
      // Since the function doesn't return the inserted record,
      // we'll fetch the latest result after saving
      const fetchResponse = await fetchResults();
      return fetchResponse;
    } catch (error) {
      console.error('Error saving quiz result:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save quiz result'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    results,
    isLoading,
    fetchResults,
    saveQuizResult
  };
};
