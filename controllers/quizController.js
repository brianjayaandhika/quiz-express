import responseHelper from '../helpers/responseHelper.js';
import Redis from 'ioredis';
import { scrambleQuiz } from '../services/scrambleQuiz.js';
import { user } from '../database/db.js';

const redis = new Redis();

const quizController = {
  getQuiz: async (req, res) => {
    try {
      const isAnswered = await redis.get('isAnswered');

      if (!isAnswered) {
        return responseHelper(res, 400, null, 'Please answer the current question first!');
      }

      const quizzes = scrambleQuiz();

      const data = {
        soal: quizzes.soal,
        pilihan: quizzes.answer,
      };

      return responseHelper(res, 200, data, 'Get quizzes Success');
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  answerQuiz: async (req, res) => {
    try {
      const { answer } = await req.body;

      if (!answer) {
        return responseHelper(res, 400, null, 'Please give an answer!');
      }

      const question = await redis.get('questionSent');
      const sentAt = await redis.get('sentAt');

      const { id, type, correctOption } = JSON.parse(question);

      // Tambahin Id dari question ke AnsweredQuiz di database user
      await user.update({
        answeredQuiz: [...user.answeredQuiz, id],
      });

      // Cek jawaban dari user
      if (answer === correctOption) {
        // DAPETIN SCORENYA, SELESAIN FUNCTION CALCULATE SCORE.
      }

      redis.del('questionSent');
      redis.set('isAnswered', true);
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },
};

export default quizController;
