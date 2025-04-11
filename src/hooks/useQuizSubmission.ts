
import { useState } from 'react';
import { useQuizResults } from './useQuizResults';
import { toast } from '@/hooks/use-toast';
import { Question, Answer } from '@/hooks/useQuiz';

export type UserAnswer = {
  questionId: string;
  answerId: string;
};

export type QuizSubmissionResult = {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  answersDetails: {
    questionId: string;
    isCorrect: boolean;
    userAnswerId: string;
    correctAnswerId: string;
  }[];
};

export const useQuizSubmission = (
  questions: Question[],
  passThreshold: number,
  quizId: string,
  lessonId: string
) => {
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveQuizResult } = useQuizResults(quizId, lessonId);

  const handleAnswerChange = (questionId: string, answerId: string) => {
    setUserAnswers((prev) => {
      const exists = prev.find((a) => a.questionId === questionId);
      if (exists) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, answerId } : a));
      }
      return [...prev, { questionId, answerId }];
    });
  };

  const calculateResult = (): QuizSubmissionResult => {
    const answersDetails = questions.map((question) => {
      const userAnswer = userAnswers.find((a) => a.questionId === question.id);
      const correctAnswer = question.answers.find((a) => a.is_correct);
      
      return {
        questionId: question.id,
        isCorrect: 
          userAnswer !== undefined && 
          correctAnswer !== undefined && 
          userAnswer.answerId === correctAnswer.id,
        userAnswerId: userAnswer?.answerId || '',
        correctAnswerId: correctAnswer?.id || '',
      };
    });

    const correctAnswers = answersDetails.filter((a) => a.isCorrect).length;
    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= passThreshold;

    return {
      score,
      passed,
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      answersDetails,
    };
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    try {
      // Check if all questions are answered
      if (userAnswers.length < questions.length) {
        toast({
          variant: "destructive",
          title: "Incomplete Quiz",
          description: "Please answer all questions before submitting."
        });
        setIsSubmitting(false);
        return;
      }

      const calculatedResult = calculateResult();
      setResult(calculatedResult);
      
      // Save to database
      await saveQuizResult(
        calculatedResult.score, 
        calculatedResult.passed,
        {
          userAnswers,
          answersDetails: calculatedResult.answersDetails
        }
      );
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit quiz'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setUserAnswers([]);
    setResult(null);
  };

  return {
    userAnswers,
    result,
    isSubmitting,
    handleAnswerChange,
    submitQuiz,
    resetQuiz,
  };
};
