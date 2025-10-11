import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
function extractTextFromResponse(response) {
    if (!response)
        return undefined;
    const text = response.text;
    if (typeof text === 'function')
        return text();
    if (typeof text === 'string')
        return text;
    return undefined;
}
function validateQuestions(data) {
    if (!Array.isArray(data))
        throw new Error('Parsed response is not an array');
    const questions = data.map((item) => {
        if (!item ||
            typeof item.question !== 'string' ||
            typeof item.isCodingQuestion !== 'boolean') {
            throw new Error('Invalid question item shape in model response');
        }
        return {
            question: item.question,
            isCodingQuestion: item.isCodingQuestion,
        };
    });
    return questions;
}
export const generateQuestion = async (domain, difficulty, interviewType) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const prompt = `Generate 5 ${difficulty} ${interviewType} interview questions for ${domain} developers.\n` +
        'Return the output as a JSON array with items like: {"question": "...", "isCodingQuestion": true}';
    const result = await model.generateContent(prompt);
    const text = extractTextFromResponse(result?.response);
    if (!text) {
        throw new Error('Empty or invalid response from generative model');
    }
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch (err) {
        throw new Error('Failed to parse model response as JSON: ' + err.message);
    }
    return validateQuestions(parsed);
};
