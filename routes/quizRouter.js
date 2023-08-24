import express from 'express';
import quizController from '../controllers/quizController.js';
import verifyController from '../controllers/verifyController.js';

const quizRouter = express.Router();

quizRouter.get('/:username', verifyController.verifyToken, quizController.getQuiz);
quizRouter.post('/:username', verifyController.verifyToken, quizController.answerQuiz);

export default quizRouter;
