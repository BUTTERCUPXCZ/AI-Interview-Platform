# Gemini-Powered Coding Interview API

This document describes the enhanced coding interview API that uses Google's Gemini AI to generate questions and evaluate code submissions.

## Overview

The system now provides:
1. **AI-Generated Coding Questions**: Dynamic question generation based on domain, difficulty, and programming language
2. **Intelligent Code Evaluation**: Comprehensive analysis of code solutions using Gemini AI
3. **Integrated Testing**: Automatic code execution with test case validation
4. **Detailed Feedback**: Educational feedback with strengths, improvements, and recommendations

## API Endpoints

### 1. Generate Coding Question

**GET** `/api/coding/question`

Generates a new coding question using Gemini AI.

**Query Parameters:**
- `domain` (required): `frontend`, `backend`, `fullstack`, `data-science`, `mobile`, `devops`
- `difficulty` (required): `Beginner`, `Intermediate`, `Advanced`
- `language` (required): `javascript`, `python`, `java`, `typescript`, etc.
- `sessionId` (optional): If provided, saves the question to the database

**Response:**
```json
{
  "id": 123,
  "title": "Implement Array Rotation",
  "description": "Write a function that rotates an array to the right by k positions...",
  "difficulty": "Intermediate",
  "language": "javascript",
  "starterCode": "function rotateArray(nums, k) {\n    // Write your solution here\n}",
  "testCases": [
    {
      "input": "[1,2,3,4,5], 2",
      "expectedOutput": "[4,5,1,2,3]",
      "description": "Basic rotation test"
    }
  ],
  "hints": [
    "Think about the modulo operator",
    "Consider edge cases with k larger than array length"
  ],
  "timeComplexityExpected": "O(n)",
  "spaceComplexityExpected": "O(1)"
}
```

### 2. Execute and Evaluate Code

**POST** `/api/coding/run-and-evaluate`

Executes user code and provides AI-powered evaluation.

**Request Body:**
```json
{
  "code": "function rotateArray(nums, k) { /* user solution */ }",
  "language": "javascript",
  "questionText": "Write a function that rotates an array...",
  "questionId": 123,
  "testCases": [
    {
      "input": "[1,2,3,4,5], 2",
      "expectedOutput": "[4,5,1,2,3]",
      "description": "Basic rotation test"
    }
  ]
}
```

**Response:**
```json
{
  "execution": {
    "success": true,
    "output": "[4,5,1,2,3]",
    "executionTime": 45,
    "testResults": [
      {
        "passed": true,
        "input": "[1,2,3,4,5], 2",
        "expectedOutput": "[4,5,1,2,3]",
        "actualOutput": "[4,5,1,2,3]"
      }
    ]
  },
  "evaluation": {
    "overallScore": 85,
    "breakdown": {
      "correctness": 90,
      "codeQuality": 80,
      "efficiency": 85,
      "edgeCaseHandling": 85
    },
    "feedback": "Excellent solution! Your implementation correctly handles the array rotation...",
    "strengths": [
      "Clean and readable code structure",
      "Efficient use of modulo operator",
      "Handles edge cases well"
    ],
    "improvements": [
      "Consider adding input validation",
      "Could benefit from more descriptive variable names"
    ],
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)",
    "passedAllTests": true,
    "recommendations": "Consider implementing the reverse algorithm approach for better space efficiency"
  }
}
```

### 3. Legacy Endpoints (Still Available)

- **POST** `/api/coding/execute` - Basic code execution without AI evaluation
- **POST** `/api/coding/evaluate` - Simple code evaluation
- **POST** `/api/coding/submit-answer` - Submit interview answer

## Integration Guide

### Frontend Integration

```javascript
// 1. Get a coding question
const getQuestion = async (domain, difficulty, language, sessionId) => {
  const response = await fetch(
    `/api/coding/question?domain=${domain}&difficulty=${difficulty}&language=${language}&sessionId=${sessionId}`
  );
  return response.json();
};

// 2. Run code and get evaluation
const runCode = async (code, language, questionText, questionId, testCases) => {
  const response = await fetch('/api/coding/run-and-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      language,
      questionText,
      questionId,
      testCases
    })
  });
  return response.json();
};
```

### Database Schema Updates

The system automatically stores:
- Generated questions in `InterviewQuestion` table
- Test cases in `TestCase` table
- Code submissions in `CodeSubmission` table
- AI evaluations in the question's `aiEvaluation` field

## Features

### Question Generation
- **Dynamic Content**: Each request generates unique questions
- **Domain-Specific**: Questions tailored to the selected technology domain
- **Difficulty Scaling**: Appropriate complexity for skill level
- **Multi-Language**: Supports various programming languages
- **Complete Test Suites**: Includes comprehensive test cases

### Code Evaluation
- **Comprehensive Analysis**: Evaluates correctness, quality, efficiency, and edge case handling
- **Educational Feedback**: Provides constructive criticism and learning suggestions
- **Performance Metrics**: Analyzes time and space complexity
- **Test Integration**: Considers test results in evaluation
- **Structured Scoring**: Detailed breakdown of performance areas

### Error Handling
- Graceful fallback if AI services are unavailable
- Comprehensive error messages for debugging
- Input validation and sanitization
- Timeout protection for code execution

## Environment Variables

Make sure you have the following environment variables set:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_database_connection_string
```

## Security Considerations

- Code execution is sandboxed with timeout limits
- Input validation prevents injection attacks
- Temporary files are automatically cleaned up
- API rate limiting should be implemented for production use

## Future Enhancements

1. **Code Similarity Detection**: Prevent plagiarism
2. **Advanced Metrics**: Memory usage, runtime profiling
3. **Interactive Hints**: Progressive hint system
4. **Multi-Language Testing**: Cross-language test case support
5. **Custom Question Banks**: Domain-specific question collections