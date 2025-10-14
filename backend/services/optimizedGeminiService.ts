import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash";

// Cache for questions to avoid repeated API calls
const questionCache = new Map<string, CachedQuestions>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedQuestions {
    questions: any[];
    timestamp: number;
}

// Optimized question generation with caching
export async function generateTextInterviewQuestionsOptimized(domain: string, difficulty: string, interviewType: string) {
    const cacheKey = `${domain}-${difficulty}-${interviewType}`;
    const cached = questionCache.get(cacheKey);

    // Return cached questions if available and not expired
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log("Returning cached questions for:", cacheKey);
        return cached.questions;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000, // Limit output size for faster generation
            }
        });

        const prompt = `Generate 3 concise ${difficulty} ${interviewType} interview questions for ${domain} development.
        Keep questions focused and practical.
        Return as JSON array: [{"question": "text"}]
        No markdown formatting.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const questions = parseGeminiResponse(text);

        // Cache the results
        questionCache.set(cacheKey, {
            questions,
            timestamp: Date.now()
        });

        return questions;
    } catch (error) {
        console.error("Error generating questions:", error);

        // Return fallback questions instead of failing
        return getFallbackQuestions(domain, difficulty, interviewType);
    }
}

// Single question generation for dynamic loading
export async function generateSingleTextQuestion(domain: string, difficulty: string, interviewType: string, questionNumber: number) {
    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300, // Smaller output for single question
            }
        });

        const prompt = `Generate 1 ${difficulty} ${interviewType} question for ${domain} development.
        Question should be practical and interview-appropriate.
        Return only the question text, no JSON formatting.`;

        const result = await model.generateContent(prompt);
        const questionText = result.response.text().trim();

        return { question: questionText };
    } catch (error) {
        console.error("Error generating single question:", error);

        // Return fallback question
        const fallbackQuestions = getFallbackQuestions(domain, difficulty, interviewType);
        return fallbackQuestions[questionNumber % fallbackQuestions.length];
    }
}

// Optimized evaluation with simplified scoring
export async function evaluateTextAnswerOptimized(question: string, answer: string) {
    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 200, // Shorter evaluation for speed
            }
        });

        const prompt = `Evaluate this interview answer briefly:
        Q: ${question}
        A: ${answer}
        
        Return JSON: {"score": number(1-10), "feedback": "brief feedback"}
        No markdown formatting.`;

        const result = await model.generateContent(prompt);
        const evaluation = parseGeminiResponse(result.response.text());

        return {
            score: evaluation.score || 5,
            aiEvaluation: evaluation.feedback || "Good answer",
            feedback: evaluation.feedback || "Your answer has been recorded."
        };
    } catch (error) {
        console.error("Error evaluating answer:", error);

        // Return default evaluation instead of failing
        return {
            score: 5,
            aiEvaluation: "Unable to evaluate at this time",
            feedback: "Your answer has been recorded successfully."
        };
    }
}

// Batch evaluation for multiple answers (background processing)
export async function batchEvaluateAnswers(questionAnswerPairs: Array<{ id: number, question: string, answer: string }>) {
    const evaluations = [];

    for (const pair of questionAnswerPairs) {
        try {
            const evaluation = await evaluateTextAnswerOptimized(pair.question, pair.answer);
            evaluations.push({
                questionId: pair.id,
                ...evaluation
            });
        } catch (error) {
            console.error(`Failed to evaluate question ${pair.id}:`, error);
            evaluations.push({
                questionId: pair.id,
                score: 5,
                aiEvaluation: "Evaluation unavailable",
                feedback: "Answer recorded"
            });
        }
    }

    return evaluations;
}

// Helper function to parse Gemini responses
function parseGeminiResponse(text: string) {
    try {
        const cleanedText = text
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Failed to parse Gemini response:", text);
        throw new Error("Invalid JSON response from Gemini");
    }
}

// Fallback questions when AI is unavailable
function getFallbackQuestions(domain: string, difficulty: string, interviewType: string) {
    const fallbackData = {
        technical: {
            frontend: [
                { question: "Explain the difference between let, const, and var in JavaScript." },
                { question: "How do you optimize React component performance?" },
                { question: "What are the key differences between REST and GraphQL APIs?" }
            ],
            backend: [
                { question: "Explain the concept of database indexing and its benefits." },
                { question: "How would you design a RESTful API for user authentication?" },
                { question: "What are the differences between SQL and NoSQL databases?" }
            ],
            fullstack: [
                { question: "How would you implement user authentication across frontend and backend?" },
                { question: "Explain the MVC architecture pattern and its benefits." },
                { question: "How do you handle data validation in a full-stack application?" }
            ]
        },
        behavioral: {
            general: [
                { question: "Tell me about a challenging project you worked on and how you overcame obstacles." },
                { question: "How do you handle working with difficult team members?" },
                { question: "Describe a time when you had to learn a new technology quickly." }
            ]
        }
    };

    const categoryQuestions = fallbackData[interviewType as keyof typeof fallbackData];
    if (categoryQuestions) {
        const domainQuestions = categoryQuestions[domain as keyof typeof categoryQuestions] ||
            categoryQuestions["general" as keyof typeof categoryQuestions] ||
            Object.values(categoryQuestions)[0];
        return domainQuestions;
    }

    return [
        { question: "Tell me about your experience with software development." },
        { question: "How do you approach problem-solving in your work?" },
        { question: "What technologies are you most comfortable working with?" }
    ];
}

// Clear cache function (for maintenance)
export function clearQuestionCache() {
    questionCache.clear();
    console.log("Question cache cleared");
}

// Pre-warm cache with common question combinations
export async function preWarmCache() {
    const commonCombinations = [
        ["frontend", "intermediate", "technical"],
        ["backend", "intermediate", "technical"],
        ["fullstack", "intermediate", "technical"],
        ["frontend", "beginner", "technical"],
        ["backend", "beginner", "technical"],
    ];

    console.log("Pre-warming question cache...");

    const promises = commonCombinations.map(([domain, difficulty, type]) =>
        generateTextInterviewQuestionsOptimized(domain, difficulty, type)
            .catch(error => console.error(`Failed to pre-warm cache for ${domain}-${difficulty}-${type}:`, error))
    );

    await Promise.allSettled(promises);
    console.log("Cache pre-warming completed");
}