import responseHelper from '../helpers/responseHelper.js';
import { scrambleQuiz } from '../services/scrambleQuiz.js';
import { user } from '../database/db.js';
import { calculateScore } from '../services/calculateScore.js';
import { getData, setData, deleteData } from '../helpers/redisHelper.js';

const quizController = {
  getQuiz: async (req, res) => {
    try {
      const selectedUser = await user.findByPk(req.params.username);

      const progressStatus = selectedUser.progress.status;

      if (progressStatus === 'Failed') {
        return responseHelper(
          res,
          403,
          null,
          'You have failed the quiz! Please hit the try again button to retry the quiz.'
        );
      }

      if (progressStatus === 'Finished') {
        return responseHelper(res, 403, null, 'You have completed the quiz!');
      }

      const existingQuestion = await getData(`${selectedUser.username}-questionSent`);

      if (existingQuestion) {
        const catchDataToSend = {
          soal: existingQuestion.soal,
          pilihan: existingQuestion.answer,
        };

        return res.status(400).json({
          status: 'Error',
          statusCode: 400,
          message: 'Please answer the current question first!',
          data: catchDataToSend,
        });
      }

      const quizzes = await scrambleQuiz(req.params.username);

      if (quizzes === 'failed') {
        return responseHelper(res, 201, null, 'You have failed the quiz, please try again!');
      }

      if (quizzes === 'finished') {
        return responseHelper(res, 201, null, 'You have completed the quiz!');
      }

      await setData(`${selectedUser.username}-questionSent`, quizzes);

      const data = {
        id: quizzes.id,
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
      const selectedUser = await user.findByPk(req.params.username);
      const { answer } = req.body;
      const lowerCasedAnswer = answer.toLowerCase();
      const question = await getData(`${selectedUser.username}-questionSent`);
      const answeredAt = new Date();

      if (!selectedUser) {
        return responseHelper(res, 400, null, 'User not found!');
      }

      if (!answer) {
        return responseHelper(res, 400, null, 'Please give an answer!');
      }

      const validOptions = ['a', 'b', 'c', 'd'];

      if (!validOptions.includes(lowerCasedAnswer)) {
        return responseHelper(res, 403, null, 'Answer invalid!');
      }

      if (!question) {
        return responseHelper(res, 404, null, 'No question available');
      }

      if (selectedUser.progress.status === 'Failed') {
        return responseHelper(
          res,
          403,
          null,
          'You have failed the quiz! Please hit the try again button to retry the quiz.'
        );
      }

      const { correctOption } = question;
      const isCorrect = lowerCasedAnswer === correctOption.toLowerCase();
      const scoreResult = await calculateScore(answeredAt, isCorrect, selectedUser);

      let totalQuestionDone = parseInt(await getData(`${selectedUser.username}-totalQuestionDone`));
      totalQuestionDone++;
      await setData(`${selectedUser.username}-totalQuestionDone`, totalQuestionDone);

      await deleteData(`${selectedUser.username}-questionSent`);
      await deleteData(`${selectedUser.username}-sentAt`);

      let currentRoundScore = parseInt(selectedUser.progress.scoreOfCurrentRound) || 0;
      currentRoundScore += scoreResult;

      const currentRound = parseInt(await getData(`${selectedUser.username}-currentRound`));
      const columnBucketQuiz = parseInt(await getData(`${selectedUser.username}-columnBucketQuiz`)) || 0;

      await selectedUser.update({
        progress: {
          status: `${totalQuestionDone === 50 ? 'Finished' : 'On Going'}`,
          totalQuestionDone,
          currentRound,
          scoreOfCurrentRound: currentRoundScore,
        },
        totalScore: selectedUser.totalScore + scoreResult,
      });

      const answerStatus = isCorrect ? 'Correct answer' : 'Incorrect answer';
      const roundInfo = `You have answered ${columnBucketQuiz} out of 5 questions in round ${currentRound}`;
      const responseMessage = `${answerStatus}, your score is now ${selectedUser.progress.scoreOfCurrentRound}. ${roundInfo}`;

      return responseHelper(res, 200, null, responseMessage);
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },
};

export default quizController;
