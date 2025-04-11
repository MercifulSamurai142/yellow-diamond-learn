
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useQuiz } from "@/hooks/useQuiz";
import { useQuizSubmission } from "@/hooks/useQuizSubmission";
import QuizLoader from "@/components/quiz/QuizLoader";
import QuizNotFound from "@/components/quiz/QuizNotFound";
import QuizHeader from "@/components/quiz/QuizHeader";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizNavigation from "@/components/quiz/QuizNavigation";
import QuizResults from "@/components/quiz/QuizResults";

const Quiz = () => {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const navigate = useNavigate();

  // Load quiz data
  const { quiz, questions, isLoading } = useQuiz({ 
    lessonId 
  });

  // Quiz submission logic
  const { 
    userAnswers,
    result,
    isSubmitting,
    handleAnswerChange,
    submitQuiz,
    resetQuiz
  } = useQuizSubmission(
    questions, 
    quiz?.pass_threshold || 70, 
    quiz?.id || '', 
    lessonId || ''
  );

  // Navigation handlers
  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleReturnToModules = () => {
    navigate(`/modules/${moduleId}`);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <QuizLoader isLoading={isLoading} />

          {!isLoading && (
            <div className="yd-container animate-fade-in">
              {!quiz || questions.length === 0 ? (
                <QuizNotFound moduleId={moduleId!} lessonId={lessonId!} />
              ) : result ? (
                <QuizResults 
                  result={result}
                  onReset={resetQuiz}
                  moduleId={moduleId!}
                  lessonId={lessonId!}
                />
              ) : (
                <>
                  <QuizHeader 
                    moduleId={moduleId!} 
                    lessonId={lessonId!} 
                    currentQuestion={currentQuestion} 
                    totalQuestions={questions.length} 
                  />
                  
                  <h2 className="yd-section-title mb-6">{quiz.title}</h2>
                  
                  {questions.length > 0 && (
                    <QuizQuestion 
                      question={questions[currentQuestion]}
                      selectedAnswer={
                        userAnswers.find(a => a.questionId === questions[currentQuestion].id)?.answerId
                      }
                      onAnswerSelect={handleAnswerChange}
                    />
                  )}
                  
                  <QuizNavigation 
                    currentQuestion={currentQuestion}
                    totalQuestions={questions.length}
                    selectedAnswer={
                      userAnswers.find(a => a.questionId === questions[currentQuestion].id)?.answerId
                    }
                    onPrevious={handlePrevQuestion}
                    onNext={handleNextQuestion}
                    onSubmit={submitQuiz}
                  />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Quiz;
