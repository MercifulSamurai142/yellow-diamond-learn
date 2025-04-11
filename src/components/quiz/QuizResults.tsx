
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizResultsProps {
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
  passThreshold: number;
  onReturnToModules: () => void;
}

const QuizResults = ({ score, passThreshold, onReturnToModules }: QuizResultsProps) => {
  return (
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
          
          {score.percentage >= passThreshold ? (
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
          
          <YDButton onClick={onReturnToModules}>
            Return to Modules
          </YDButton>
        </div>
      </YDCard>
    </>
  );
};

export default QuizResults;
