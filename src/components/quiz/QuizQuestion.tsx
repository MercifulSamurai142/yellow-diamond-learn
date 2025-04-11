
import { useState } from "react";
import { YDCard } from "@/components/ui/YDCard";

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question_text: string;
  answers: Answer[];
}

interface QuizQuestionProps {
  question: Question;
  selectedAnswer: string | undefined;
  onAnswerSelect: (questionId: string, answerId: string) => void;
}

const QuizQuestion = ({ question, selectedAnswer, onAnswerSelect }: QuizQuestionProps) => {
  return (
    <YDCard className="mb-8">
      <div className="p-6">
        <h3 className="text-lg font-medium mb-6">{question.question_text}</h3>
        
        <div className="space-y-4">
          {question.answers.map((answer) => (
            <div 
              key={answer.id}
              className={`p-4 border rounded-md cursor-pointer transition-all ${
                selectedAnswer === answer.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary'
              }`}
              onClick={() => onAnswerSelect(question.id, answer.id)}
            >
              {answer.answer_text}
            </div>
          ))}
        </div>
      </div>
    </YDCard>
  );
};

export default QuizQuestion;
