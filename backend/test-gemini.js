import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function testGeminiCodingQuestion() {
    try {
        console.log("Testing Gemini API for coding question generation...");
        console.log("API Key exists:", !!process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Generate a single Intermediate level coding interview question for frontend domain using javascript programming language.

        Requirements:
        1. Create ONE realistic technical interview question appropriate for frontend development
        2. Include a clear problem description with examples and constraints
        3. Provide starter code template in javascript
        4. Generate exactly 3 comprehensive test cases with inputs and expected outputs
        5. Include 2-3 helpful hints without giving away the solution
        6. Specify expected time and space complexity
        7. Make the problem interview-appropriate (solvable in 20-45 minutes)

        Return ONLY valid JSON in this exact format:
        {
            "title": "Problem Title",
            "description": "Detailed problem description with examples, constraints, and sample input/output",
            "difficulty": "Intermediate",
            "language": "javascript",
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
                }
            ],
            "hints": ["hint1", "hint2", "hint3"],
            "timeComplexityExpected": "O(n)",
            "spaceComplexityExpected": "O(1)"
        }
        `;

        console.log("Sending request to Gemini...");
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        console.log("Raw response from Gemini:");
        console.log(responseText);

        // Clean the response to ensure it's valid JSON
        const cleanedResponse = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^\s*[\r\n]/gm, ''); // Remove empty lines

        console.log("\nCleaned response:");
        console.log(cleanedResponse);

        const questionData = JSON.parse(cleanedResponse);

        console.log("\nParsed question data:");
        console.log(JSON.stringify(questionData, null, 2));

        // Validate the response structure
        if (!questionData.title || !questionData.description || !questionData.starterCode || !questionData.testCases) {
            throw new Error('Invalid question structure returned from Gemini');
        }

        console.log("\n✅ Successfully generated coding question!");

    } catch (error) {
        console.error("❌ Error testing Gemini:", error);

        if (error.message.includes('API_KEY_INVALID')) {
            console.error("🔑 API Key is invalid. Please check your GEMINI_API_KEY environment variable.");
        } else if (error.message.includes('quota')) {
            console.error("📊 API quota exceeded. Please check your Gemini API usage.");
        } else if (error.message.includes('model')) {
            console.error("🤖 Model not found. The 'gemini-2.5-flash' model might not be available.");
        }
    }
}

testGeminiCodingQuestion();