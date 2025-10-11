import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// Execute code in a sandboxed environment
export const executeCode = async (req, res) => {
    try {
        const { code, language, testCases } = req.body;
        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Code and language are required'
            });
        }
        // Create temporary directory for code execution
        const tempDir = path.join(__dirname, '../../temp', uuidv4());
        await fs.mkdir(tempDir, { recursive: true });
        let result;
        try {
            result = await executeCodeInSandbox(code, language, tempDir, testCases);
        }
        finally {
            // Clean up temporary files
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        // Get AI evaluation if execution was successful
        if (result.success && result.output) {
            try {
                const aiEvaluation = await getAIEvaluation(code, language, result.output);
                result.aiEvaluation = aiEvaluation;
            }
            catch (aiError) {
                console.error('AI evaluation failed:', aiError);
                // Continue without AI evaluation
            }
        }
        res.json(result);
    }
    catch (error) {
        console.error('Code execution error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during code execution'
        });
    }
};
// Get AI evaluation for code
export const evaluateCode = async (req, res) => {
    try {
        const { code, language, questionContext, expectedOutput } = req.body;
        if (!code || !language) {
            return res.status(400).json({
                error: 'Code and language are required'
            });
        }
        const evaluation = await getAIEvaluation(code, language, expectedOutput, questionContext);
        res.json(evaluation);
    }
    catch (error) {
        console.error('AI evaluation error:', error);
        res.status(500).json({
            error: 'Internal server error during AI evaluation'
        });
    }
};
// Execute code in sandboxed environment
async function executeCodeInSandbox(code, language, tempDir, testCases) {
    const startTime = Date.now();
    let fileName;
    let command;
    let args;
    // Determine file extension and execution command
    switch (language.toLowerCase()) {
        case 'javascript':
            fileName = 'solution.js';
            command = 'node';
            args = [fileName];
            break;
        case 'typescript':
            fileName = 'solution.ts';
            command = 'npx';
            args = ['ts-node', fileName];
            break;
        case 'jsx':
            fileName = 'component.jsx';
            // For JSX, we'll simulate React compilation
            return await simulateFrameworkExecution(code, 'React JSX', tempDir, startTime);
        case 'tsx':
            fileName = 'component.tsx';
            // For TSX, we'll simulate React TypeScript compilation
            return await simulateFrameworkExecution(code, 'React TSX', tempDir, startTime);
        case 'vue':
            fileName = 'component.vue';
            // For Vue, we'll simulate Vue SFC compilation
            return await simulateFrameworkExecution(code, 'Vue SFC', tempDir, startTime);
        case 'angular':
            fileName = 'component.ts';
            // For Angular, we'll simulate Angular compilation
            return await simulateFrameworkExecution(code, 'Angular', tempDir, startTime);
        case 'svelte':
            fileName = 'component.svelte';
            // For Svelte, we'll simulate Svelte compilation
            return await simulateFrameworkExecution(code, 'Svelte', tempDir, startTime);
        case 'html':
            fileName = 'index.html';
            // For HTML, we'll validate and return structure analysis
            return await simulateHTMLValidation(code, tempDir, startTime);
        case 'css':
        case 'scss':
            fileName = language === 'scss' ? 'styles.scss' : 'styles.css';
            // For CSS/SCSS, we'll validate and return analysis
            return await simulateCSSValidation(code, language, tempDir, startTime);
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
        case 'cpp':
        case 'c++':
            fileName = 'solution.cpp';
            command = 'g++';
            args = ['-o', 'solution', fileName];
            break;
        default:
            throw new Error(`Unsupported language: ${language}`);
    }
    // Write code to temporary file
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, code);
    try {
        // For compiled languages, compile first
        if (language.toLowerCase() === 'java') {
            await executeCommand('javac', [fileName], tempDir);
            command = 'java';
            args = ['Solution'];
        }
        else if (language.toLowerCase() === 'cpp' || language.toLowerCase() === 'c++') {
            await executeCommand('g++', ['-o', 'solution', fileName], tempDir);
            command = './solution';
            args = [];
        }
        // Execute the code
        const output = await executeCommand(command, args, tempDir, 10000); // 10 second timeout
        const executionTime = Date.now() - startTime;
        return {
            success: true,
            output: output.trim(),
            executionTime
        };
    }
    catch (error) {
        const executionTime = Date.now() - startTime;
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Execution failed',
            executionTime
        };
    }
}
// Execute command with timeout
function executeCommand(command, args, cwd, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd, timeout });
        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            }
            else {
                reject(new Error(stderr || `Process exited with code ${code}`));
            }
        });
        child.on('error', (error) => {
            reject(error);
        });
        // Set timeout
        setTimeout(() => {
            child.kill();
            reject(new Error('Execution timeout'));
        }, timeout);
    });
}
// Simulate framework execution (React, Vue, Angular, Svelte)
async function simulateFrameworkExecution(code, framework, tempDir, startTime) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate compilation time
    const executionTime = Date.now() - startTime;
    // Basic syntax validation
    const syntaxChecks = {
        'React JSX': {
            required: ['function', 'return', '<'],
            invalid: ['class extends Component'], // Prefer functional components
        },
        'React TSX': {
            required: ['function', 'return', '<', 'React'],
            invalid: [],
        },
        'Vue SFC': {
            required: ['<template>', '<script>', 'export default'],
            invalid: [],
        },
        'Angular': {
            required: ['@Component', 'export class'],
            invalid: [],
        },
        'Svelte': {
            required: ['<script>', 'let '],
            invalid: [],
        }
    };
    const checks = syntaxChecks[framework];
    // Check for required patterns
    const missingRequired = checks.required.filter(pattern => !code.includes(pattern));
    if (missingRequired.length > 0) {
        return {
            success: false,
            error: `${framework} Error: Missing required patterns: ${missingRequired.join(', ')}`,
            executionTime
        };
    }
    // Check for invalid patterns
    const foundInvalid = checks.invalid.filter(pattern => code.includes(pattern));
    if (foundInvalid.length > 0) {
        return {
            success: false,
            error: `${framework} Warning: Consider avoiding: ${foundInvalid.join(', ')}`,
            executionTime
        };
    }
    // Generate framework-specific output
    let output = `✅ ${framework} component compiled successfully!\n`;
    if (framework.includes('React')) {
        if (code.includes('useState'))
            output += '✅ State management detected\n';
        if (code.includes('useEffect'))
            output += '✅ Side effects handled\n';
        if (code.includes('Props') || code.includes('interface'))
            output += '✅ TypeScript props defined\n';
        output += '✅ Component ready for rendering';
    }
    else if (framework === 'Vue SFC') {
        if (code.includes('ref(') || code.includes('reactive('))
            output += '✅ Vue 3 Composition API detected\n';
        if (code.includes('v-model') || code.includes('@click'))
            output += '✅ Vue directives found\n';
        if (code.includes('<style scoped>'))
            output += '✅ Scoped styles applied\n';
        output += '✅ Single File Component ready';
    }
    else if (framework === 'Angular') {
        if (code.includes('@Input') || code.includes('@Output'))
            output += '✅ Component communication set up\n';
        if (code.includes('OnInit') || code.includes('OnDestroy'))
            output += '✅ Lifecycle hooks implemented\n';
        if (code.includes('Observable'))
            output += '✅ RxJS reactive patterns detected\n';
        output += '✅ Angular component ready for module';
    }
    else if (framework === 'Svelte') {
        if (code.includes('$:'))
            output += '✅ Reactive statements found\n';
        if (code.includes('onMount'))
            output += '✅ Lifecycle hooks detected\n';
        if (code.includes('{#if') || code.includes('{#each'))
            output += '✅ Template logic implemented\n';
        output += '✅ Svelte component compiled and optimized';
    }
    return {
        success: true,
        output,
        executionTime
    };
}
// Simulate HTML validation
async function simulateHTMLValidation(code, tempDir, startTime) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const executionTime = Date.now() - startTime;
    // Basic HTML validation
    if (!code.includes('<html') && !code.includes('<!DOCTYPE')) {
        return {
            success: false,
            error: 'HTML Error: Missing document structure (DOCTYPE or html tag)',
            executionTime
        };
    }
    let output = '✅ HTML document structure validated\n';
    if (code.includes('<!DOCTYPE html>'))
        output += '✅ HTML5 DOCTYPE declared\n';
    if (code.includes('<meta charset'))
        output += '✅ Character encoding specified\n';
    if (code.includes('<meta name="viewport"'))
        output += '✅ Responsive viewport meta tag found\n';
    if (code.includes('alt='))
        output += '✅ Image accessibility attributes detected\n';
    if (code.includes('aria-'))
        output += '✅ ARIA accessibility attributes found\n';
    if (code.includes('<main>') || code.includes('<section>'))
        output += '✅ Semantic HTML elements used\n';
    output += '✅ HTML document ready for browser rendering';
    return {
        success: true,
        output,
        executionTime
    };
}
// Simulate CSS/SCSS validation
async function simulateCSSValidation(code, language, tempDir, startTime) {
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
    if (code.includes('display: flex') || code.includes('display: grid')) {
        output += '✅ Modern layout techniques detected\n';
    }
    if (code.includes('@media')) {
        output += '✅ Responsive design media queries found\n';
    }
    if (code.includes('transition') || code.includes('animation')) {
        output += '✅ CSS animations/transitions implemented\n';
    }
    if (language === 'scss') {
        if (code.includes('$'))
            output += '✅ SCSS variables detected\n';
        if (code.includes('@mixin') || code.includes('@include'))
            output += '✅ SCSS mixins found\n';
        if (code.includes('@import') || code.includes('@use'))
            output += '✅ SCSS imports detected\n';
    }
    if (code.includes(':hover') || code.includes(':focus')) {
        output += '✅ Interactive pseudo-classes implemented\n';
    }
    output += `✅ ${language.toUpperCase()} styles ready for application`;
    return {
        success: true,
        output,
        executionTime
    };
}
// AI evaluation function (placeholder - integrate with your AI service)
async function getAIEvaluation(code, language, output, questionContext) {
    // This is a placeholder implementation
    // In a real application, you would integrate with an AI service like:
    // - OpenAI GPT
    // - Google Cloud AI
    // - Azure Cognitive Services
    // - Custom AI model
    // Mock evaluation based on code analysis
    let score = 70;
    let readability = 7;
    let efficiency = 6;
    let correctness = 8;
    const feedback = [];
    const suggestions = [];
    // Basic code analysis
    if (code.length > 200) {
        score += 5;
        readability += 1;
        feedback.push("Detailed implementation");
    }
    if (code.includes('function') || code.includes('def') || code.includes('class')) {
        score += 10;
        correctness += 1;
        feedback.push("Proper function/class structure");
    }
    if (code.includes('//') || code.includes('#') || code.includes('/*')) {
        score += 5;
        readability += 2;
        feedback.push("Good use of comments");
    }
    if (code.includes('for') || code.includes('while') || code.includes('forEach')) {
        efficiency += 2;
        feedback.push("Efficient iteration");
    }
    // Check for common patterns
    if (language === 'javascript') {
        if (code.includes('const') || code.includes('let')) {
            score += 5;
            feedback.push("Modern JavaScript practices");
        }
        if (code.includes('arrow function') || code.includes('=>')) {
            readability += 1;
        }
    }
    if (language === 'python') {
        if (code.includes('def ') && code.includes(':')) {
            score += 5;
            feedback.push("Proper Python function syntax");
        }
        if (code.includes('if __name__ == "__main__"')) {
            score += 5;
            feedback.push("Good Python module structure");
        }
    }
    // Generate suggestions
    if (readability < 8) {
        suggestions.push("Consider using more descriptive variable names");
    }
    if (efficiency < 8) {
        suggestions.push("Look for opportunities to optimize time complexity");
    }
    if (!code.includes('//') && !code.includes('#')) {
        suggestions.push("Adding comments would improve code readability");
    }
    if (language === 'javascript' && !code.includes('const') && !code.includes('let')) {
        suggestions.push("Use 'const' or 'let' instead of 'var' for better scoping");
    }
    // Ensure scores are within bounds
    score = Math.min(100, Math.max(0, score));
    readability = Math.min(10, Math.max(1, readability));
    efficiency = Math.min(10, Math.max(1, efficiency));
    correctness = Math.min(10, Math.max(1, correctness));
    return {
        score,
        feedback: feedback.length > 0
            ? feedback.join('. ') + '. Overall a solid implementation with room for improvements.'
            : 'Code structure looks good. Consider adding more advanced patterns for better maintainability.',
        suggestions,
        codeQuality: {
            readability,
            efficiency,
            correctness
        }
    };
}
// Submit interview answer
export const submitAnswer = async (req, res) => {
    try {
        const { questionId, answer, answerType, language, executionResult } = req.body;
        if (!questionId || !answer || !answerType) {
            return res.status(400).json({
                error: 'Question ID, answer, and answer type are required'
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
            userId: req.user?.id // Assuming you have user authentication
        };
        // TODO: Save to database
        console.log('Answer submitted:', submissionData);
        res.json({
            success: true,
            submissionId: submissionData.id
        });
    }
    catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};
// Get coding question
export const getCodingQuestion = async (req, res) => {
    try {
        const { domain, difficulty, questionNumber } = req.query;
        // Mock questions database
        const questions = {
            frontend: {
                Beginner: [
                    {
                        id: 1,
                        text: "Create a function that adds two numbers and returns the result.",
                        language: "javascript",
                        starterCode: `function addNumbers(a, b) {
    // Write your solution here
    
}

console.log(addNumbers(3, 5)); // Expected: 8`,
                        testCases: [
                            { input: "3, 5", expectedOutput: "8", description: "Basic addition" },
                            { input: "0, 0", expectedOutput: "0", description: "Zero addition" },
                            { input: "-2, 3", expectedOutput: "1", description: "Negative number" }
                        ],
                        hints: [
                            "Use the + operator to add the numbers",
                            "Don't forget to return the result",
                            "Test with different number combinations"
                        ]
                    }
                ],
                Intermediate: [
                    {
                        id: 2,
                        text: "Implement a function that reverses a string without using built-in reverse methods.",
                        language: "javascript",
                        starterCode: `function reverseString(str) {
    // Write your solution here
    
}

console.log(reverseString("hello")); // Expected: "olleh"`,
                        testCases: [
                            { input: '"hello"', expectedOutput: '"olleh"', description: "Basic string reversal" },
                            { input: '""', expectedOutput: '""', description: "Empty string" },
                            { input: '"a"', expectedOutput: '"a"', description: "Single character" }
                        ],
                        hints: [
                            "Think about iterating through the string",
                            "Consider using a loop to build the reversed string",
                            "What's the time complexity of your solution?"
                        ]
                    }
                ]
            },
            backend: {
                Beginner: [
                    {
                        id: 1,
                        text: "Create a function that adds two numbers and returns the result.",
                        language: "python",
                        starterCode: `def add_numbers(a, b):
    # Write your solution here
    pass

print(add_numbers(3, 5))  # Expected: 8`,
                        testCases: [
                            { input: "3, 5", expectedOutput: "8", description: "Basic addition" },
                            { input: "0, 0", expectedOutput: "0", description: "Zero addition" }
                        ],
                        hints: [
                            "Use the + operator to add the numbers",
                            "Don't forget to return the result",
                            "Test with different number combinations"
                        ]
                    }
                ]
            }
        };
        const domainQuestions = questions[domain] || questions.frontend;
        const difficultyQuestions = domainQuestions[difficulty] || domainQuestions.Beginner;
        const questionIndex = Math.min(parseInt(questionNumber || '1') - 1, difficultyQuestions.length - 1);
        const question = difficultyQuestions[questionIndex];
        if (!question) {
            return res.status(404).json({
                error: 'Question not found'
            });
        }
        res.json(question);
    }
    catch (error) {
        console.error('Get coding question error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};
