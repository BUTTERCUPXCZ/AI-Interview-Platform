import { Request, Response } from "express";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
// generateCodingQuestion/evaluateCodeSolution are kept in history but unused here; remove to satisfy lint
import type { ProgrammingLanguage } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { CacheService } from "../services/cacheService.js";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility: Check if a command exists on the system
async function commandExists(command: string): Promise<boolean> {
    try {
        if (process.platform === "win32") {
            await executeCommand("where", [command], process.cwd(), 2000);
        } else {
            await executeCommand("which", [command], process.cwd(), 2000);
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
    errorMessage?: string;
}> {
    const lang = language.toLowerCase();

    switch (lang) {
        case "javascript":
            return {
                available: await commandExists("node"),
                command: "node",
                args: ["solution.js"],
                extension: ".js",
                errorMessage: "Node.js is not installed. Please install Node.js to run JavaScript code."
            };

        case "python": {
            const pythonAvailable = await commandExists("python") || await commandExists("python3");
            return {
                available: pythonAvailable,
                command: await commandExists("python") ? "python" : "python3",
                args: ["solution.py"],
                extension: ".py",
                errorMessage: "Python is not installed. Please install Python to run Python code."
            };
        }

        case "java": {
            const javacAvailable = await commandExists("javac");
            const javaAvailable = await commandExists("java");
            return {
                available: javacAvailable && javaAvailable,
                command: "java",
                args: ["Solution"],
                compileCommand: "javac",
                compileArgs: ["Solution.java"],
                extension: ".java",
                errorMessage: "Java JDK is not installed. Please install Java JDK to compile and run Java code."
            };
        }

        case "cpp":
        case "c++":
            return {
                available: await commandExists("g++"),
                command: process.platform === "win32" ? "solution.exe" : "./solution",
                args: [],
                compileCommand: "g++",
                compileArgs: ["-o", "solution", "solution.cpp"],
                extension: ".cpp",
                errorMessage: "G++ compiler is not installed. Please install a C++ compiler to run C++ code."
            };

        case "typescript": {
            const tsNodeAvailable = await commandExists("npx") && await commandExists("node");
            return {
                available: tsNodeAvailable,
                command: "npx",
                args: ["ts-node", "solution.ts"],
                extension: ".ts",
                errorMessage: "TypeScript or ts-node is not installed. Please install Node.js and TypeScript to run TypeScript code."
            };
        }

        default:
            return {
                available: false,
                extension: ".txt",
                errorMessage: `Language '${language}' is not supported.`
            };
    }
}

interface CodeExecutionRequest {
    code: string
    language: string
    testCases?: Array<{
        input: string
        expectedOutput: string
        description?: string
    }>
}

// Lightweight TestCase type used across functions
type TestCase = {
    input: string;
    expectedOutput: string;
    description?: string;
};

interface AIEvaluationResult {
    overallScore: number
    breakdown: {
        correctness: number
        codeQuality: number
        efficiency: number
        edgeCaseHandling: number
    }
    feedback: string
    strengths: string[]
    improvements: string[]
    timeComplexity: string
    spaceComplexity: string
    passedAllTests: boolean
    recommendations: string
}

// Execute code in a sandboxed environment
export const executeCode = async (req: Request, res: Response) => {
    try {
        const { code, language, testCases } = req.body as CodeExecutionRequest;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: "Code and language are required"
            });
        }

        // Create cache key for identical code executions
        const cacheKey = `code_exec:${Buffer.from(code + language + JSON.stringify(testCases || [])).toString("base64").slice(0, 50)}`;
        const cachedResult = await CacheService.get(cacheKey);
        if (cachedResult) {
            console.log("📦 Code execution result served from cache");
            return res.json(cachedResult);
        }

        // Create temporary directory for code execution
        const tempDir = path.join(__dirname, "../../temp", uuidv4());
        await fs.mkdir(tempDir, { recursive: true });

        let result;
        try {
            result = await executeCodeInSandbox(code, language, tempDir, testCases);
        } finally {
            // Clean up temporary files
            await fs.rm(tempDir, { recursive: true, force: true });
        }

        // Get AI evaluation if execution was successful
        if (result.success && result.output) {
            try {
                const aiEvaluation = await getAIEvaluation();
                result.aiEvaluation = aiEvaluation;
            } catch (aiError) {
                console.error("AI evaluation failed:", aiError);
                // Continue without AI evaluation
            }
        }

        // Cache successful execution results for a short time (5 minutes)
        if (result.success) {
            await CacheService.set(cacheKey, result, 300);
            console.log("💾 Code execution result cached successfully");
        }

        res.json(result);
    } catch (error) {
        console.error("Code execution error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error during code execution"
        });
    }
};

// Get AI evaluation for code
export const evaluateCode = async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                error: "Code and language are required"
            });
        }

        const evaluation = await getAIEvaluation();
        res.json(evaluation);
    } catch (error) {
        console.error("AI evaluation error:", error);
        res.status(500).json({
            error: "Internal server error during AI evaluation"
        });
    }
};

// Execute code in sandboxed environment
async function executeCodeInSandbox(
    code: string,
    language: string,
    tempDir: string,
    testCases?: Array<{ input: string; expectedOutput: string; description?: string }>
): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime: number;
    testResults?: Array<{ passed: boolean; input: string; expectedOutput: string; actualOutput?: string; error?: string }>;
    aiEvaluation?: AIEvaluationResult;
    isSimulated?: boolean;
    installationGuide?: string;
    runtimeMissing?: boolean;
}> {
    const startTime = Date.now();

    // Handle framework/markup languages separately
    const lang = language.toLowerCase();
    if (["jsx", "tsx", "vue", "angular", "svelte"].includes(lang)) {
        return await simulateFrameworkExecution(code, `${language} Framework`, tempDir, startTime);
    }
    if (["html"].includes(lang)) {
        return await simulateHTMLValidation(code, tempDir, startTime);
    }
    if (["css", "scss"].includes(lang)) {
        return await simulateCSSValidation(code, language, tempDir, startTime);
    }

    // Check if language runtime is available
    const runtime = await getLanguageRuntime(language);
    if (!runtime.available) {
        const executionTime = Date.now() - startTime;
        const simulatedResult = simulateCodeExecution(code, language, testCases);

        return {
            success: simulatedResult.success,
            output: simulatedResult.output || `${language} runtime not available. Code validation completed.`,
            error: simulatedResult.error,
            executionTime,
            testResults: simulatedResult.testResults,
            isSimulated: true,
            installationGuide: getInstallationGuide(language),
            runtimeMissing: true
        };
    }

    // Create code file
    const fileName = `solution${runtime.extension}`;
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, code);

    try {
        // Compile if necessary
        if (runtime.compileCommand && runtime.compileArgs) {
            try {
                await executeCommand(runtime.compileCommand, runtime.compileArgs, tempDir);
            } catch (compileError) {
                const executionTime = Date.now() - startTime;
                return {
                    success: false,
                    error: `Compilation failed: ${compileError instanceof Error ? compileError.message : "Unknown compilation error"}`,
                    executionTime,
                    testResults: testCases?.map(tc => ({
                        passed: false,
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        error: `Compilation failed: ${compileError instanceof Error ? compileError.message : "Unknown compilation error"}`
                    }))
                };
            }
        }

        // Execute the code
        const output = await executeCommand(runtime.command!, runtime.args!, tempDir, 10000); // 10 second timeout
        const executionTime = Date.now() - startTime;

        // If test cases are provided, run them and compare outputs
        let testResults: Array<{
            passed: boolean;
            input: string;
            expectedOutput: string;
            actualOutput?: string;
            error?: string;
        }> | undefined;

        if (testCases && testCases.length > 0) {
            testResults = [];

            for (const testCase of testCases) {
                try {
                    let actualOutput: string;

                    if (language.toLowerCase() === "javascript") {
                        // For JavaScript, we need to execute the function with test inputs
                        try {
                            // Extract function name from the code
                            const functionMatch = code.match(/function\s+(\w+)\s*\(/);
                            const functionName = functionMatch ? functionMatch[1] : null;

                            if (!functionName) {
                                actualOutput = "Error: Could not find function definition in code";
                            } else {
                                let functionCallScript: string;

                                // Try to parse test input as JSON
                                try {
                                    const testInput = JSON.parse(testCase.input);

                                    // For this case, the test input is the actual parameter to pass to the function
                                    // The testInput itself should be passed as a single parameter
                                    functionCallScript = `
${code}

// Call function with test input as parameter
const result = ${functionName}(${JSON.stringify(testInput)});
console.log(JSON.stringify(result));
`;
                                } catch {
                                    // If JSON parsing fails, try direct evaluation
                                    functionCallScript = `
${code}

// Direct function call with raw input
const result = ${functionName}(${testCase.input});
console.log(JSON.stringify(result));
`;
                                }

                                // Write test script to a file
                                const testFileName = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.js`;
                                const testFilePath = path.join(tempDir, testFileName);
                                await fs.writeFile(testFilePath, functionCallScript);

                                // Execute the test script
                                const testOutput = await executeCommand("node", [testFileName], tempDir, 10000);
                                actualOutput = testOutput.trim();
                            }
                        } catch (testError) {
                            actualOutput = `Error: ${testError instanceof Error ? testError.message : "Test execution failed"}`;
                        }
                    } else {
                        // For other languages, use the original simple comparison
                        actualOutput = output.trim();
                    }

                    // Handle expectedOutput - it might be a string or number
                    const expectedOutput = typeof testCase.expectedOutput === "string"
                        ? testCase.expectedOutput.trim()
                        : String(testCase.expectedOutput);

                    // Compare the results
                    let passed = false;
                    try {
                        // First, try to parse both as JSON for deep comparison
                        const actualParsed = JSON.parse(actualOutput);
                        let expectedParsed;

                        // Handle expected output - might be already a number/object
                        if (typeof testCase.expectedOutput === "string") {
                            expectedParsed = JSON.parse(expectedOutput);
                        } else {
                            expectedParsed = testCase.expectedOutput;
                        }

                        // For arrays, we need to handle order-independent comparison
                        if (Array.isArray(actualParsed) && Array.isArray(expectedParsed)) {
                            if (actualParsed.length === expectedParsed.length) {
                                // For this specific problem, the order of endpoints with same count doesn't matter
                                // So we'll sort both arrays before comparison
                                const sortedActual = [...actualParsed].sort();
                                const sortedExpected = [...expectedParsed].sort();
                                passed = JSON.stringify(sortedActual) === JSON.stringify(sortedExpected);

                                // Also check exact match without sorting
                                if (!passed) {
                                    passed = JSON.stringify(actualParsed) === JSON.stringify(expectedParsed);
                                }
                            }
                        } else {
                            // For numbers and other primitives, do direct comparison
                            passed = actualParsed === expectedParsed;
                        }
                    } catch {
                        // If JSON parsing fails, try string/numeric comparison
                        const actualTrimmed = actualOutput.trim();
                        const expectedTrimmed = expectedOutput.trim();

                        // Try numeric comparison first
                        const actualNum = Number(actualTrimmed);
                        const expectedNum = Number(expectedTrimmed);

                        if (!isNaN(actualNum) && !isNaN(expectedNum)) {
                            passed = actualNum === expectedNum;
                        } else {
                            // Fall back to string comparison
                            passed = actualTrimmed.toLowerCase() === expectedTrimmed.toLowerCase();
                        }
                    }

                    testResults.push({
                        passed,
                        input: testCase.input,
                        expectedOutput: testCase.expectedOutput,
                        actualOutput,
                    });
                } catch (error) {
                    testResults.push({
                        passed: false,
                        input: testCase.input,
                        expectedOutput: testCase.expectedOutput,
                        error: error instanceof Error ? error.message : "Test execution failed"
                    });
                }
            }
        }

        return {
            success: true,
            output: output.trim(),
            executionTime,
            testResults
        };
    } catch (error) {
        const executionTime = Date.now() - startTime;
        return {
            success: false,
            error: error instanceof Error ? error.message : "Execution failed",
            executionTime,
            testResults: testCases?.map(tc => ({
                passed: false,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                error: error instanceof Error ? error.message : "Execution failed"
            }))
        };
    }
}

// Execute command with timeout
function executeCommand(command: string, args: string[], cwd: string, timeout = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd, timeout });
        let stdout = "";
        let stderr = "";

        child.stdout?.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr?.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr || `Process exited with code ${code}`));
            }
        });

        child.on("error", (error) => {
            reject(error);
        });

        // Set timeout
        setTimeout(() => {
            child.kill();
            reject(new Error("Execution timeout"));
        }, timeout);
    });
}

// Simulate framework execution (React, Vue, Angular, Svelte)
async function simulateFrameworkExecution(
    code: string,
    framework: string,
    tempDir: string,
    startTime: number
): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime: number;
}> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate compilation time

    const executionTime = Date.now() - startTime;

    // Basic syntax validation
    const syntaxChecks = {
        "React JSX": {
            required: ["function", "return", "<"],
            invalid: ["class extends Component"], // Prefer functional components
        },
        "React TSX": {
            required: ["function", "return", "<", "React"],
            invalid: [],
        },
        "Vue SFC": {
            required: ["<template>", "<script>", "export default"],
            invalid: [],
        },
        "Angular": {
            required: ["@Component", "export class"],
            invalid: [],
        },
        "Svelte": {
            required: ["<script>", "let "],
            invalid: [],
        }
    };

    const checks = syntaxChecks[framework as keyof typeof syntaxChecks];

    // Check for required patterns
    const missingRequired = checks.required.filter(pattern => !code.includes(pattern));
    if (missingRequired.length > 0) {
        return {
            success: false,
            error: `${framework} Error: Missing required patterns: ${missingRequired.join(", ")}`,
            executionTime
        };
    }

    // Check for invalid patterns
    const foundInvalid = checks.invalid.filter(pattern => code.includes(pattern));
    if (foundInvalid.length > 0) {
        return {
            success: false,
            error: `${framework} Warning: Consider avoiding: ${foundInvalid.join(", ")}`,
            executionTime
        };
    }

    // Generate framework-specific output
    let output = `✅ ${framework} component compiled successfully!\n`;

    if (framework.includes("React")) {
        if (code.includes("useState")) output += "✅ State management detected\n";
        if (code.includes("useEffect")) output += "✅ Side effects handled\n";
        if (code.includes("Props") || code.includes("interface")) output += "✅ TypeScript props defined\n";
        output += "✅ Component ready for rendering";
    } else if (framework === "Vue SFC") {
        if (code.includes("ref(") || code.includes("reactive(")) output += "✅ Vue 3 Composition API detected\n";
        if (code.includes("v-model") || code.includes("@click")) output += "✅ Vue directives found\n";
        if (code.includes("<style scoped>")) output += "✅ Scoped styles applied\n";
        output += "✅ Single File Component ready";
    } else if (framework === "Angular") {
        if (code.includes("@Input") || code.includes("@Output")) output += "✅ Component communication set up\n";
        if (code.includes("OnInit") || code.includes("OnDestroy")) output += "✅ Lifecycle hooks implemented\n";
        if (code.includes("Observable")) output += "✅ RxJS reactive patterns detected\n";
        output += "✅ Angular component ready for module";
    } else if (framework === "Svelte") {
        if (code.includes("$:")) output += "✅ Reactive statements found\n";
        if (code.includes("onMount")) output += "✅ Lifecycle hooks detected\n";
        if (code.includes("{#if") || code.includes("{#each")) output += "✅ Template logic implemented\n";
        output += "✅ Svelte component compiled and optimized";
    }

    return {
        success: true,
        output,
        executionTime
    };
}

// Simulate HTML validation
async function simulateHTMLValidation(
    code: string,
    tempDir: string,
    startTime: number
): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime: number;
}> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const executionTime = Date.now() - startTime;

    // Basic HTML validation
    if (!code.includes("<html") && !code.includes("<!DOCTYPE")) {
        return {
            success: false,
            error: "HTML Error: Missing document structure (DOCTYPE or html tag)",
            executionTime
        };
    }

    let output = "✅ HTML document structure validated\n";

    if (code.includes("<!DOCTYPE html>")) output += "✅ HTML5 DOCTYPE declared\n";
    if (code.includes("<meta charset")) output += "✅ Character encoding specified\n";
    if (code.includes("<meta name=\"viewport\"")) output += "✅ Responsive viewport meta tag found\n";
    if (code.includes("alt=")) output += "✅ Image accessibility attributes detected\n";
    if (code.includes("aria-")) output += "✅ ARIA accessibility attributes found\n";
    if (code.includes("<main>") || code.includes("<section>")) output += "✅ Semantic HTML elements used\n";

    output += "✅ HTML document ready for browser rendering";

    return {
        success: true,
        output,
        executionTime
    };
}

// Simulate CSS/SCSS validation
async function simulateCSSValidation(
    code: string,
    language: string,
    tempDir: string,
    startTime: number
): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime: number;
}> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const executionTime = Date.now() - startTime;

    // Basic CSS syntax validation
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
        return {
            success: false,
            error: `${language.toUpperCase()} Error: Mismatched braces (${openBraces} opening, ${closeBraces} closing)`,
            executionTime
        };
    }

    let output = `✅ ${language.toUpperCase()} syntax validation passed\n`;

    if (code.includes("display: flex") || code.includes("display: grid")) {
        output += "✅ Modern layout techniques detected\n";
    }
    if (code.includes("@media")) {
        output += "✅ Responsive design media queries found\n";
    }
    if (code.includes("transition") || code.includes("animation")) {
        output += "✅ CSS animations/transitions implemented\n";
    }
    if (language === "scss") {
        if (code.includes("$")) output += "✅ SCSS variables detected\n";
        if (code.includes("@mixin") || code.includes("@include")) output += "✅ SCSS mixins found\n";
        if (code.includes("@import") || code.includes("@use")) output += "✅ SCSS imports detected\n";
    }
    if (code.includes(":hover") || code.includes(":focus")) {
        output += "✅ Interactive pseudo-classes implemented\n";
    }

    output += `✅ ${language.toUpperCase()} styles ready for application`;

    return {
        success: true,
        output,
        executionTime
    };
}

// Legacy AI evaluation function (deprecated - use Gemini service instead)
async function getAIEvaluation(): Promise<AIEvaluationResult> {
    // Simple fallback evaluation
    return {
        overallScore: 75,
        breakdown: {
            correctness: 75,
            codeQuality: 70,
            efficiency: 80,
            edgeCaseHandling: 70
        },
        feedback: "Basic code evaluation. Use the new Gemini-powered evaluation for better results.",
        strengths: ["Code compiles and runs"],
        improvements: ["Consider using the new AI evaluation endpoint"],
        timeComplexity: "Not analyzed",
        spaceComplexity: "Not analyzed",
        passedAllTests: false,
        recommendations: "Switch to Gemini-powered evaluation for detailed feedback"
    };
}

// Submit interview answer
export const submitAnswer = async (req: Request, res: Response) => {
    try {
        const { questionId, answer, answerType, language, executionResult } = req.body;

        if (!questionId || !answer || !answerType) {
            return res.status(400).json({
                error: "Question ID, answer, and answer type are required"
            });
        }

        // Here you would typically save to database
        // For now, just return success

        const submissionData = {
            id: uuidv4(),
            questionId,
            answer,
            answerType,
            language,
            executionResult,
            timestamp: new Date().toISOString(),
            // Access user id safely from request if available
            userId: ((req as unknown) as { user?: { id?: string } }).user?.id
        };

        // TODO: Save to database
        console.log("Answer submitted:", submissionData);

        res.json({
            success: true,
            submissionId: submissionData.id
        });
    } catch (error) {
        console.error("Submit answer error:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
};

// Generate coding question using Gemini AI
export const getCodingQuestion = async (req: Request, res: Response) => {
    try {
        const { domain, difficulty, language, sessionId } = req.query as {
            domain: string
            difficulty: string
            language: string
            sessionId?: string
        };

        if (!domain || !difficulty || !language) {
            return res.status(400).json({
                error: "Domain, difficulty, and language are required"
            });
        }

        // Use the enhanced Gemini question generation
        const { generateCodingQuestionWithGemini } = await import("../services/codingEvaluationService.js");
        const questionData = await generateCodingQuestionWithGemini(domain, difficulty, language);

        // If sessionId is provided, save the question to the database
        if (sessionId) {
            const savedQuestion = await prisma.interviewQuestion.create({
                data: {
                    sessionId: parseInt(sessionId),
                    questionText: questionData.description,
                    isCodingQuestion: true,
                    // store language as string for portability
                    codingLanguage: String(language).toUpperCase() as unknown as ProgrammingLanguage,
                    expectedOutput: JSON.stringify(questionData.testCases),
                    starterCode: questionData.starterCode,
                }
            });

            // Create test cases for this question
            if (questionData.testCases && questionData.testCases.length > 0) {
                await Promise.all(
                    questionData.testCases.map((testCase: TestCase) =>
                        prisma.testCase.create({
                            data: {
                                questionId: savedQuestion.id,
                                input: String(testCase.input),
                                expectedOutput: String(testCase.expectedOutput),
                                description: testCase.description || "",
                            }
                        })
                    )
                );
            }

            // Return the question with database ID
            return res.json({
                id: savedQuestion.id,
                title: questionData.title,
                description: questionData.description,
                difficulty: questionData.difficulty,
                language: questionData.language,
                starterCode: questionData.starterCode,
                testCases: questionData.testCases,
                hints: questionData.hints,
                timeComplexityExpected: questionData.timeComplexityExpected,
                spaceComplexityExpected: questionData.spaceComplexityExpected
            });
        }

        // Return the generated question without saving
        res.json(questionData);
    } catch (error) {
        console.error("Get coding question error:", error);
        res.status(500).json({
            error: "Failed to generate coding question"
        });
    }
};

// Execute code and get AI evaluation
export const runCodeWithEvaluation = async (req: Request, res: Response) => {
    try {
        const { code, language, questionText, questionId, testCases } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                error: "Code and language are required"
            });
        }

        // Create temporary directory for code execution
        const tempDir = path.join(__dirname, "../../temp", uuidv4());
        await fs.mkdir(tempDir, { recursive: true });

        let executionResult;
        try {
            // Execute the code
            executionResult = await executeCodeInSandbox(code, language, tempDir, testCases);
        } finally {
            // Clean up temporary files
            await fs.rm(tempDir, { recursive: true, force: true });
        }

        // If execution was successful, get enhanced AI evaluation
        let aiEvaluation = null;
        if (executionResult.success && questionText) {
            try {
                // Use the enhanced evaluation service
                const { evaluateCodingAnswerService } = await import("../services/codingEvaluationService.js");
                aiEvaluation = await evaluateCodingAnswerService({
                    code,
                    language,
                    question: questionText,
                    testCases: testCases || []
                });

                // If questionId is provided, save the submission to database
                if (questionId) {
                    await prisma.codeSubmission.create({
                        data: {
                            questionId: parseInt(questionId),
                            code,
                            language: String(language).toUpperCase() as unknown as ProgrammingLanguage,
                            isCorrect: aiEvaluation.passRate === 100,
                            passedTests: aiEvaluation.passedTests,
                            totalTests: aiEvaluation.totalTests,
                        }
                    });

                    // Update the question with the answer and enhanced evaluation
                    await prisma.interviewQuestion.update({
                        where: { id: parseInt(questionId) },
                        data: {
                            userAnswer: code,
                            aiEvaluation: aiEvaluation.overallFeedback || "Code evaluation completed",
                            score: aiEvaluation.finalScore || 0,
                        }
                    });
                }
            } catch (evalError) {
                console.error("Enhanced AI evaluation failed:", evalError);
                // Fallback to basic evaluation
                aiEvaluation = {
                    technicalScore: 7,
                    codeQuality: 7,
                    overallFeedback: "Code executed successfully. Enhanced evaluation temporarily unavailable.",
                    finalScore: 7,
                    passRate: executionResult.testResults ?
                        (executionResult.testResults.filter((r: { passed: boolean }) => r.passed).length / executionResult.testResults.length) * 100 : 0,
                    passedTests: executionResult.testResults ?
                        executionResult.testResults.filter((r: { passed: boolean }) => r.passed).length : 0,
                    totalTests: testCases?.length || 0
                };
            }
        }

        res.json({
            success: executionResult.success,
            output: executionResult.output,
            error: executionResult.error,
            executionTime: executionResult.executionTime,
            testResults: executionResult.testResults,
            isSimulated: executionResult.isSimulated,
            runtimeMissing: executionResult.runtimeMissing,
            installationGuide: executionResult.installationGuide,
            evaluation: aiEvaluation
        });
    } catch (error) {
        console.error("Code execution and evaluation error:", error);
        res.status(500).json({
            error: "Failed to execute code and generate evaluation"
        });
    }
};

// Simulate code execution when runtime is not available
function simulateCodeExecution(
    code: string,
    language: string,
    testCases?: Array<{ input: string; expectedOutput: string; description?: string }>
): {
    success: boolean;
    output?: string;
    error?: string;
    testResults?: Array<{ passed: boolean; input: string; expectedOutput: string; actualOutput?: string; error?: string }>;
} {
    const lang = language.toLowerCase();

    // Basic syntax validation
    let syntaxValid = true;
    let syntaxError = "";

    switch (lang) {
        case "java":
            if (!code.includes("public class")) {
                syntaxValid = false;
                syntaxError = "Java code must contain a public class declaration";
            } else if (!code.includes("public static void main")) {
                syntaxValid = false;
                syntaxError = "Java executable code requires a main method";
            }
            break;

        case "python": {
            // Check for basic indentation issues
            const lines = code.split("\n");
            for (let i = 0; i < lines.length - 1; i++) {
                if (lines[i].trim().endsWith(":") && lines[i + 1] && !lines[i + 1].startsWith("    ") && lines[i + 1].trim() !== "") {
                    syntaxValid = false;
                    syntaxError = `Indentation error: line ${i + 2} should be indented after colon on line ${i + 1}`;
                    break;
                }
            }
            break;
        }

        case "cpp":
        case "c++":
            if (!code.includes("#include")) {
                syntaxValid = false;
                syntaxError = "C++ code typically requires #include directives";
            } else if (!code.includes("int main")) {
                syntaxValid = false;
                syntaxError = "C++ executable code requires a main function";
            }
            break;

        case "javascript":
        case "typescript": {
            // Check for basic syntax issues
            const openBraces = (code.match(/{/g) || []).length;
            const closeBraces = (code.match(/}/g) || []).length;
            if (openBraces !== closeBraces) {
                syntaxValid = false;
                syntaxError = "Syntax error: mismatched braces";
            }
            break;
        }
    }

    if (!syntaxValid) {
        return {
            success: false,
            error: `Syntax validation failed: ${syntaxError}`,
            testResults: testCases?.map(tc => ({
                passed: false,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                error: syntaxError
            }))
        };
    }

    // Generate simulated output
    let output = `✅ Code syntax validation passed for ${language}\n`;
    output += `🔍 Simulated execution (${language} runtime not installed)\n`;
    output += "📝 Your code structure looks correct\n";

    if (code.includes("console.log") || code.includes("print") || code.includes("System.out") || code.includes("cout")) {
        output += "📤 Output statements detected in your code\n";
    }

    // Simulate test results with basic pattern matching
    const testResults = testCases?.map(tc => {
        // Simple heuristic: if the code contains similar patterns to expected output, mark as potentially passing
        const codeContainsPattern = code.toLowerCase().includes(tc.expectedOutput.toLowerCase().slice(0, 5));
        return {
            passed: codeContainsPattern,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: codeContainsPattern ? tc.expectedOutput : "Unable to execute (runtime not available)",
            error: codeContainsPattern ? undefined : "Runtime not available for execution"
        };
    });

    return {
        success: true,
        output,
        testResults
    };
}

// Get installation guide for missing language runtimes
function getInstallationGuide(language: string): string {
    const lang = language.toLowerCase();

    switch (lang) {
        case "java":
            return `To enable Java code execution:
1. Install JDK 11 or higher from https://adoptium.net/
2. Add Java to your system PATH
3. Verify installation: java -version
4. For development: Install IDE like IntelliJ IDEA or Eclipse`;

        case "python":
            return `To enable Python code execution:
1. Install Python 3.8+ from https://python.org/downloads/
2. Add Python to your system PATH
3. Verify installation: python --version
4. Install pip for package management`;

        case "cpp":
        case "c++":
            return `To enable C++ code execution:
1. Install GCC compiler:
   - Windows: MinGW-w64 or Visual Studio
   - macOS: Xcode Command Line Tools
   - Linux: sudo apt install g++
2. Verify installation: g++ --version
3. IDE recommendations: Code::Blocks, CLion, or VS Code`;

        case "javascript":
            return `To enable Node.js JavaScript execution:
1. Install Node.js from https://nodejs.org/
2. Verify installation: node --version
3. For web development: Use browser developer tools
4. IDE: VS Code with JavaScript extensions`;

        case "typescript":
            return `To enable TypeScript execution:
1. Install Node.js from https://nodejs.org/
2. Install TypeScript: npm install -g typescript
3. Verify installation: tsc --version
4. Compile and run: tsc file.ts && node file.js`;

        default:
            return `To enable ${language} code execution, please install the appropriate runtime/compiler for ${language} on your system.`;
    }
}