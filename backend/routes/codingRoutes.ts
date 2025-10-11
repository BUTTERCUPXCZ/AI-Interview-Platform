import express from 'express'
import { executeCode, evaluateCode, submitAnswer, getCodingQuestion, runCodeWithEvaluation } from '../controller/coding.controller'

const router = express.Router()

// Execute code in sandbox
router.post('/execute', executeCode)

// Get AI evaluation for code
router.post('/evaluate', evaluateCode)

// Submit interview answer
router.post('/submit-answer', submitAnswer)

// Get coding question (Gemini-powered)
router.get('/question', getCodingQuestion)

// Execute code and get AI evaluation (new endpoint)
router.post('/run-and-evaluate', runCodeWithEvaluation)

export default router