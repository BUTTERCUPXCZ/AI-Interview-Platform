// Example usage of the new Gemini-powered coding API
// This file demonstrates how to integrate the enhanced coding features

class CodingInterviewAPI {
    constructor(baseURL = '/api/coding') {
        this.baseURL = baseURL;
    }

    // Generate a coding question using Gemini AI
    async generateQuestion(domain, difficulty, language, sessionId = null) {
        const params = new URLSearchParams({
            domain,
            difficulty,
            language
        });

        if (sessionId) {
            params.append('sessionId', sessionId);
        }

        try {
            const response = await fetch(`${this.baseURL}/question?${params}`);

            if (!response.ok) {
                throw new Error(`Failed to generate question: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error generating question:', error);
            throw error;
        }
    }

    // Execute code and get AI evaluation
    async runCodeWithEvaluation(codeData) {
        try {
            const response = await fetch(`${this.baseURL}/run-and-evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(codeData)
            });

            if (!response.ok) {
                throw new Error(`Failed to run code: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error running code:', error);
            throw error;
        }
    }

    // Legacy: Execute code without AI evaluation
    async executeCode(code, language, testCases = []) {
        try {
            const response = await fetch(`${this.baseURL}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    language,
                    testCases
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to execute code: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error executing code:', error);
            throw error;
        }
    }
}

// Example usage in a React component or similar
async function exampleUsage() {
    const api = new CodingInterviewAPI();

    try {
        // 1. Generate a coding question
        console.log('Generating coding question...');
        const question = await api.generateQuestion(
            'frontend',      // domain
            'Intermediate',  // difficulty
            'javascript',    // language
            123             // sessionId (optional)
        );

        console.log('Generated question:', question);
        /*
        Expected response:
        {
            id: 456,
            title: "Implement Debounce Function",
            description: "Create a debounce function that delays the execution...",
            starterCode: "function debounce(func, delay) { // Your code here }",
            testCases: [...],
            hints: [...]
        }
        */

        // 2. User writes their solution
        const userSolution = `
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
        `;

        // 3. Run code and get AI evaluation
        console.log('Running code and getting evaluation...');
        const result = await api.runCodeWithEvaluation({
            code: userSolution,
            language: 'javascript',
            questionText: question.description,
            questionId: question.id,
            testCases: question.testCases
        });

        console.log('Execution result:', result.execution);
        console.log('AI evaluation:', result.evaluation);
        /*
        Expected evaluation:
        {
            overallScore: 92,
            breakdown: {
                correctness: 95,
                codeQuality: 90,
                efficiency: 90,
                edgeCaseHandling: 92
            },
            feedback: "Excellent implementation of the debounce pattern...",
            strengths: ["Proper use of closures", "Handles context correctly"],
            improvements: ["Consider adding input validation"],
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            passedAllTests: true,
            recommendations: "Great work! Consider edge cases like null functions."
        }
        */

        // 4. Display results to user
        displayResults(result);

    } catch (error) {
        console.error('Error in coding interview flow:', error);
        // Handle error - show user-friendly message
    }
}

function displayResults(result) {
    const { execution, evaluation } = result;

    // Display execution results
    if (execution.success) {
        console.log('✅ Code executed successfully');
        console.log(`⏱️ Execution time: ${execution.executionTime}ms`);

        if (execution.testResults) {
            execution.testResults.forEach((test, index) => {
                if (test.passed) {
                    console.log(`✅ Test ${index + 1}: PASSED`);
                } else {
                    console.log(`❌ Test ${index + 1}: FAILED`);
                    console.log(`  Expected: ${test.expectedOutput}`);
                    console.log(`  Got: ${test.actualOutput}`);
                }
            });
        }
    } else {
        console.log('❌ Code execution failed');
        console.log(`Error: ${execution.error}`);
    }

    // Display AI evaluation
    if (evaluation) {
        console.log(`\n🎯 Overall Score: ${evaluation.overallScore}/100`);
        console.log('\n📊 Breakdown:');
        console.log(`  Correctness: ${evaluation.breakdown.correctness}/100`);
        console.log(`  Code Quality: ${evaluation.breakdown.codeQuality}/100`);
        console.log(`  Efficiency: ${evaluation.breakdown.efficiency}/100`);
        console.log(`  Edge Cases: ${evaluation.breakdown.edgeCaseHandling}/100`);

        console.log('\n💪 Strengths:');
        evaluation.strengths.forEach(strength => console.log(`  • ${strength}`));

        console.log('\n🔧 Areas for Improvement:');
        evaluation.improvements.forEach(improvement => console.log(`  • ${improvement}`));

        console.log('\n💡 Recommendations:');
        console.log(`  ${evaluation.recommendations}`);

        console.log('\n⚡ Complexity Analysis:');
        console.log(`  Time: ${evaluation.timeComplexity}`);
        console.log(`  Space: ${evaluation.spaceComplexity}`);
    }
}

// Advanced usage: Interview session flow
async function interviewSessionFlow(sessionId, domain, difficulty) {
    const api = new CodingInterviewAPI();
    const questions = [];
    const results = [];

    try {
        // Generate multiple questions for the session
        for (let i = 0; i < 3; i++) {
            const language = ['javascript', 'python'][i % 2]; // Alternate languages

            const question = await api.generateQuestion(
                domain,
                difficulty,
                language,
                sessionId
            );

            questions.push(question);
            console.log(`Question ${i + 1} generated:`, question.title);
        }

        // Simulate user solving questions
        for (const question of questions) {
            console.log(`\nSolving: ${question.title}`);

            // In a real app, this would be user input
            const userCode = generateMockSolution(question);

            const result = await api.runCodeWithEvaluation({
                code: userCode,
                language: question.language,
                questionText: question.description,
                questionId: question.id,
                testCases: question.testCases
            });

            results.push(result);
            console.log(`Score: ${result.evaluation?.overallScore || 0}/100`);
        }

        // Calculate session summary
        const averageScore = results.reduce((sum, result) =>
            sum + (result.evaluation?.overallScore || 0), 0) / results.length;

        console.log(`\n🏆 Session Complete! Average Score: ${averageScore.toFixed(1)}/100`);

        return {
            questions,
            results,
            averageScore
        };

    } catch (error) {
        console.error('Error in interview session:', error);
        throw error;
    }
}

function generateMockSolution(question) {
    // In a real app, this would be the user's actual code
    // This is just for demonstration
    return question.starterCode.replace(
        '// Write your solution here',
        '// Mock solution\nreturn "Mock implementation";'
    );
}

// Export for use in other modules
export {
    CodingInterviewAPI,
    exampleUsage,
    interviewSessionFlow,
    displayResults
};

// Usage examples:
// exampleUsage();
// interviewSessionFlow(123, 'frontend', 'Intermediate');