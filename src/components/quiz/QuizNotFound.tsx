
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface QuizNotFoundProps {
  moduleId: string;
  lessonId: string;
}

const QuizNotFound = ({ moduleId, lessonId }: QuizNotFoundProps) => {
  return (
    <div className="flex items-center justify-center h-full flex-col">
      <h2 className="text-xl font-semibold mb-4">Quiz not found</h2>
      <Link to={`/modules/${moduleId}/lessons/${lessonId}`} className="text-primary hover:underline flex items-center">
        <ArrowLeft size={16} className="mr-1" />
        Back to lesson
      </Link>
    </div>
  );
};

export default QuizNotFound;
