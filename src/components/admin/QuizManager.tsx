import { useState, useEffect } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, CheckCircle, XCircle } from "lucide-react";
import { Lesson, Quiz } from "@/pages/Admin";

interface QuizManagerProps {
  quizzes: Quiz[];
  lessons: Lesson[];
  onQuizzesUpdate: (quizzes: Quiz[]) => void;
  refreshData: () => Promise<void>;
}

const QuizManager = ({ quizzes, lessons, onQuizzesUpdate, refreshData }: QuizManagerProps) => {
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    lesson_id: "",
    pass_threshold: 70
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    answers: [
      { answer_text: "", is_correct: true, order: 1 },
      { answer_text: "", is_correct: false, order: 2 },
      { answer_text: "", is_correct: false, order: 3 },
      { answer_text: "", is_correct: false, order: 4 }
    ],
    order: 1
  });
  
  useEffect(() => {
    if (activeQuizId) {
      fetchQuestions(activeQuizId);
    }
  }, [activeQuizId]);

  const fetchQuestions = async (quizId: string) => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*, answers(*)")
        .eq("quiz_id", quizId)
        .order("order");
        
      if (questionsError) throw questionsError;
      
      // Sort answers by order for each question
      const processedQuestions = questionsData.map(question => ({
        ...question,
        answers: question.answers.sort((a: any, b: any) => a.order - b.order)
      }));
      
      setQuestions(processedQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch questions",
      });
    }
  };

  const handleAddQuiz = async () => {
    try {
      if (!newQuiz.title || !newQuiz.lesson_id) {
        toast({
          title: "Error",
          description: "Quiz title and lesson are required",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("quizzes")
        .insert({
          title: newQuiz.title,
          lesson_id: newQuiz.lesson_id,
          pass_threshold: newQuiz.pass_threshold
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz added successfully",
      });

      // Update local state
      if (data) {
        onQuizzesUpdate([...quizzes, data[0]]);
        setActiveQuizId(data[0].id);
      }

      // Reset form but keep adding questions
      setIsAddingQuiz(false);
      setEditingQuizId(null);
      setNewQuiz({
        title: "",
        lesson_id: "",
        pass_threshold: 70
      });
      
      await refreshData();
    } catch (error) {
      console.error("Error adding quiz:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add quiz",
      });
    }
  };

  const handleEditQuiz = async (quizId: string) => {
    const quizToEdit = quizzes.find(q => q.id === quizId);
    if (!quizToEdit) return;

    setEditingQuizId(quizId);
    setNewQuiz({
      title: quizToEdit.title,
      lesson_id: quizToEdit.lesson_id || "",
      pass_threshold: quizToEdit.pass_threshold
    });
    setIsAddingQuiz(true);
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuizId) return;

    try {
      if (!newQuiz.title || !newQuiz.lesson_id) {
        toast({
          title: "Error",
          description: "Quiz title and lesson are required",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("quizzes")
        .update({
          title: newQuiz.title,
          lesson_id: newQuiz.lesson_id,
          pass_threshold: newQuiz.pass_threshold
        })
        .eq("id", editingQuizId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });

      // Update local state
      const updatedQuizzes = quizzes.map(quiz => {
        if (quiz.id === editingQuizId) {
          return {
            ...quiz,
            title: newQuiz.title,
            lesson_id: newQuiz.lesson_id,
            pass_threshold: newQuiz.pass_threshold
          };
        }
        return quiz;
      });
      onQuizzesUpdate(updatedQuizzes);

      // Reset form
      setIsAddingQuiz(false);
      setEditingQuizId(null);
      setNewQuiz({
        title: "",
        lesson_id: "",
        pass_threshold: 70
      });
      
      await refreshData();
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update quiz",
      });
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      // First delete all questions (which will cascade delete answers)
      const { error: questionsError } = await supabase
        .from("questions")
        .delete()
        .eq("quiz_id", quizId);

      if (questionsError) throw questionsError;

      // Then delete the quiz
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });

      // Update local state
      onQuizzesUpdate(quizzes.filter(quiz => quiz.id !== quizId));
      if (activeQuizId === quizId) {
        setActiveQuizId(null);
        setQuestions([]);
      }
      
      await refreshData();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete quiz",
      });
    }
  };

  const handleAddQuestion = async () => {
    if (!activeQuizId) return;
    
    try {
      if (!newQuestion.question_text || newQuestion.answers.some(a => !a.answer_text)) {
        toast({
          title: "Error",
          description: "Question text and all answer options are required",
          variant: "destructive",
        });
        return;
      }

      // Make sure at least one answer is marked as correct
      if (!newQuestion.answers.some(a => a.is_correct)) {
        toast({
          title: "Error",
          description: "At least one answer must be marked as correct",
          variant: "destructive",
        });
        return;
      }

      // 1. Add question
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert({
          question_text: newQuestion.question_text,
          quiz_id: activeQuizId,
          order: newQuestion.order
        })
        .select();

      if (questionError) throw questionError;

      // 2. Add answers for the question
      const answersToInsert = newQuestion.answers.map((answer, idx) => ({
        answer_text: answer.answer_text,
        is_correct: answer.is_correct,
        order: answer.order,
        question_id: questionData[0].id
      }));

      const { error: answersError } = await supabase
        .from("answers")
        .insert(answersToInsert);

      if (answersError) throw answersError;

      toast({
        title: "Success",
        description: "Question added successfully",
      });

      // Refresh questions for the quiz
      fetchQuestions(activeQuizId);

      // Reset the question form but keep adding questions
      setNewQuestion({
        question_text: "",
        answers: [
          { answer_text: "", is_correct: true, order: 1 },
          { answer_text: "", is_correct: false, order: 2 },
          { answer_text: "", is_correct: false, order: 3 },
          { answer_text: "", is_correct: false, order: 4 }
        ],
        order: questions.length + 1
      });
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add question",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      // Delete answers first (should be handled by cascading delete, but being explicit)
      const { error: answersError } = await supabase
        .from("answers")
        .delete()
        .eq("question_id", questionId);

      if (answersError) throw answersError;

      // Delete question
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });

      // Refresh questions
      if (activeQuizId) {
        fetchQuestions(activeQuizId);
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete question",
      });
    }
  };

  const updateAnswerField = (index: number, field: string, value: any) => {
    const newAnswers = [...newQuestion.answers];
    
    if (field === 'is_correct') {
      // If setting this answer as correct, make all others incorrect
      newAnswers.forEach((answer, idx) => {
        newAnswers[idx] = {
          ...answer,
          is_correct: idx === index
        };
      });
    } else {
      // For other fields, just update the specific answer
      newAnswers[index] = {
        ...newAnswers[index],
        [field]: value
      };
    }
    
    setNewQuestion({
      ...newQuestion,
      answers: newAnswers
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Quizzes</h3>
        {!isAddingQuiz && !activeQuizId && (
          <YDButton onClick={() => setIsAddingQuiz(true)}>
            <Plus size={16} className="mr-2" /> Add Quiz
          </YDButton>
        )}
        {activeQuizId && (
          <YDButton variant="outline" onClick={() => {
            setActiveQuizId(null);
            setQuestions([]);
          }}>
            Back to Quizzes
          </YDButton>
        )}
      </div>

      {isAddingQuiz && (
        <YDCard className="p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">
            {editingQuizId ? "Edit Quiz" : "Add New Quiz"}
          </h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quizLesson">Lesson</Label>
              <Select
                value={newQuiz.lesson_id}
                onValueChange={(value) => setNewQuiz({ ...newQuiz, lesson_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lesson" />
                </SelectTrigger>
                <SelectContent>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quizTitle">Quiz Title</Label>
              <Input
                id="quizTitle"
                value={newQuiz.title}
                onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                placeholder="Enter quiz title"
              />
            </div>
            
            <div>
              <Label htmlFor="passThreshold">Pass Threshold (%)</Label>
              <Input
                id="passThreshold"
                type="number"
                value={newQuiz.pass_threshold}
                onChange={(e) => setNewQuiz({ ...newQuiz, pass_threshold: parseInt(e.target.value) || 70 })}
                min="1"
                max="100"
              />
            </div>
            
            <div className="flex space-x-2">
              {editingQuizId ? (
                <YDButton onClick={handleUpdateQuiz}>Update Quiz</YDButton>
              ) : (
                <YDButton onClick={handleAddQuiz}>Add Quiz</YDButton>
              )}
              <YDButton variant="outline" onClick={() => {
                setIsAddingQuiz(false);
                setEditingQuizId(null);
                setNewQuiz({
                  title: "",
                  lesson_id: "",
                  pass_threshold: 70
                });
              }}>
                Cancel
              </YDButton>
            </div>
          </div>
        </YDCard>
      )}

      {!activeQuizId && !isAddingQuiz && (
        <div className="space-y-4">
          {quizzes.length === 0 ? (
            <YDCard>
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No quizzes found. Create your first quiz.</p>
              </div>
            </YDCard>
          ) : (
            quizzes.map((quiz) => {
              const lessonTitle = lessons.find(l => l.id === quiz.lesson_id)?.title || 'Unknown Lesson';
              return (
                <YDCard key={quiz.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium">{quiz.title}</h4>
                      <p className="text-muted-foreground mt-1">Lesson: {lessonTitle}</p>
                      <p className="text-muted-foreground">Pass Threshold: {quiz.pass_threshold}%</p>
                    </div>
                    <div className="flex space-x-2">
                      <YDButton
                        onClick={() => setActiveQuizId(quiz.id)}
                      >
                        Manage Questions
                      </YDButton>
                      <YDButton
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditQuiz(quiz.id)}
                      >
                        <Pencil size={16} />
                      </YDButton>
                      <YDButton
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                      >
                        <Trash2 size={16} />
                      </YDButton>
                    </div>
                  </div>
                </YDCard>
              );
            })
          )}
        </div>
      )}

      {activeQuizId && (
        <div>
          <YDCard className="p-6 mb-6">
            <h4 className="text-lg font-medium mb-4">Add New Question</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="questionText">Question Text</Label>
                <Input
                  id="questionText"
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  placeholder="Enter your question"
                />
              </div>
              
              <div>
                <Label className="mb-2 block">Answer Options</Label>
                <div className="space-y-3">
                  {newQuestion.answers.map((answer, index) => (
                    <div key={index} className="flex space-x-2 items-center">
                      <Input
                        value={answer.answer_text}
                        onChange={(e) => updateAnswerField(index, 'answer_text', e.target.value)}
                        placeholder={`Answer option ${index + 1}`}
                      />
                      <YDButton
                        type="button"
                        variant={answer.is_correct ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateAnswerField(index, 'is_correct', true)}
                        className="flex-shrink-0"
                      >
                        {answer.is_correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </YDButton>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="questionOrder">Order</Label>
                <Input
                  id="questionOrder"
                  type="number"
                  value={newQuestion.order}
                  onChange={(e) => setNewQuestion({ ...newQuestion, order: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
              
              <div>
                <YDButton onClick={handleAddQuestion}>Add Question</YDButton>
              </div>
            </div>
          </YDCard>
          
          <h4 className="text-lg font-medium mb-4">Questions</h4>
          <div className="space-y-4">
            {questions.length === 0 ? (
              <YDCard>
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No questions found for this quiz. Add your first question.</p>
                </div>
              </YDCard>
            ) : (
              questions
                .sort((a, b) => a.order - b.order)
                .map((question, qIndex) => (
                  <YDCard key={question.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-primary/20 text-primary rounded-full mr-2">
                            {qIndex + 1}
                          </span>
                          {question.question_text}
                        </h4>
                        <div className="mt-4 space-y-2 pl-8">
                          {question.answers
                            .sort((a: any, b: any) => a.order - b.order)
                            .map((answer: any, aIndex: number) => (
                              <div
                                key={answer.id}
                                className={`flex items-center p-2 rounded ${answer.is_correct ? 'bg-green-50' : ''}`}
                              >
                                {answer.is_correct && (
                                  <CheckCircle size={16} className="text-green-500 mr-2" />
                                )}
                                <span>{answer.answer_text}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                      <YDButton
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 size={16} />
                      </YDButton>
                    </div>
                  </YDCard>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManager;
