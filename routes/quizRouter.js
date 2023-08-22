import express from 'express';
import quizController from '../controllers/quizController.js';
// import verifyController from '../controllers/verifyController.js';

const quizRouter = express.Router();

quizRouter.get('/', quizController.getQuiz);
quizRouter.post('/', quizController.answerQuiz);

export default quizRouter;
