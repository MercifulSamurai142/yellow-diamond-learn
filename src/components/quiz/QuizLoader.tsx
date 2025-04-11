
interface QuizLoaderProps {
  isLoading: boolean;
}

const QuizLoader = ({ isLoading }: QuizLoaderProps) => {
  if (!isLoading) return null;
  
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
    </div>
  );
};

export default QuizLoader;
