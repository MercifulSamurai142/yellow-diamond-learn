
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface QuizHeaderProps {
  moduleId: string;
  lessonId: string;
  currentQuestion: number;
  totalQuestions: number;
}

const QuizHeader = ({ moduleId, lessonId, currentQuestion, totalQuestions }: QuizHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <Link to={`/modules/${moduleId}/lessons/${lessonId}`} className="text-primary hover:underline flex items-center">
        <ArrowLeft size={16} className="mr-1" />
        Back to lesson
      </Link>
      <div className="text-sm text-muted-foreground">
        Question {currentQuestion + 1} of {totalQuestions}
      </div>
    </div>
  );
};

export default QuizHeader;
