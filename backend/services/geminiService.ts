import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Updated model name - using the latest available Gemini model
const MODEL_NAME = "gemini-2.5-flash";

// Helper function to clean and parse JSON responses from Gemini
function parseGeminiResponse(text: string) {
    try {
        // Clean the response to remove markdown code blocks
        const cleanedText = text
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

        return JSON.parse(cleanedText);
    } catch (error: unknown) {
        console.error("Failed to parse Gemini response:", text);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;
        throw new Error(`Invalid JSON response from Gemini: ${err?.message || "Unknown error"}`);
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
        Evaluate this answer to an interview question.
        Question: ${question}
        Answer: ${answer}

        IMPORTANT: Return ONLY a valid JSON object, no markdown formatting or code blocks.
        Return JSON:
        {
            "score": number (0-10),
            "aiEvaluation": "short feedback"
        }
    `;
    const result = await model.generateContent(prompt);
    return parseGeminiResponse(result.response.text());
}

export async function analyzeSession(qaList: unknown[]) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
        Analyze this interview session:
        ${JSON.stringify(qaList)}

        IMPORTANT: Return ONLY a valid JSON object, no markdown formatting or code blocks.
        Return JSON:
        {
            "overallScore": number,
            "strengths": "string",
            "weaknesses": "string",
            "improvementTips": "string"
        }
    `;
    const result = await model.generateContent(prompt);
    return parseGeminiResponse(result.response.text());
}

export async function generateCodingQuestion(domain: string, difficulty: string, language: string) {
    // Import the enhanced function from codingEvaluationService
    const { generateCodingQuestionWithGemini } = await import("./codingEvaluationService");
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
