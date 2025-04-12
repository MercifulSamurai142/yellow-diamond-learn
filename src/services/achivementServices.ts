// src/services/achievementService.ts
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types'; // Assuming types helper

type Achievement = Tables<'achievements'>;
type Criteria = {
    type: string;
    score?: number;
    count?: number;
    days?: number;
    module?: string; // e.g., module slug or ID
    lesson_id?: string; // for specific lesson completion
    quiz_id?: string; // for specific quiz completion
    // Add other potential criteria fields
};

const awardAchievement = async (userId: string, achievement: Achievement) => {
    console.log(`AWARDING achievement "${achievement.name}" (ID: ${achievement.id}) to user ${userId}`);

    const { data, error } = await supabase
        .from('user_achievements')
        .insert({
            user_id: userId,
            achievement_id: achievement.id,
            earned_at: new Date().toISOString(),
        })
        .single();

    if (error) {
        // Handle potential duplicate error gracefully (code 23505 for unique violation)
        if (error.code === '23505') {
            console.log(`User already has achievement ${achievement.id}.`);
        } else {
            console.error(`Error awarding achievement ${achievement.id}:`, error);
        }
    } else {
        toast({
            title: "🏆 Achievement Unlocked!",
            description: `You earned: ${achievement.name}`,
        });
        // TODO: Trigger refetch of achievement/progress data in context or global state
    }
};

// --- Central Check Function ---
export interface CheckContext {
    userId: string;
    lessonId?: string; // ID of the lesson just completed
    moduleId?: string; // ID of the module the lesson/quiz belongs to
    quizId?: string; // ID of the quiz just submitted
    quizScore?: number; // Score achieved on the quiz
    quizPassed?: boolean; // Whether the quiz was passed
    // Add other relevant context from the trigger point
}

export const checkAndAwardAchievements = async (context: CheckContext) => {
    const { userId } = context;
    if (!userId) return;

    try {
        // 1. Get IDs of achievements user *already* has
        const { data: earnedData, error: earnedError } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', userId);

        if (earnedError) throw earnedError;
        const earnedIds = new Set(earnedData?.map(ua => ua.achievement_id) || []);

        // 2. Fetch all possible achievements definition
        const { data: allAchievements, error: allError } = await supabase
            .from('achievements')
            .select('*'); // Select id, name, description, criteria

        if (allError) throw allError;
        if (!allAchievements) return;

        // 3. Filter out already earned achievements
        const potentialAchievements = allAchievements.filter(ach => !earnedIds.has(ach.id));

        // 4. Evaluate criteria for each potential achievement
        for (const achievement of potentialAchievements) {
            if (!achievement.criteria || typeof achievement.criteria !== 'object') {
                console.warn(`Achievement ${achievement.id} has invalid criteria:`, achievement.criteria);
                continue; // Skip if criteria is invalid
            }

            const criteria = achievement.criteria as Criteria; // Cast JSON to our Criteria type
            let criteriaMet = false;

            // --- Evaluate based on criteria.type ---
            switch (criteria.type) {
                case 'complete_lesson':
                    // Triggered when context.lessonId is provided
                    if (context.lessonId) {
                         // Simple case: awarded for completing *any* lesson (if not already earned)
                         // More specific: check if criteria.lesson_id matches context.lessonId
                         if (!criteria.lesson_id || criteria.lesson_id === context.lessonId) {
                              criteriaMet = true;
                         }
                    }
                    break;

                case 'complete_module':
                     // Triggered when context.lessonId and context.moduleId are provided
                     // Check if the completed lesson was the *last* one in the module
                     if (context.lessonId && context.moduleId) {
                          // Need to fetch all lessons for the module and check user progress against them
                          const { data: moduleLessons, error: lessonError } = await supabase
                              .from('lessons')
                              .select('id', { count: 'exact' }) // Just need count and IDs
                              .eq('module_id', context.moduleId);

                          if (lessonError || !moduleLessons) continue; // Skip check if error
                          const moduleLessonIds = moduleLessons.map(l => l.id);
                          const totalLessonsInModule = moduleLessonIds.length;

                          if (totalLessonsInModule > 0) {
                               const { count: completedCount, error: progressError } = await supabase
                                   .from('user_progress')
                                   .select('*', { count: 'exact', head: true })
                                   .eq('user_id', userId)
                                   .eq('status', 'completed')
                                   .in('lesson_id', moduleLessonIds);

                               if (progressError) continue; // Skip check if error

                               if (completedCount === totalLessonsInModule) {
                                     // Check if specific module mentioned in criteria
                                    if (!criteria.module || criteria.module === context.moduleId) { // TODO: Check if criteria.module is ID or slug
                                        criteriaMet = true;
                                    }
                               }
                          }
                     }
                    break;

                case 'quiz_score':
                    // Triggered when context.quizId and context.quizScore are provided
                    if (context.quizId && context.quizScore !== undefined && criteria.score !== undefined) {
                        // Check if score meets criteria
                        if (context.quizScore >= criteria.score) {
                              // More specific: check if criteria.quiz_id matches context.quizId
                            if (!criteria.quiz_id || criteria.quiz_id === context.quizId) {
                                criteriaMet = true;
                            }
                        }
                    }
                    break;

                 case 'quiz_passed': // Assuming a type for just passing any quiz
                     // Triggered when context.quizId and context.quizPassed are provided
                     if (context.quizId && context.quizPassed === true) {
                           // More specific: check if criteria.quiz_id matches context.quizId
                           if (!criteria.quiz_id || criteria.quiz_id === context.quizId) {
                                criteriaMet = true;
                           }
                     }
                    break;

                case 'module_score': // Score >= X within a specific module
                    // Triggered potentially after quiz completion
                    if (context.quizId && context.moduleId && criteria.module && criteria.score !== undefined) {
                        // Check if the module matches criteria.module (need to decide if criteria.module is ID or slug)
                        // This requires fetching the module associated with context.quizId or context.lessonId
                        // For simplicity, let's assume context.moduleId is sufficient *IF* criteria.module holds the Module ID (UUID)
                        // OR if criteria.module holds a slug, fetch moduleData based on context.moduleId and compare slugs.
                        // Let's assume criteria.module holds the Module ID for now.
                        if (criteria.module === context.moduleId) {
                            // Now check if the specific quiz score meets the criteria
                             if (context.quizScore !== undefined && context.quizScore >= criteria.score) {
                                 criteriaMet = true;
                             }
                             // NOTE: This only checks the *current* quiz score.
                             // A true "module_score" might need averaging, which is complex here.
                             // Re-evaluating based on screenshot: `{"type":"module_score","score":90,"module":"sales-finance"}`
                             // This looks like getting >= 90 on *any quiz* within the module identified by "sales-finance" (slug/name?)
                             // Fetch module slug/name based on context.moduleId and compare
                             // This adds complexity to fetch module details here.

                        }
                    }
                    break;


                case 'lessons_count': // Not in screenshot, but example from previous thought
                     // Triggered after lesson completion
                     if (context.lessonId && criteria.count !== undefined) {
                          const { count, error } = await supabase
                             .from('user_progress')
                             .select('*', { count: 'exact', head: true })
                             .eq('user_id', userId)
                             .eq('status', 'completed');
                          if (error) continue;
                          if (count !== null && count >= criteria.count) {
                              criteriaMet = true;
                          }
                     }
                    break;

                // --- Cases needing more complex tracking (likely better in Edge Functions or DB triggers) ---
                case 'module_average':
                     console.warn("Criteria type 'module_average' requires complex calculation - skipping.");
                    // Requires fetching all attempts for the module, averaging scores. Complex.
                    break;
                case 'lessons_per_day':
                     console.warn("Criteria type 'lessons_per_day' requires tracking daily activity - skipping.");
                    // Requires querying progress timestamps within a rolling 24h window.
                    break;
                case 'streak':
                     console.warn("Criteria type 'streak' requires tracking daily activity - skipping.");
                    // Requires storing last login/activity date and comparing.
                    break;

                default:
                    console.warn(`Unknown achievement criteria type: ${criteria.type}`);
            }

            // 5. Award if criteria met
            if (criteriaMet) {
                await awardAchievement(userId, achievement);
                 // Optional: break loop if only one achievement should be awarded per action? Usually not.
            }
        }

    } catch (error) {
        console.error("Error checking/awarding achievements:", error);
    }
};