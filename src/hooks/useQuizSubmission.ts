
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Question = Tables<"questions"> & { answers: { id: string; is_correct: boolean }[] };

interface UseQuizSubmissionProps {
  questions: Question[];
  quiz: {
    id: string;
    pass_threshold: number;
  } | null;
  lessonId: string | undefined;
}

interface QuizScore {
  correct: number;
  total: number;
  percentage: number;
}

export const useQuizSubmission = ({ questions, quiz, lessonId }: UseQuizSubmissionProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [score, setScore] = useState<QuizScore>({ 
    correct: 0, 
    total: 0, 
    percentage: 0 
  });
  const { user } = useAuth();

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    questions.forEach(question => {
      const selectedAnswerId = selectedAnswers[question.id];
      if (selectedAnswerId) {
        const selectedAnswer = question.answers.find(a => a.id === selectedAnswerId);
        if (selectedAnswer && selectedAnswer.is_correct) {
          correctCount++;
        }
      }
    });
    
    const totalQuestions = questions.length;
    const percentageScore = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100) 
      : 0;
    
    return {
      correct: correctCount,
      total: totalQuestions,
      percentage: percentageScore
    };
  };

  const submitQuiz = async () => {
    if (!user || !quiz) return;
    
    const calculatedScore = calculateScore();
    
    setScore(calculatedScore);
    setQuizCompleted(true);
    
    try {
      const { error } = await supabase.functions.invoke('save-quiz-result', {
        body: JSON.stringify({
          userId: user.id,
          quizId: quiz.id,
          lessonId: lessonId,
          score: calculatedScore.percentage,
          passed: calculatedScore.percentage >= quiz.pass_threshold,
          answersJson: JSON.stringify(selectedAnswers)
        })
      });

      if (error) {
        console.error("Error saving quiz results:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save quiz results.",
        });
      } else {
        toast({
          title: "Quiz completed",
          description: `You scored ${calculatedScore.percentage}%`,
        });
      }
    } catch (err) {
      console.error("Error in quiz submission:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit quiz.",
      });
    }
  };

  return {
    selectedAnswers,
    quizCompleted,
    score,
    handleAnswerSelect,
    submitQuiz
  };
};
