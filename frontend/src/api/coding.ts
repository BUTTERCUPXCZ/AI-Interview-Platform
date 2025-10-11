import axios from "axios";

export interface CodeExecutionRequest {
    code: string;
    language: string;
    testCases?: Array<{
        input: string;
        expectedOutput: string;
        description?: string;
    }>;
}

export interface AIEvaluationResult {
    score: number;
    feedback: string;
    suggestions: string[];
    codeQuality: {
        readability: number;
        efficiency: number;
        correctness: number;
    };
}

export interface CodeExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    testResults?: Array<{
        passed: boolean;
        input: string;
        expectedOutput: string;
        actualOutput?: string;
        error?: string;
        description?: string;
    }>;
    isSimulated?: boolean;
    runtimeMissing?: boolean;
    installationGuide?: string;
    aiEvaluation?: AIEvaluationResult;
}

// Execute code in a secure sandbox environment
export const executeCode = async (request: CodeExecutionRequest): Promise<CodeExecutionResult> => {
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/coding/execute`,
            request,
            {
                withCredentials: true,
                timeout: 30000 // 30 second timeout for code execution
            }
        );
        return response.data;
    } catch (error) {
        console.error('Code execution error:', error);

        // Fallback to mock execution for development
        if (import.meta.env.DEV) {
            return mockCodeExecution(request);
        }

        throw error;
    }
};

// Get AI evaluation for submitted code
export const getAICodeEvaluation = async (
    code: string,
    language: string,
    questionContext?: string,
    expectedOutput?: string
): Promise<AIEvaluationResult> => {
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/coding/evaluate`,
            {
                code,
                language,
                questionContext,
                expectedOutput
            },
            {
                withCredentials: true,
                timeout: 15000 // 15 second timeout for AI evaluation
            }
        );
        return response.data;
    } catch (error) {
        console.error('AI evaluation error:', error);

        // Fallback to mock evaluation for development
        if (import.meta.env.DEV) {
            return mockAIEvaluation(code, language);
        }

        throw error;
    }
};

// Submit interview answer (code or text)
export const submitInterviewAnswer = async (
    questionId: number,
    answer: string,
    answerType: 'text' | 'code',
    language?: string,
    executionResult?: CodeExecutionResult
) => {
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/interview/submit-answer`,
            {
                questionId,
                answer,
                answerType,
                language,
                executionResult,
                timestamp: new Date().toISOString()
            },
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('Submit answer error:', error);
        throw error;
    }
};

// Get coding question by difficulty and domain
export const getCodingQuestion = async (
    domain: string,
    difficulty: string,
    questionNumber?: number
) => {
    try {
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/coding/question`,
            {
                params: { domain, difficulty, questionNumber },
                withCredentials: true
            }
        );
        return response.data;
    } catch (error) {
        console.error('Get coding question error:', error);

        // Fallback to mock questions for development
        if (import.meta.env.DEV) {
            return mockGetCodingQuestion(domain, difficulty, questionNumber);
        }

        throw error;
    }
};

// Mock functions for development
const mockCodeExecution = async (request: CodeExecutionRequest): Promise<CodeExecutionResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { code, language } = request;

    // Simple mock logic based on code content and language
    let mockOutput = '';
    let mockSuccess = true;

    // Framework-specific mock outputs
    if (language === 'jsx' || language === 'tsx') {
        if (code.includes('useState') || code.includes('React')) {
            mockOutput = 'React Component rendered successfully!\n✅ Component structure looks good\n✅ State management implemented\n✅ Event handlers working';
        } else {
            mockOutput = 'React Component compiled successfully!';
        }
    } else if (language === 'vue') {
        if (code.includes('<template>') && code.includes('<script>')) {
            mockOutput = 'Vue Component compiled successfully!\n✅ Template syntax valid\n✅ Script section looks good\n✅ Reactive data working';
        } else {
            mockOutput = 'Vue Component compiled successfully!';
        }
    } else if (language === 'angular') {
        if (code.includes('@Component') && code.includes('export class')) {
            mockOutput = 'Angular Component compiled successfully!\n✅ Component decorator valid\n✅ TypeScript syntax correct\n✅ Template binding working';
        } else {
            mockOutput = 'Angular Component compiled successfully!';
        }
    } else if (language === 'svelte') {
        if (code.includes('<script>') && code.includes('let ')) {
            mockOutput = 'Svelte Component compiled successfully!\n✅ Reactive declarations working\n✅ Template syntax valid\n✅ Event handlers bound';
        } else {
            mockOutput = 'Svelte Component compiled successfully!';
        }
    } else if (language === 'html') {
        if (code.includes('<!DOCTYPE html>') && code.includes('<body>')) {
            mockOutput = 'HTML Document validated successfully!\n✅ Document structure valid\n✅ Meta tags present\n✅ Semantic elements used';
        } else {
            mockOutput = 'HTML validated successfully!';
        }
    } else if (language === 'css' || language === 'scss') {
        if (code.includes('@media') || code.includes('flexbox') || code.includes('grid')) {
            mockOutput = 'CSS compiled successfully!\n✅ Responsive design detected\n✅ Modern layout techniques used\n✅ No syntax errors';
        } else if (code.includes(':hover') || code.includes('transition')) {
            mockOutput = 'CSS compiled successfully!\n✅ Interactive elements styled\n✅ Animations/transitions added\n✅ No syntax errors';
        } else {
            mockOutput = 'CSS validated successfully!\n✅ Syntax is correct\n✅ Styles applied';
        }
    } else if (language === 'javascript' || language === 'typescript') {
        if (code.includes('function') || code.includes('const ') || code.includes('=>')) {
            if (code.includes('reverseString') || code.includes('reverse')) {
                mockOutput = '"olleh"';
            } else if (code.includes('findMax') || code.includes('max')) {
                mockOutput = '9';
            } else if (code.includes('isPalindrome') || code.includes('palindrome')) {
                mockOutput = 'true';
            } else {
                mockOutput = 'Function executed successfully!\n✅ No runtime errors\n✅ Logic appears correct';
            }
        } else {
            mockOutput = 'Hello, World!';
        }
    } else if (language === 'python') {
        if (code.includes('def ') || code.includes('class ')) {
            if (code.includes('reverse_string') || code.includes('reverse')) {
                mockOutput = 'olleh';
            } else if (code.includes('find_max') || code.includes('max')) {
                mockOutput = '9';
            } else if (code.includes('is_palindrome') || code.includes('palindrome')) {
                mockOutput = 'True';
            } else {
                mockOutput = 'Function executed successfully!\n✅ No runtime errors\n✅ Logic appears correct';
            }
        } else {
            mockOutput = 'Hello, World!';
        }
    } else {
        mockOutput = 'Code compiled/executed successfully!';
    }

    // Mock error for certain patterns
    if (code.includes('syntax error') || code.trim().length < 10) {
        mockSuccess = false;
        const errorMessages = {
            'jsx': 'JSX Error: Missing closing tag or invalid syntax',
            'tsx': 'TypeScript Error: Type checking failed',
            'vue': 'Vue Error: Template compilation failed',
            'angular': 'Angular Error: Component decorator missing',
            'svelte': 'Svelte Error: Invalid reactive statement',
            'html': 'HTML Error: Invalid markup or missing tags',
            'css': 'CSS Error: Invalid property or syntax error',
            'scss': 'SCSS Error: Compilation failed',
            'javascript': 'JavaScript Error: SyntaxError - Unexpected token',
            'python': 'Python Error: SyntaxError - invalid syntax'
        };

        return {
            success: false,
            error: errorMessages[language as keyof typeof errorMessages] || 'Compilation/Execution Error',
            executionTime: 234
        };
    }

    const aiEvaluation = await mockAIEvaluation(code, language);

    return {
        success: mockSuccess,
        output: mockOutput,
        executionTime: Math.floor(Math.random() * 1000) + 100,
        aiEvaluation
    };
};

const mockAIEvaluation = async (code: string, language: string): Promise<AIEvaluationResult> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock scoring based on code complexity and patterns
    let score = 70;
    let readability = 7;
    let efficiency = 6;
    let correctness = 8;

    const feedback = [];
    const suggestions = [];

    // Framework-specific analysis
    if (language === 'jsx' || language === 'tsx') {
        // React-specific analysis
        if (code.includes('useState') || code.includes('useEffect')) {
            score += 15;
            correctness += 2;
            feedback.push("Excellent use of React hooks");
        }
        if (code.includes('React.FC') || code.includes('function Component')) {
            score += 10;
            readability += 2;
            feedback.push("Good functional component structure");
        }
        if (code.includes('Props') || code.includes('interface')) {
            score += 10;
            readability += 1;
            feedback.push("Strong TypeScript typing");
        }
        if (!code.includes('key=') && code.includes('map(')) {
            suggestions.push("Consider adding 'key' prop when rendering lists");
        }
        if (!code.includes('useCallback') && code.includes('onClick')) {
            suggestions.push("Consider using useCallback for event handlers to optimize performance");
        }
    } else if (language === 'vue') {
        // Vue-specific analysis
        if (code.includes('<template>') && code.includes('<script>') && code.includes('<style>')) {
            score += 15;
            readability += 2;
            feedback.push("Excellent Single File Component structure");
        }
        if (code.includes('ref(') || code.includes('reactive(')) {
            score += 10;
            correctness += 1;
            feedback.push("Good use of Vue 3 Composition API");
        }
        if (code.includes('v-model') || code.includes('@click')) {
            score += 5;
            feedback.push("Proper Vue directives usage");
        }
        if (code.includes('scoped') && code.includes('<style')) {
            score += 5;
            feedback.push("Good use of scoped styles");
        }
        if (!code.includes('emits:') && code.includes('$emit')) {
            suggestions.push("Consider declaring emits in component options");
        }
    } else if (language === 'angular') {
        // Angular-specific analysis
        if (code.includes('@Component') && code.includes('export class')) {
            score += 15;
            readability += 2;
            feedback.push("Proper Angular component structure");
        }
        if (code.includes('@Input') || code.includes('@Output')) {
            score += 10;
            correctness += 1;
            feedback.push("Good component communication patterns");
        }
        if (code.includes('OnInit') || code.includes('OnDestroy')) {
            score += 10;
            efficiency += 1;
            feedback.push("Proper lifecycle hook implementation");
        }
        if (code.includes('Observable') || code.includes('Subject')) {
            score += 10;
            efficiency += 2;
            feedback.push("Excellent reactive programming with RxJS");
        }
        if (!code.includes('trackBy') && code.includes('*ngFor')) {
            suggestions.push("Consider using trackBy function for better performance in lists");
        }
    } else if (language === 'svelte') {
        // Svelte-specific analysis
        if (code.includes('let ') && code.includes('<script>')) {
            score += 10;
            correctness += 1;
            feedback.push("Good reactive variable declarations");
        }
        if (code.includes('$:')) {
            score += 10;
            efficiency += 2;
            feedback.push("Excellent use of reactive statements");
        }
        if (code.includes('on:') || code.includes('bind:')) {
            score += 5;
            feedback.push("Proper event handling and binding");
        }
        if (code.includes('onMount') || code.includes('onDestroy')) {
            score += 5;
            feedback.push("Good lifecycle management");
        }
        if (code.includes('{#if') || code.includes('{#each')) {
            score += 5;
            feedback.push("Good template logic usage");
        }
    } else if (language === 'html') {
        // HTML-specific analysis
        if (code.includes('<!DOCTYPE html>')) {
            score += 5;
            correctness += 1;
            feedback.push("Proper HTML5 document structure");
        }
        if (code.includes('semantic') || code.includes('<main>') || code.includes('<section>')) {
            score += 10;
            readability += 2;
            feedback.push("Excellent use of semantic HTML");
        }
        if (code.includes('alt=') || code.includes('aria-')) {
            score += 10;
            readability += 1;
            feedback.push("Good accessibility practices");
        }
        if (!code.includes('meta') && code.includes('<head>')) {
            suggestions.push("Consider adding meta tags for better SEO and responsiveness");
        }
    } else if (language === 'css' || language === 'scss') {
        // CSS/SCSS-specific analysis
        if (code.includes('flexbox') || code.includes('grid') || code.includes('display: flex')) {
            score += 10;
            efficiency += 2;
            feedback.push("Modern layout techniques used");
        }
        if (code.includes('@media') || code.includes('responsive')) {
            score += 10;
            efficiency += 1;
            feedback.push("Responsive design implemented");
        }
        if (code.includes('transition') || code.includes('animation')) {
            score += 5;
            feedback.push("Nice interactive effects");
        }
        if (language === 'scss' && (code.includes('$') || code.includes('@mixin'))) {
            score += 10;
            readability += 2;
            feedback.push("Good use of SCSS features");
        }
        if (!code.includes('box-sizing') && code.includes('width')) {
            suggestions.push("Consider using 'box-sizing: border-box' for more predictable layouts");
        }
    }

    // General code analysis
    if (code.length > 200) {
        score += 10;
        readability += 1;
        feedback.push("Comprehensive implementation");
    }

    if (code.includes('//') || code.includes('#') || code.includes('<!--')) {
        score += 5;
        readability += 2;
        feedback.push("Good use of comments");
    }

    if (code.includes('function') || code.includes('def') || code.includes('=>')) {
        efficiency += 1;
        feedback.push("Well-structured functions");
    }

    // Generate suggestions based on language
    if (readability < 8) {
        suggestions.push("Consider adding more descriptive variable names and comments");
    }
    if (efficiency < 8) {
        if (['jsx', 'tsx', 'vue', 'angular', 'svelte'].includes(language)) {
            suggestions.push("Look for opportunities to optimize component re-renders and state updates");
        } else {
            suggestions.push("Look for opportunities to optimize time complexity");
        }
    }

    // Ensure scores are within bounds
    score = Math.min(100, Math.max(0, score));
    readability = Math.min(10, Math.max(1, readability));
    efficiency = Math.min(10, Math.max(1, efficiency));
    correctness = Math.min(10, Math.max(1, correctness));

    const frameworkFeedback = {
        'jsx': 'React component with modern patterns',
        'tsx': 'TypeScript React component with strong typing',
        'vue': 'Vue.js component with clean structure',
        'angular': 'Angular component following best practices',
        'svelte': 'Svelte component with reactive patterns',
        'html': 'HTML document with semantic structure',
        'css': 'CSS with modern styling techniques',
        'scss': 'SCSS with advanced preprocessing features'
    };

    const finalFeedback = feedback.length > 0
        ? feedback.join('. ') + '. ' + (frameworkFeedback[language as keyof typeof frameworkFeedback] || 'Well-structured code overall.')
        : (frameworkFeedback[language as keyof typeof frameworkFeedback] || 'Code structure looks good. Consider adding more advanced patterns for better maintainability.');

    return {
        score,
        feedback: finalFeedback,
        suggestions,
        codeQuality: {
            readability,
            efficiency,
            correctness
        }
    };
};

const mockGetCodingQuestion = async (domain: string, difficulty: string, questionNumber?: number) => {
    const questions = {
        frontend: {
            Beginner: [
                {
                    id: 1,
                    text: "Create a function that adds two numbers and returns the result.",
                    starterCode: `function addNumbers(a, b) {
    // Write your solution here
    
}

console.log(addNumbers(3, 5)); // Expected: 8`,
                    testCases: [
                        { input: '3, 5', expectedOutput: '8', description: 'Basic addition' },
                        { input: '0, 0', expectedOutput: '0', description: 'Zero addition' },
                        { input: '-2, 3', expectedOutput: '1', description: 'Negative number' }
                    ]
                }
            ],
            Intermediate: [
                {
                    id: 2,
                    text: "Implement a function that reverses a string without using built-in reverse methods.",
                    starterCode: `function reverseString(str) {
    // Write your solution here
    
}

console.log(reverseString("hello")); // Expected: "olleh"`,
                    testCases: [
                        { input: '"hello"', expectedOutput: '"olleh"', description: 'Basic string reversal' },
                        { input: '""', expectedOutput: '""', description: 'Empty string' }
                    ]
                }
            ]
        },
        backend: {
            Beginner: [
                {
                    id: 1,
                    text: "Create a function that adds two numbers and returns the result.",
                    starterCode: `def add_numbers(a, b):
    # Write your solution here
    pass

print(add_numbers(3, 5))  # Expected: 8`,
                    testCases: [
                        { input: '3, 5', expectedOutput: '8', description: 'Basic addition' },
                        { input: '0, 0', expectedOutput: '0', description: 'Zero addition' }
                    ]
                }
            ]
        }
    };

    const domainQuestions = questions[domain as keyof typeof questions] || questions.frontend;
    const difficultyQuestions = domainQuestions[difficulty as keyof typeof domainQuestions] || domainQuestions.Beginner;
    const question = difficultyQuestions[Math.min((questionNumber || 1) - 1, difficultyQuestions.length - 1)];

    return question;
};

export default {
    executeCode,
    getAICodeEvaluation,
    submitInterviewAnswer,
    getCodingQuestion
};