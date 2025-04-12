import { useState } from 'react';
import { useQuizResults } from './useQuizResults';
import { toast } from '@/hooks/use-toast';
import { Question } from '@/hooks/useQuiz';
import { useAuth } from '@/contexts/AuthContext'; 
import { checkAndAwardAchievements, CheckContext } from '@/services/achivementServices'; 

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
  lessonId: string,
  moduleId: string 
) => {
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveQuizResult } = useQuizResults(quizId, lessonId);
  const { user } = useAuth();

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
    // Ensure score calculation avoids division by zero
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
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
    // Ensure questions are loaded before allowing submission
    if (!questions || questions.length === 0) {
         toast({ variant: "destructive", title: "Error", description: "Quiz questions not loaded." });
         return;
    }
    // Ensure passThreshold is a valid number
     if (typeof passThreshold !== 'number' || isNaN(passThreshold)) {
          toast({ variant: "destructive", title: "Error", description: "Invalid quiz configuration (pass threshold)." });
         return;
     }

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
      setResult(calculatedResult); // Show result immediately

      // Save to database
      await saveQuizResult(
        calculatedResult.score,
        calculatedResult.passed,
        {
          // Storing userAnswers and answersDetails might be redundant if saveQuizResult recalculates
          // Pass only what saveQuizResult needs
          userAnswers, // Pass raw answers if needed for detailed logging
          details: calculatedResult.answersDetails // Pass calculated details if needed
        }
      );
       // proceed to check achievements

      if (user && moduleId && quizId && lessonId) { // Ensure all necessary context is available
        const achievementContext: CheckContext = {
          userId: user.id,
          quizId: quizId,
          moduleId: moduleId,
          lessonId: lessonId, // Pass lessonId as well
          quizScore: calculatedResult.score,
          quizPassed: calculatedResult.passed
        };

        console.log("Checking achievements with context:", achievementContext); // Debug log

        // Run achievement checks in the background (don't await)
        // Use .catch() to handle errors from the check function without crashing the quiz flow
        checkAndAwardAchievements(achievementContext).catch(err => {
          console.error("Achievement check failed after quiz submission:", err);
          // Optional: Show a non-critical toast if achievement checks fail?
          // toast({ variant: "default", title: "Notice", description: "Could not check for new achievements at this time." });
        });
      } else {
         console.warn("User, Module ID, Quiz ID, or Lesson ID not available for achievement check. Skipping.");
      }

      toast({ title: "Quiz Submitted", description: "Your results have been saved." });

    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast({
        variant: 'destructive',
        title: 'Quiz Submission Error',
        description: error?.message || 'Failed to submit quiz results. Please try again.'
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