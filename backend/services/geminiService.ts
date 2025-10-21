import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Updated model name - using the latest available Gemini model
const MODEL_NAME = "gemini-2.5-flash";

// Robust parser for Gemini responses. It attempts strict JSON.parse first,
// then falls back to extracting the first JSON object or array found in the
// text (useful when the model appends extra commentary or trailing tokens).
function parseGeminiResponse(text: string) {
    // Helper to strip common markdown/code fences
    const stripCodeFences = (s: string) => s.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    const cleaned = stripCodeFences(text || "");

    // Fast path: try strict parse
    try {
        return JSON.parse(cleaned);
    } catch (firstErr) {
        // Attempt to extract the first JSON block (object or array)
        try {
            const jsonBlockMatch = cleaned.match(/(\{(?:[\s\S]*?)\}|\[(?:[\s\S]*?)\])/m);
            if (jsonBlockMatch && jsonBlockMatch[0]) {
                const candidate = jsonBlockMatch[0];
                try {
                    return JSON.parse(candidate);
                } catch (innerErr) {
                    // As a last resort, try to find the first '{' and the last '}' and parse the substring
                    const firstObjStart = cleaned.indexOf('{');
                    const lastObjEnd = cleaned.lastIndexOf('}');
                    const firstArrStart = cleaned.indexOf('[');
                    const lastArrEnd = cleaned.lastIndexOf(']');

                    if (firstObjStart !== -1 && lastObjEnd !== -1 && lastObjEnd > firstObjStart) {
                        const sub = cleaned.slice(firstObjStart, lastObjEnd + 1);
                        return JSON.parse(sub);
                    }

                    if (firstArrStart !== -1 && lastArrEnd !== -1 && lastArrEnd > firstArrStart) {
                        const sub = cleaned.slice(firstArrStart, lastArrEnd + 1);
                        return JSON.parse(sub);
                    }

                    // nothing worked
                    console.error('Failed to parse extracted JSON block from Gemini response. Candidate block:', candidate);
                    throw innerErr;
                }
            }

            // If no JSON-like block was found, throw the original error
            throw firstErr;
        } catch (err) {
            console.error('Failed to parse Gemini response. Raw response:', text);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const e = err as any;
            throw new Error(`Invalid JSON response from Gemini: ${e?.message || 'Unknown error'}`);
        }
    }
}

export async function generateQuestions(domain: string, difficulty: string, interviewType: string) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
        Generate 5 ${difficulty} ${interviewType} interview questions for ${domain} developers.
        IMPORTANT: Return ONLY a valid JSON array, no markdown formatting or code blocks.
        Return JSON array:
        [{ "question": "string", "isCodingQuestion": boolean }]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseGeminiResponse(text);
}

export async function evaluateAnswer(question: string, answer: string) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
        Evaluate this answer to an interview question in detail.
        Question: ${question}
        Answer: ${answer}

        Provide specific, detailed feedback with examples of what was good and what could be improved.

        IMPORTANT: Return ONLY a valid JSON object, no markdown formatting or code blocks.
        Return JSON:
        {
            "score": number (0-10),
            "aiEvaluation": "Detailed feedback with specific insights"
        }
    `;
    const result = await model.generateContent(prompt);
    return parseGeminiResponse(result.response.text());
}

// Basic Gemini evaluation for FREE plan users - simpler, shorter feedback
export async function evaluateAnswerBasic(question: string, answer: string) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
        Evaluate this answer briefly.
        Question: ${question}
        Answer: ${answer}

        Provide a simple score and short feedback (1-2 sentences only). Keep it basic and concise.

        IMPORTANT: Return ONLY a valid JSON object, no markdown formatting or code blocks.
        Return JSON:
        {
            "score": number (0-10),
            "aiEvaluation": "Brief feedback (max 2 sentences)"
        }
    `;
    const result = await model.generateContent(prompt);
    return parseGeminiResponse(result.response.text());
}

export async function analyzeSession(qaList: unknown[]) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
        Analyze this interview session in detail:
        ${JSON.stringify(qaList)}

        Provide comprehensive, detailed feedback with specific examples and actionable insights.
        Include specific areas of strength, detailed weaknesses, and concrete improvement steps.

        IMPORTANT: Return ONLY a valid JSON object, no markdown formatting or code blocks.
        Return JSON:
        {
            "overallScore": number,
            "strengths": "Detailed analysis of what the candidate did well, with specific examples from their answers",
            "weaknesses": "In-depth analysis of areas needing improvement, with specific examples from their answers",
            "improvementTips": "Comprehensive, actionable recommendations with specific steps and resources to improve"
        }
    `;
    const result = await model.generateContent(prompt);
    return parseGeminiResponse(result.response.text());
}

// Basic Gemini analysis for FREE plan users - simpler, shorter overall feedback
export async function analyzeSessionBasic(qaList: unknown[]) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
        Analyze this interview session briefly:
        ${JSON.stringify(qaList)}

        Provide a basic summary. Keep it simple and concise (2-3 sentences per section).

        IMPORTANT: Return ONLY a valid JSON object, no markdown formatting or code blocks.
        Return JSON:
        {
            "overallScore": number,
            "strengths": "Brief summary of strengths (2-3 sentences)",
            "weaknesses": "Brief summary of weaknesses (2-3 sentences)",
            "improvementTips": "Simple improvement tips (2-3 sentences)"
        }
    `;
    const result = await model.generateContent(prompt);
    return parseGeminiResponse(result.response.text());
}

export async function generateCodingQuestion(domain: string, difficulty: string, language: string) {
    // Import the enhanced function from codingEvaluationService
    const { generateCodingQuestionWithGemini } = await import("./codingEvaluationService.js");
    return generateCodingQuestionWithGemini(domain, difficulty, language);
}

export async function evaluateCodeSolution(question: string, code: string, language: string, executionResults: Record<string, unknown>) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const { passedTests, totalTests, results, executionTime } = executionResults;
    const passRate = (typeof totalTests === "number" && totalTests > 0 && typeof passedTests === "number")
        ? (passedTests / totalTests) * 100
        : 0;

    const prompt = `
        Evaluate this coding solution for an interview question.
        Question: ${question}

        Code Solution:
        \`\`\`${language}
        ${code}
        \`\`\`

        Execution Results:
        - Tests Passed: ${passedTests}/${totalTests} (${passRate.toFixed(1)}%)
        - Execution Time: ${executionTime}ms
        - Test Results: ${JSON.stringify(results)}

        IMPORTANT: Return ONLY a valid JSON object, no markdown formatting or code blocks.
        Return JSON:
        {
            "overallScore": number (0-100),
            "breakdown": {
                "correctness": number,
                "codeQuality": number,
                "efficiency": number,
                "edgeCaseHandling": number
            },
            "feedback": "Detailed feedback",
            "strengths": ["strength 1", "strength 2"],
            "improvements": ["improvement 1", "improvement 2"],
            "timeComplexity": "Actual time complexity",
            "spaceComplexity": "Actual space complexity",
            "passedAllTests": boolean,
            "recommendations": "Suggestions for improvement"
        }
    `;
    const result = await model.generateContent(prompt);
    return parseGeminiResponse(result.response.text());
}

export async function generateTextInterviewQuestions(domain: string, difficulty: string, interviewType: string) {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `
            Generate 5 ${difficulty} level ${interviewType} interview questions for a ${domain} developer position.
            
            IMPORTANT: Return ONLY a valid JSON array, no markdown formatting or code blocks.
            
            Return JSON array:
            [
                {
                    "question": "The interview question text",
                    "category": "${interviewType}",
                    "estimatedTime": "estimated time in minutes",
                    "keyPoints": ["key point 1", "key point 2"],
                    "isCodingQuestion": false
                }
            ]
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        console.log("Generated questions response:", text);
        return parseGeminiResponse(text);
    } catch (error: unknown) {
        console.error("Error generating text interview questions:", error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;
        console.error("Error details:", {
            message: err?.message,
            status: err?.status,
            statusText: err?.statusText
        });
        throw new Error(`Failed to generate interview questions: ${err?.message || "Unknown error"}`);
    }
}

export async function evaluateTextAnswer(
    question: string,
    answer: string,
    domain: string,
    difficulty: string,
    interviewType: string
) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
        Evaluate this interview answer for a ${difficulty} level ${domain} ${interviewType} interview.
        Question: ${question}
        Candidate's Answer: ${answer}

        IMPORTANT: Return ONLY a valid JSON object, no markdown formatting or code blocks.
        Return JSON:
        {
            "score": number (0-10),
            "aiEvaluation": "Short feedback summary",
            "feedback": "Detailed constructive feedback",
            "strengths": ["strength 1"],
            "improvements": ["improvement 1"],
            "followUpQuestions": ["follow-up question 1"]
        }
    `;
    const result = await model.generateContent(prompt);
    return parseGeminiResponse(result.response.text());
}

/**
 * Evaluate overall interview performance based on all questions and answers
 */
export async function evaluateOverallPerformance(
    sessionData: {
        domain: string;
        difficulty: string;
        interviewType: string;
        duration: number;
        questions: Array<{
            questionText: string;
            userAnswer: string | null;
            score: number | null;
        }>;
    }
) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Calculate answered questions percentage
    const totalQuestions = sessionData.questions.length;
    const answeredQuestions = sessionData.questions.filter(q => q.userAnswer).length;
    const completionRate = (answeredQuestions / totalQuestions) * 100;

    // Calculate average score
    const scores = sessionData.questions
        .filter(q => q.score !== null)
        .map(q => q.score as number);
    const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;

    const prompt = `
        Evaluate the overall performance of a candidate in a ${sessionData.difficulty} level ${sessionData.domain} ${sessionData.interviewType} interview.
        
        Interview Statistics:
        - Total Questions: ${totalQuestions}
        - Answered Questions: ${answeredQuestions} (${completionRate.toFixed(1)}% completion)
        - Average Score: ${averageScore.toFixed(1)}/10
        - Duration: ${sessionData.duration} minutes
        
        Questions and Answers:
        ${sessionData.questions.map((q, idx) => `
        Q${idx + 1}: ${q.questionText}
        Answer: ${q.userAnswer || "No answer provided"}
        Score: ${q.score || "Not scored"}/10
        `).join('\n')}

        IMPORTANT: Return ONLY a valid JSON object, no markdown formatting or code blocks.
        Provide a comprehensive evaluation with the following structure:
        {
            "overallScore": number (0-100),
            "performanceRating": "Excellent|Good|Average|Below Average|Poor",
            "summary": "Overall performance summary (2-3 sentences)",
            "strengths": ["strength 1", "strength 2", "strength 3"],
            "weaknesses": ["weakness 1", "weakness 2"],
            "areasForImprovement": ["area 1", "area 2", "area 3"],
            "technicalSkillsAssessment": {
                "knowledgeDepth": number (0-100),
                "problemSolving": number (0-100),
                "communication": number (0-100),
                "technicalAccuracy": number (0-100)
            },
            "detailedFeedback": "Comprehensive feedback paragraph",
            "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
            "nextSteps": ["next step 1", "next step 2"],
            "readinessLevel": "Ready for ${sessionData.difficulty} roles|Needs more preparation|Excellent candidate"
        }
    `;

    const result = await model.generateContent(prompt);
    return parseGeminiResponse(result.response.text());
}
