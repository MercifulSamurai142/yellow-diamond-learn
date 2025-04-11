
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import YDButton from "@/components/ui/YDButton";
import { QuizSubmissionResult } from "@/hooks/useQuizSubmission";
import { Link } from "react-router-dom";

interface QuizResultsProps {
  result: QuizSubmissionResult;
  onReset: () => void;
  moduleId: string;
  lessonId: string;
}

const QuizResults = ({ result, onReset, moduleId, lessonId }: QuizResultsProps) => {
  const { score, passed, totalQuestions, correctAnswers, incorrectAnswers } = result;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className={`text-3xl font-bold mb-2 ${passed ? "text-green-500" : "text-red-500"}`}>
          {passed ? "Quiz Passed!" : "Quiz Failed"}
        </div>
        <div className="text-xl mb-4">Your score: {score}%</div>
        
        <div className="flex justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-1" size={16} />
            <span>Correct: {correctAnswers}</span>
          </div>
          <div className="flex items-center">
            <XCircle className="text-red-500 mr-1" size={16} />
            <span>Incorrect: {incorrectAnswers}</span>
          </div>
          <div>Total: {totalQuestions} questions</div>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <YDButton onClick={onReset} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Try Again
        </YDButton>
        
        <Link to={`/modules/${moduleId}/lessons/${lessonId}`}>
          <YDButton>
            {passed ? "Back to Lesson" : "Review Lesson"}
          </YDButton>
        </Link>
      </div>
    </div>
  );
};

export default QuizResults;
