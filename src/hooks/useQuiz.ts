
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

export type Quiz = Tables<"quizzes">;
export type Question = Tables<"questions"> & { answers: Answer[] };
export type Answer = Tables<"answers">;

interface UseQuizProps {
  lessonId: string | undefined;
}

interface QuizState {
  quiz: Quiz | null;
  questions: Question[];
  isLoading: boolean;
  error: Error | null;
}

export const useQuiz = ({ lessonId }: UseQuizProps) => {
  const [state, setState] = useState<QuizState>({
    quiz: null,
    questions: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        if (!lessonId) return;
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('lesson_id', lessonId)
          .single();

        if (quizError) throw quizError;
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('order');

        if (questionsError) throw questionsError;
        
        const questionIds = questionsData.map(q => q.id);
        
        const { data: answersData, error: answersError } = await supabase
          .from('answers')
          .select('*')
          .in('question_id', questionIds)
          .order('order');

        if (answersError) throw answersError;
        
        const answersMap: Record<string, Answer[]> = {};
        answersData.forEach((answer) => {
          if (!answersMap[answer.question_id as string]) {
            answersMap[answer.question_id as string] = [];
          }
          answersMap[answer.question_id as string].push(answer as Answer);
        });
        
        const questionsWithAnswers = questionsData.map(question => ({
          ...question,
          answers: answersMap[question.id] || []
        }));
        
        setState({
          quiz: quizData,
          questions: questionsWithAnswers as Question[],
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load quiz.",
        });
      }
    };

    fetchQuizData();
  }, [lessonId]);

  return state;
};
