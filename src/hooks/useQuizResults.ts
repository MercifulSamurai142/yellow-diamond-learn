
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define a custom type for quiz results since it's not in the generated types
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
      // Use the raw query method to bypass the type checking for quiz_results
      // since it's not in the auto-generated types
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      // Explicitly cast the data to QuizResult
      const typedData = data as unknown as QuizResult;
      setResults(typedData);
      return typedData;
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
      // Use the raw query method to bypass the type checking for quiz_results
      const { data, error } = await supabase
        .from('quiz_results')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          lesson_id: lessonId,
          score,
          passed,
          answers_json: answersJson
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Explicitly cast the data to QuizResult
      const typedData = data as unknown as QuizResult;
      setResults(typedData);
      return typedData;
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
