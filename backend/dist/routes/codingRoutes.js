import express from 'express';
import { executeCode, evaluateCode, submitAnswer, getCodingQuestion } from '../controller/coding.controller';
const router = express.Router();
// Execute code in sandbox
router.post('/execute', executeCode);
// Get AI evaluation for code
router.post('/evaluate', evaluateCode);
// Submit interview answer
router.post('/submit-answer', submitAnswer);
// Get coding question
router.get('/question', getCodingQuestion);
export default router;
