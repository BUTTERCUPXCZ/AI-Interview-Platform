import { GoogleGenerativeAI } from "@google/generative-ai";
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Utility: Check if a command exists on the system
async function commandExists(command: string): Promise<boolean> {
    try {
        if (process.platform === 'win32') {
            await executeCommand('where', [command], process.cwd(), 2000);
        } else {
            await executeCommand('which', [command], process.cwd(), 2000);
        }
        return true;
    } catch {
        return false;
    }
}

// Utility: Get language runtime information
async function getLanguageRuntime(language: string): Promise<{
    available: boolean;
    command?: string;
    args?: string[];
    compileCommand?: string;
    compileArgs?: string[];
    extension: string;
    className?: string;
    errorMessage?: string;
}> {
    const lang = language.toLowerCase();

    switch (lang) {
        case 'javascript':
            return {
                available: await commandExists('node'),
                command: 'node',
                args: ['solution.js'],
                extension: '.js',
                errorMessage: 'Node.js is not installed. Please install Node.js to run JavaScript code.'
            };

        case 'python':
            const pythonAvailable = await commandExists('python') || await commandExists('python3');
            return {
                available: pythonAvailable,
                command: await commandExists('python') ? 'python' : 'python3',
                args: ['solution.py'],
                extension: '.py',
                errorMessage: 'Python is not installed. Please install Python to run Python code.'
            };

        case 'java':
            const javacAvailable = await commandExists('javac');
            const javaAvailable = await commandExists('java');
            return {
                available: javacAvailable && javaAvailable,
                command: 'java',
                args: ['Solution'],
                compileCommand: 'javac',
                compileArgs: ['Solution.java'],
                extension: '.java',
                className: 'Solution',
                errorMessage: 'Java JDK is not installed. Please install Java JDK to compile and run Java code.'
            };

        case 'cpp':
        case 'c++':
            return {
                available: await commandExists('g++'),
                command: process.platform === 'win32' ? 'solution.exe' : './solution',
                args: [],
                compileCommand: 'g++',
                compileArgs: ['-o', 'solution', 'solution.cpp'],
                extension: '.cpp',
                errorMessage: 'G++ compiler is not installed. Please install a C++ compiler to run C++ code.'
            };

        case 'csharp':
        case 'c#':
            return {
                available: await commandExists('dotnet'),
                command: 'dotnet',
                args: ['run'],
                extension: '.cs',
                errorMessage: '.NET is not installed. Please install .NET SDK to run C# code.'
            };

        default:
            return {
                available: false,
                extension: '.txt',
                errorMessage: `Language '${language}' is not supported.`
            };
    }
}

// Utility: Execute code with timeout
function executeCommand(command: string, args: string[], cwd: string, timeout = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd });
        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => { stdout += data.toString(); });
        child.stderr?.on('data', (data) => { stderr += data.toString(); });

        child.on('close', (code) => {
            if (code === 0) resolve(stdout);
            else reject(new Error(stderr || `Process exited with code ${code}`));
        });

        child.on('error', (error) => reject(error));

        // Timeout safeguard
        setTimeout(() => {
            child.kill();
            reject(new Error('Execution timeout'));
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
    Generate a ${difficulty} level coding interview question for ${domain} domain using ${language} programming language.

    Requirements:
    1. Create a realistic technical interview question appropriate for ${domain} development
    2. Include a clear problem description with examples
    3. Provide starter code template in ${language}
    4. Generate 3-5 comprehensive test cases with inputs and expected outputs
    5. Include helpful hints without giving away the solution
    6. Specify expected time and space complexity

    Domain context for ${domain}:
    - Frontend: Focus on algorithms, data structures, DOM manipulation, string processing
    - Backend: Focus on APIs, data processing, algorithms, system efficiency
    - Fullstack: Mix of frontend and backend concepts
    - Data Science: Focus on data analysis, statistics, machine learning algorithms
    - Mobile: Focus on performance, algorithms suitable for mobile constraints
    - DevOps: Focus on automation, scripting, system operations

    Difficulty guidelines:
    - Beginner: Basic loops, conditionals, simple data structures
    - Intermediate: Hash maps, arrays, strings, basic algorithms
    - Advanced: Complex algorithms, optimization, system design concepts

    Return ONLY valid JSON in this exact format:
    {
        "title": "Problem Title",
        "description": "Detailed problem description with examples and constraints",
        "difficulty": "${difficulty}",
        "language": "${language}",
        "starterCode": "// Starter code template",
        "testCases": [
            {
                "input": "input parameters",
                "expectedOutput": "expected result",
                "description": "test case description"
            }
        ],
        "hints": ["hint1", "hint2"],
        "timeComplexityExpected": "O(n)",
        "spaceComplexityExpected": "O(1)"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Clean the response to ensure it's valid JSON
        const cleanedResponse = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^\s*[\r\n]/gm, ''); // Remove empty lines

        const questionData = JSON.parse(cleanedResponse);

        // Validate the response structure
        if (!questionData.title || !questionData.description || !questionData.starterCode || !questionData.testCases) {
            throw new Error('Invalid question structure returned from Gemini');
        }

        return questionData;
    } catch (error) {
        console.error('Error generating coding question with Gemini:', error);

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
    const tempDir = path.join(__dirname, '../../temp', uuidv4());
    await fs.mkdir(tempDir, { recursive: true });

    try {
        let fileName: string;
        let command: string;
        let args: string[];

        switch (language.toLowerCase()) {
            case 'javascript':
                fileName = 'solution.js';
                command = 'node';
                args = [fileName];
                break;
            case 'python':
                fileName = 'solution.py';
                command = 'python';
                args = [fileName];
                break;
            case 'java':
                fileName = 'Solution.java';
                command = 'javac';
                args = [fileName];
                break;
            default:
                throw new Error(`Unsupported language: ${language}`);
        }

        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, code);

        if (language.toLowerCase() === 'java') {
            await executeCommand('javac', [fileName], tempDir);
            command = 'java';
            args = ['Solution'];
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
                    error: error instanceof Error ? error.message : 'Execution failed',
                });
            }
        }

        const executionTime = Date.now() - startTime;
        return { success: true, executionTime, results };

    } catch (error) {
        const executionTime = Date.now() - startTime;
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Execution failed',
            executionTime,
            results: testCases.map(tc => ({
                passed: false,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                error: error instanceof Error ? error.message : 'Execution failed',
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
    testCases: any[];
}) {
    const executionResults = await executeCodeService(code, language, testCases);
    const passedTests = executionResults.results.filter((t: any) => t.passed).length;
    const totalTests = testCases.length;
    const passRate = (passedTests / totalTests) * 100;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
  Evaluate the following coding interview solution.

  Question: ${question}
  Code:
  \`\`\`${language}
  ${code}
  \`\`\`

  Test Results: ${passedTests}/${totalTests} passed (${passRate.toFixed(1)}%)

  Return JSON:
  {
    "technicalScore": number (0-10),
    "codeQuality": number (0-10),
    "feedback": "short constructive summary",
    "finalScore": number (weighted average, 70% technicalScore, 30% codeQuality)
  }
  `;

    const result = await model.generateContent(prompt);
    const aiFeedback = JSON.parse(result.response.text());

    return {
        passRate,
        passedTests,
        totalTests,
        ...aiFeedback,
    };
}

// =====================
// Other services below
// =====================

export async function generateQuestions(domain: string, difficulty: string, interviewType: string) {
    // Use the enhanced Gemini question generation for coding questions
    if (interviewType === 'technical') {
        try {
            const codingQuestion = await generateCodingQuestionWithGemini(domain, difficulty, 'javascript');
            return [{
                question: codingQuestion.description,
                isCodingQuestion: true,
                title: codingQuestion.title,
                starterCode: codingQuestion.starterCode,
                testCases: codingQuestion.testCases,
                hints: codingQuestion.hints
            }];
        } catch (error) {
            console.error('Error generating enhanced coding question:', error);
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
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\s*[\r\n]/gm, '');

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
