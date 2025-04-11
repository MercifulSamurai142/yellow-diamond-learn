
import YDButton from "@/components/ui/YDButton";

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  selectedAnswer: string | undefined;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const QuizNavigation = ({ 
  currentQuestion, 
  totalQuestions, 
  selectedAnswer,
  onPrevious,
  onNext,
  onSubmit
}: QuizNavigationProps) => {
  return (
    <div className="flex justify-between">
      <YDButton 
        variant="outline" 
        onClick={onPrevious}
        disabled={currentQuestion === 0}
      >
        Previous
      </YDButton>
      
      {currentQuestion < totalQuestions - 1 ? (
        <YDButton 
          onClick={onNext}
          disabled={!selectedAnswer}
        >
          Next
        </YDButton>
      ) : (
        <YDButton 
          onClick={onSubmit}
          disabled={!selectedAnswer}
        >
          Submit Quiz
        </YDButton>
      )}
    </div>
  );
};

export default QuizNavigation;
