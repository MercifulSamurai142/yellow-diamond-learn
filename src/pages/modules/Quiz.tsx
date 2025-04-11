import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Quiz = Tables<"quizzes">;
type Question = Tables<"questions"> & { answers: Answer[] };
type Answer = Tables<"answers">;

interface QuizResult {
  user_id: string;
  quiz_id: string;
  lesson_id?: string;
  score: number;
  passed: boolean;
  answers_json: string;
}

const Quiz = () => {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number; percentage: number }>({ correct: 0, total: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);
        if (!lessonId) return;
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('lesson_id', lessonId)
          .single();

        if (quizError) throw quizError;
        
        setQuiz(quizData);

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
        
        setQuestions(questionsWithAnswers as Question[]);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load quiz.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, [lessonId]);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

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

  const handleSubmitQuiz = async () => {
    if (!user || !quiz) return;
    
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
    
    setScore({
      correct: correctCount,
      total: totalQuestions,
      percentage: percentageScore
    });
    
    setQuizCompleted(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('save-quiz-result', {
        body: JSON.stringify({
          userId: user.id,
          quizId: quiz.id,
          lessonId: lessonId,
          score: percentageScore,
          passed: percentageScore >= quiz.pass_threshold,
          answersJson: JSON.stringify(selectedAnswers)
        })
      });

      if (error) {
        console.error("Error saving quiz results:", error);
      }
    } catch (err) {
      console.error("Error in quiz submission:", err);
    }
    
    toast({
      title: "Quiz completed",
      description: `You scored ${percentageScore}%`,
    });
  };

  const handleReturnToModules = () => {
    navigate(`/modules/${moduleId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full flex-col">
              <h2 className="text-xl font-semibold mb-4">Quiz not found</h2>
              <Link to={`/modules/${moduleId}/lessons/${lessonId}`} className="text-primary hover:underline flex items-center">
                <ArrowLeft size={16} className="mr-1" />
                Back to lesson
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            {!quizCompleted ? (
              <>
                <div className="flex justify-between items-center mb-8">
                  <Link to={`/modules/${moduleId}/lessons/${lessonId}`} className="text-primary hover:underline flex items-center">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to lesson
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    Question {currentQuestion + 1} of {questions.length}
                  </div>
                </div>
                
                <h2 className="yd-section-title mb-6">{quiz.title}</h2>
                
                {questions.length > 0 && (
                  <YDCard className="mb-8">
                    <div className="p-6">
                      <h3 className="text-lg font-medium mb-6">{questions[currentQuestion].question_text}</h3>
                      
                      <div className="space-y-4">
                        {questions[currentQuestion].answers.map((answer) => (
                          <div 
                            key={answer.id}
                            className={`p-4 border rounded-md cursor-pointer transition-all ${
                              selectedAnswers[questions[currentQuestion].id] === answer.id 
                                ? 'border-primary bg-primary/10' 
                                : 'border-border hover:border-primary'
                            }`}
                            onClick={() => handleAnswerSelect(questions[currentQuestion].id, answer.id)}
                          >
                            {answer.answer_text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </YDCard>
                )}
                
                <div className="flex justify-between">
                  <YDButton 
                    variant="outline" 
                    onClick={handlePrevQuestion}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </YDButton>
                  
                  {currentQuestion < questions.length - 1 ? (
                    <YDButton 
                      onClick={handleNextQuestion}
                      disabled={!selectedAnswers[questions[currentQuestion].id]}
                    >
                      Next
                    </YDButton>
                  ) : (
                    <YDButton 
                      onClick={handleSubmitQuiz}
                      disabled={!selectedAnswers[questions[currentQuestion].id]}
                    >
                      Submit Quiz
                    </YDButton>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="yd-section-title mb-6">Quiz Results</h2>
                
                <YDCard className="mb-8">
                  <div className="p-6 text-center">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">{score.percentage}%</h3>
                      <p className="text-muted-foreground">
                        You answered {score.correct} out of {score.total} questions correctly
                      </p>
                    </div>
                    
                    {score.percentage >= (quiz.pass_threshold || 70) ? (
                      <div className="flex items-center justify-center text-green-600 mb-6">
                        <CheckCircle2 size={24} className="mr-2" />
                        <span className="text-lg font-medium">Passed!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-red-600 mb-6">
                        <XCircle size={24} className="mr-2" />
                        <span className="text-lg font-medium">Failed</span>
                      </div>
                    )}
                    
                    <YDButton onClick={handleReturnToModules}>
                      Return to Modules
                    </YDButton>
                  </div>
                </YDCard>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Quiz;
