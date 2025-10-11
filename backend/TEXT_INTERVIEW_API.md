# Text-Based Interview API Documentation

This API provides endpoints for conducting text-based interviews with AI-generated questions and automated evaluation.

## Overview

The text interview system allows users to:
- Start a new text-based interview session
- Progress through questions one by one
- Submit text answers for evaluation
- Track progress and receive real-time feedback
- Get comprehensive interview summaries

## API Endpoints

### 1. Start Text Interview
**POST** `/api/interview/text/start`

Start a new text-based interview session.

**Request Body:**
```json
{
  "userId": 1,
  "domain": "FRONTEND",
  "interviewType": "TECHNICAL", 
  "difficulty": "INTERMEDIATE",
  "duration": 30
}
```

**Response:**
```json
{
  "session": {
    "id": 123,
    "domain": "FRONTEND",
    "interviewType": "TECHNICAL",
    "difficulty": "INTERMEDIATE",
    "duration": 30,
    "format": "TEXT",
    "status": "IN_PROGRESS",
    "startedAt": "2025-10-10T10:00:00.000Z",
    "totalQuestions": 5
  },
  "currentQuestion": {
    "id": 456,
    "questionText": "Explain the difference between let, const, and var in JavaScript.",
    "questionNumber": 1,
    "totalQuestions": 5
  }
}
```

### 2. Get Next Question
**GET** `/api/interview/text/session/{sessionId}/next-question?currentQuestionId={questionId}`

Get the next question in the interview sequence.

**Response:**
```json
{
  "currentQuestion": {
    "id": 457,
    "questionText": "How would you optimize a React application for performance?",
    "questionNumber": 2,
    "totalQuestions": 5
  },
  "sessionInfo": {
    "remainingTime": 25,
    "progress": 40
  },
  "completed": false
}
```

### 3. Submit Answer
**POST** `/api/interview/text/answer`

Submit an answer for evaluation.

**Request Body:**
```json
{
  "sessionId": 123,
  "questionId": 456,
  "answer": "Let, const, and var are different ways to declare variables in JavaScript. Var has function scope and is hoisted, let has block scope and temporal dead zone, const is for constants with block scope..."
}
```

**Response:**
```json
{
  "questionId": 456,
  "userAnswer": "Let, const, and var are different ways...",
  "score": 8.5,
  "aiEvaluation": "Good understanding of variable declarations. Covered key differences accurately.",
  "feedback": "Excellent explanation of scoping differences. You correctly identified the temporal dead zone concept. Consider adding examples of when to use each declaration type in practice."
}
```

### 4. Get Interview Progress
**GET** `/api/interview/text/session/{sessionId}/progress`

Get current interview progress and statistics.

**Response:**
```json
{
  "sessionId": 123,
  "domain": "FRONTEND",
  "interviewType": "TECHNICAL",
  "difficulty": "INTERMEDIATE",
  "status": "IN_PROGRESS",
  "startedAt": "2025-10-10T10:00:00.000Z",
  "totalQuestions": 5,
  "answeredQuestions": 2,
  "remainingQuestions": 3,
  "averageScore": 8.25,
  "progress": 40,
  "remainingTime": 25,
  "expired": false,
  "isCompleted": false
}
```

### 5. Complete Interview
**POST** `/api/interview/text/session/{sessionId}/complete`

Mark the interview as completed and calculate final scores.

**Response:**
```json
{
  "sessionId": 123,
  "status": "COMPLETED",
  "totalScore": 8.4,
  "endedAt": "2025-10-10T10:30:00.000Z",
  "message": "Interview completed successfully!"
}
```

### 6. Get Interview Summary
**GET** `/api/interview/text/session/{sessionId}/summary`

Get comprehensive interview summary with all questions and answers.

**Response:**
```json
{
  "session": {
    "id": 123,
    "domain": "FRONTEND",
    "interviewType": "TECHNICAL",
    "difficulty": "INTERMEDIATE",
    "duration": 30,
    "status": "COMPLETED",
    "startedAt": "2025-10-10T10:00:00.000Z",
    "endedAt": "2025-10-10T10:30:00.000Z",
    "totalScore": 8.4
  },
  "user": {
    "Firstname": "John",
    "Lastname": "Doe",
    "email": "john@example.com"
  },
  "statistics": {
    "totalQuestions": 5,
    "answeredQuestions": 5,
    "averageScore": 8.4,
    "completionRate": 100
  },
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Explain the difference between let, const, and var in JavaScript.",
      "userAnswer": "Let, const, and var are different ways...",
      "score": 8.5,
      "aiEvaluation": "Good understanding of variable declarations..."
    }
  ]
}
```

### 7. Get User Interview History
**GET** `/api/interview/text/user/{userId}/history?limit=10`

Get user's text interview history.

**Response:**
```json
{
  "userId": 1,
  "totalSessions": 3,
  "sessions": [
    {
      "sessionId": 123,
      "domain": "FRONTEND",
      "interviewType": "TECHNICAL",
      "difficulty": "INTERMEDIATE",
      "duration": 30,
      "status": "COMPLETED",
      "startedAt": "2025-10-10T10:00:00.000Z",
      "endedAt": "2025-10-10T10:30:00.000Z",
      "totalScore": 8.4,
      "statistics": {
        "totalQuestions": 5,
        "answeredQuestions": 5,
        "averageScore": 8.4,
        "completionRate": 100
      }
    }
  ]
}
```

## Supported Values

### Domain
- `FRONTEND` - Frontend development
- `BACKEND` - Backend development  
- `FULLSTACK` - Full-stack development
- `DATA_SCIENCE` - Data science
- `MOBILE` - Mobile development
- `DEVOPS` - DevOps

### Interview Type
- `TECHNICAL` - Technical knowledge questions
- `BEHAVIORAL` - Behavioral interview questions
- `SYSTEM_DESIGN` - System design questions

### Difficulty
- `BEGINNER` - Entry level
- `INTERMEDIATE` - Mid level
- `ADVANCED` - Senior level

### Session Status
- `IN_PROGRESS` - Interview is ongoing
- `COMPLETED` - Interview finished successfully
- `CANCELED` - Interview was canceled or expired

## Error Responses

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created (for starting new interviews)
- `400` - Bad request (missing/invalid parameters)
- `404` - Not found (session/question not found)
- `500` - Internal server error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Usage Flow

1. **Start Interview** - Call `/text/start` with user and interview parameters
2. **Answer Questions** - Loop through:
   - Submit answer using `/text/answer`
   - Get next question using `/text/next-question`
3. **Monitor Progress** - Use `/text/session/{id}/progress` to track progress
4. **Complete Interview** - Call `/text/session/{id}/complete` when done
5. **Review Results** - Get summary using `/text/session/{id}/summary`

## Notes

- Sessions automatically expire after the specified duration
- Questions are generated using AI based on domain, difficulty, and type
- Answers are evaluated in real-time using AI
- All timestamps are in ISO 8601 format
- Scores are on a scale of 0-10
- Progress is calculated as percentage completed