import { GoogleGenerativeAI } from "@google/generative-ai";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility: Execute code with timeout
function executeCommand(command: string, args: string[], cwd: string, timeout = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd });
        let stdout = "";
        let stderr = "";

        child.stdout?.on("data", (data) => { stdout += data.toString(); });
        child.stderr?.on("data", (data) => { stderr += data.toString(); });

        child.on("close", (code) => {
            if (code === 0) resolve(stdout);
            else reject(new Error(stderr || `Process exited with code ${code}`));
        });

        child.on("error", (error) => reject(error));

        // Timeout safeguard
        setTimeout(() => {
            child.kill();
            reject(new Error("Execution timeout"));
        }, timeout);
    });
}

// Enhanced Gemini-powered coding question generator
export async function generateCodingQuestionWithGemini(
    domain: string,
    difficulty: string,
    language: string
): Promise<{
    title: string;
    description: string;
    difficulty: string;
    language: string;
    starterCode: string;
    testCases: Array<{ input: string; expectedOutput: string; description?: string }>;
    hints?: string[];
    timeComplexityExpected?: string;
    spaceComplexityExpected?: string;
}> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Generate a single ${difficulty} level coding interview question for ${domain} domain using ${language} programming language.

    Requirements:
    1. Create ONE realistic technical interview question appropriate for ${domain} development
    2. Include a clear problem description with examples and constraints
    3. Provide starter code template in ${language}
    4. Generate exactly 5 comprehensive test cases with inputs and expected outputs
    5. Include 2-3 helpful hints without giving away the solution
    6. Specify expected time and space complexity
    7. Make the problem interview-appropriate (solvable in 20-45 minutes)

    Domain context for ${domain}:
    - Frontend: Focus on algorithms, data structures, DOM manipulation, string processing
    - Backend: Focus on APIs, data processing, algorithms, system efficiency
    - Fullstack: Mix of frontend and backend concepts
    - Data Science: Focus on data analysis, statistics, machine learning algorithms
    - Mobile: Focus on performance, algorithms suitable for mobile constraints
    - DevOps: Focus on automation, scripting, system operations

    Difficulty guidelines:
    - Beginner: Basic loops, conditionals, simple data structures (arrays, strings)
    - Intermediate: Hash maps, arrays, strings, basic algorithms, two pointers
    - Advanced: Complex algorithms, optimization, dynamic programming, graph algorithms

    Return ONLY valid JSON in this exact format:
    {
        "title": "Problem Title",
        "description": "Detailed problem description with examples, constraints, and sample input/output",
        "difficulty": "${difficulty}",
        "language": "${language}",
        "starterCode": "// Starter code template with function signature",
        "testCases": [
            {
                "input": "input parameters",
                "expectedOutput": "expected result",
                "description": "test case description"
            },
            {
                "input": "input parameters",
                "expectedOutput": "expected result", 
                "description": "test case description"
            },
            {
                "input": "input parameters",
                "expectedOutput": "expected result",
                "description": "test case description"
            },
            {
                "input": "input parameters",
                "expectedOutput": "expected result",
                "description": "test case description"
            },
            {
                "input": "input parameters",
                "expectedOutput": "expected result",
                "description": "test case description"
            }
        ],
        "hints": ["hint1", "hint2", "hint3"],
        "timeComplexityExpected": "O(n)",
        "spaceComplexityExpected": "O(1)"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Clean the response to ensure it's valid JSON
        const cleanedResponse = responseText
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .replace(/^\s*[\r\n]/gm, ""); // Remove empty lines

        const questionData = JSON.parse(cleanedResponse);

        // Validate the response structure
        if (!questionData.title || !questionData.description || !questionData.starterCode || !questionData.testCases) {
            throw new Error("Invalid question structure returned from Gemini");
        }

        return questionData;
    } catch (error) {
        console.error("Error generating coding question with Gemini:", error);

        // Fallback to a basic question if Gemini fails
        return getFallbackQuestion(domain, difficulty, language);
    }
}

// Fallback question generator in case Gemini fails
function getFallbackQuestion(domain: string, difficulty: string, language: string) {
    const fallbackQuestions = {
        beginner: {
            title: "Two Sum",
            description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
            starterCode: getStarterCodeForLanguage(language, "twoSum"),
            testCases: [
                { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", description: "2 + 7 = 9" },
                { input: "[3,2,4], 6", expectedOutput: "[1,2]", description: "2 + 4 = 6" },
                { input: "[3,3], 6", expectedOutput: "[0,1]", description: "3 + 3 = 6" }
            ]
        },
        intermediate: {
            title: "Valid Parentheses",
            description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order.",
            starterCode: getStarterCodeForLanguage(language, "validParentheses"),
            testCases: [
                { input: "()", expectedOutput: "true", description: "Valid single pair" },
                { input: "()[]{}", expectedOutput: "true", description: "Valid multiple pairs" },
                { input: "(]", expectedOutput: "false", description: "Mismatched brackets" },
                { input: "([)]", expectedOutput: "false", description: "Incorrect order" }
            ]
        },
        advanced: {
            title: "Longest Substring Without Repeating Characters",
            description: "Given a string s, find the length of the longest substring without repeating characters.",
            starterCode: getStarterCodeForLanguage(language, "longestSubstring"),
            testCases: [
                { input: "abcabcbb", expectedOutput: "3", description: "abc" },
                { input: "bbbbb", expectedOutput: "1", description: "b" },
                { input: "pwwkew", expectedOutput: "3", description: "wke" }
            ]
        }
    };

    const questionKey = difficulty.toLowerCase() as keyof typeof fallbackQuestions;
    const baseQuestion = fallbackQuestions[questionKey] || fallbackQuestions.beginner;

    return {
        ...baseQuestion,
        difficulty,
        language,
        hints: ["Think about the data structures you might need", "Consider the time complexity requirements"],
        timeComplexityExpected: "O(n)",
        spaceComplexityExpected: "O(1)"
    };
}

// Helper function to generate starter code for different languages
function getStarterCodeForLanguage(language: string, problemType: string): string {
    const templates: Record<string, Record<string, string>> = {
        javascript: {
            twoSum: `function twoSum(nums, target) {
    // Your solution here
    
}`,
            validParentheses: `function isValid(s) {
    // Your solution here
    
}`,
            longestSubstring: `function lengthOfLongestSubstring(s) {
    // Your solution here
    
}`
        },
        python: {
            twoSum: `def twoSum(nums, target):
    # Your solution here
    pass`,
            validParentheses: `def isValid(s):
    # Your solution here
    pass`,
            longestSubstring: `def lengthOfLongestSubstring(s):
    # Your solution here
    pass`
        },
        java: {
            twoSum: `public int[] twoSum(int[] nums, int target) {
    // Your solution here
    return new int[]{};
}`,
            validParentheses: `public boolean isValid(String s) {
    // Your solution here
    return false;
}`,
            longestSubstring: `public int lengthOfLongestSubstring(String s) {
    // Your solution here
    return 0;
}`
        }
    };

    const lang = language.toLowerCase();
    return templates[lang]?.[problemType] || `// Write your ${language} solution here\n`;
}

// Run code against test cases
async function executeCodeService(
    code: string,
    language: string,
    testCases: Array<{ input: string; expectedOutput: string; description?: string }>
): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime: number;
    results: Array<{ passed: boolean; input: string; expectedOutput: string; actualOutput?: string; error?: string }>;
}> {
    const startTime = Date.now();
    const tempDir = path.join(__dirname, "../../temp", uuidv4());
    await fs.mkdir(tempDir, { recursive: true });

    try {
        let fileName: string;
        let command: string;
        let args: string[];

        switch (language.toLowerCase()) {
            case "javascript":
                fileName = "solution.js";
                command = "node";
                args = [fileName];
                break;
            case "python":
                fileName = "solution.py";
                command = "python";
                args = [fileName];
                break;
            case "java":
                fileName = "Solution.java";
                command = "javac";
                args = [fileName];
                break;
            default:
                throw new Error(`Unsupported language: ${language}`);
        }

        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, code);

        if (language.toLowerCase() === "java") {
            await executeCommand("javac", [fileName], tempDir);
            command = "java";
            args = ["Solution"];
        }

        const results = [];
        for (const testCase of testCases) {
            try {
                const output = await executeCommand(command, args, tempDir, 5000);
                const actualOutput = output.trim();
                const expectedOutput = testCase.expectedOutput.trim();

                results.push({
                    passed: actualOutput === expectedOutput,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    actualOutput,
                });
            } catch (error) {
                results.push({
                    passed: false,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    error: error instanceof Error ? error.message : "Execution failed",
                });
            }
        }

        const executionTime = Date.now() - startTime;
        return { success: true, executionTime, results };

    } catch (error) {
        const executionTime = Date.now() - startTime;
        return {
            success: false,
            error: error instanceof Error ? error.message : "Execution failed",
            executionTime,
            results: testCases.map(tc => ({
                passed: false,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                error: error instanceof Error ? error.message : "Execution failed",
            })),
        };
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });
    }
}

export async function evaluateCodingAnswerService({
    code,
    language,
    question,
    testCases,
}: {
    code: string;
    language: string;
    question: string;
    testCases: unknown[];
}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const executionResults = await executeCodeService(code, language, testCases as any[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const passedTests = executionResults.results.filter((t: any) => t.passed).length;
    const totalTests = testCases.length;
    const passRate = (passedTests / totalTests) * 100;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
  As a senior software engineer and technical interviewer, evaluate this coding interview solution comprehensively.

  QUESTION: ${question}
  
  CANDIDATE'S CODE:
  \`\`\`${language}
  ${code}
  \`\`\`

  TEST RESULTS: ${passedTests}/${totalTests} passed (${passRate.toFixed(1)}%)
  
  DETAILED TEST OUTCOMES:
  ${
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        executionResults.results.map((result: any, index: number) =>
            `Test ${index + 1}: ${result.passed ? "PASSED" : "FAILED"} - Input: ${result.input}, Expected: ${result.expectedOutput}, Actual: ${result.actualOutput || "N/A"}`
        ).join("\n  ")}

  Provide a comprehensive evaluation as a JSON object with the following structure:

  {
    "technicalScore": number (0-10, weighted heavily on correctness and algorithm efficiency),
    "codeQuality": number (0-10, readability, structure, best practices),
    "problemSolvingApproach": number (0-10, logical thinking, algorithm choice),
    "finalScore": number (weighted average: 50% technical, 25% quality, 25% approach),
    "overallFeedback": "2-3 sentence summary of performance highlighting key strengths and main areas needing improvement",
    "scoreExplanations": {
      "technical": "Detailed explanation of why this technical score was given, mentioning test results, algorithm correctness, and efficiency",
      "quality": "Explanation of code quality score covering readability, structure, naming conventions, and best practices",
      "approach": "Explanation of problem-solving approach score focusing on logical thinking and algorithm selection"
    },
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "weaknesses": ["specific weakness 1", "specific weakness 2"],
    "algorithmAnalysis": {
      "approach": "Brief description of the algorithm used",
      "timeComplexity": "Actual time complexity (e.g., O(n²))",
      "spaceComplexity": "Actual space complexity (e.g., O(1))",
      "efficiency": "Whether the solution is optimal/suboptimal/inefficient with explanation"
    },
    "codeReview": {
      "readability": "Assessment of variable names, structure, clarity",
      "bestPractices": "Following language conventions and patterns",
      "errorHandling": "How well edge cases and errors are handled",
      "suggestions": ["specific improvement 1", "specific improvement 2"]
    },
    "skillsToImprove": {
      "immediate": ["skill that needs urgent attention for basic competency", "another immediate skill"],
      "intermediate": ["skill for medium-term growth towards mid-level", "another intermediate skill"], 
      "advanced": ["skill for senior-level competency and leadership roles"]
    },
    "techIndustryReadiness": {
      "score": number (0-10, how ready for tech industry interviews),
      "level": "Entry-level|Junior|Mid-level|Senior",
      "explanation": "Detailed assessment of current readiness level with specific examples",
      "recommendations": [
        "specific action to take for interview prep",
        "another specific recommendation with timeline",
        "third recommendation focusing on weak areas"
      ]
    },
    "nextSteps": [
      "practice this specific concept",
      "study this algorithm type", 
      "improve this coding skill"
    ]
  }

  EVALUATION CRITERIA:
  - Technical Score: Correctness (60%), algorithm efficiency (25%), handling edge cases (15%)
  - Code Quality: Readability (40%), structure (30%), naming (20%), comments (10%)
  - Problem Solving: Algorithm choice (50%), logical flow (30%), optimization mindset (20%)
  
  Be honest but constructive. Focus on actionable feedback that helps the candidate improve for tech industry interviews.
  `;

    const result = await model.generateContent(prompt);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiFeedback = JSON.parse(result.response.text()) as any;

    return {
        passRate,
        passedTests,
        totalTests,
        executionResults,
        ...aiFeedback,
    };
}

// =====================
// Other services below
// =====================

export async function generateQuestions(domain: string, difficulty: string, interviewType: string) {
    // Use the enhanced Gemini question generation for coding questions
    if (interviewType === "technical") {
        try {
            const codingQuestion = await generateCodingQuestionWithGemini(domain, difficulty, "javascript");
            return [{
                question: codingQuestion.description,
                isCodingQuestion: true,
                title: codingQuestion.title,
                starterCode: codingQuestion.starterCode,
                testCases: codingQuestion.testCases,
                hints: codingQuestion.hints
            }];
        } catch (error) {
            console.error("Error generating enhanced coding question:", error);
            // Fallback to simple text questions
        }
    }

    // For non-technical or fallback cases, use the original implementation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
    Generate 5 ${difficulty} ${interviewType} interview questions for ${domain} developers.
    IMPORTANT: Return ONLY a valid JSON array, no markdown formatting or code blocks.
    Return JSON array:
    [{ "question": "string", "isCodingQuestion": boolean }]
  `;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean the response to ensure it's valid JSON
    const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^\s*[\r\n]/gm, "");

    return JSON.parse(cleanedResponse);
}

export async function evaluateAnswer(question: string, answer: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
    Evaluate this answer to an interview question.
    Question: ${question}
    Answer: ${answer}

    Return JSON:
    {
      "score": number (0-10),
      "aiEvaluation": "short feedback"
    }
  `;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}
