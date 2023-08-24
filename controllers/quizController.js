import responseHelper from '../helpers/responseHelper.js';
import { scrambleQuiz } from '../services/scrambleQuiz.js';
import { user } from '../database/db.js';
import { calculateScore } from '../services/calculateScore.js';
import { getData, setData, deleteData } from '../helpers/redisHelper.js';

const quizController = {
  getQuiz: async (req, res) => {
    try {
      const selectedUser = await user.findByPk(req.params.username);

      // Kalo udah faile gabisa, harus try again
      if (selectedUser.progress.status === 'Failed') {
        return responseHelper(
          res,
          403,
          null,
          'You have failed the quiz! Please hit the try again button to retry the quiz.'
        );
      }

      // Kalo udah finished juga gabisa.
      if (selectedUser.progress.status === 'Finished') {
        return responseHelper(res, 403, null, 'You have completed the quiz!');
      }

      // Ngecek, kalo misalnya udah ada pertanyaan sebelomnya maka jangan kasih pertanyaan baru
      const existingQuestion = await getData(`${selectedUser.username}-questionSent`);

      // Kondisi untuk apabila pertanyaan sudah dijawab / belum
      if (existingQuestion !== null) {
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

      // Panggil fungsi buat nerima pertanyaan
      const quizzes = await scrambleQuiz(req.params.username);

      if (quizzes === 'failed') {
        return responseHelper(res, 201, null, 'You have failed the quiz, please try again!');
      }

      if (quizzes === 'finished') {
        return responseHelper(res, 201, null, 'You have completed the quiz!');
      }

      // data yang akan ditampilkan
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
      // Cek user dan jawaban yang diberikan
      const selectedUser = await user.findByPk(req.params.username);
      const { answer } = await req.body;
      // hande untuk menyimpan pertanyaan di redis
      const question = await getData(`${selectedUser.username}-questionSent`);
      // untuk mendapatkan waktu pada saat menjawab pertanyaan
      const answeredAt = new Date();
      let scoreResult = 0;
      let currentRoundScore = parseInt(selectedUser.progress.scoreOfCurrentRound) || 0;

      // Handle kalau user tidak ada
      if (!selectedUser) {
        return responseHelper(res, 400, null, 'User not found!');
      }

      // handle kalau tidak ada jawaban di body
      if (!answer) {
        return responseHelper(res, 400, null, 'Please give an answer!');
      }

      // kalo gaada pertanyaan, kasih eror
      if (!question) {
        return responseHelper(res, 404, null, 'No question available');
      }

      // handle kalau status sudah gagal
      if (selectedUser.progress.status === 'Failed') {
        return responseHelper(
          res,
          403,
          null,
          'You have failed the quiz! Please hit the try again button to retry the quiz.'
        );
      }

      // ambil id, dadn juga jawaban yang bener
      const { correctOption } = question;

      // cek kebenaran jawaban
      if (answer.toLowerCase() == correctOption.toLowerCase()) {
        scoreResult = await calculateScore(answeredAt, true, selectedUser);
      } else {
        scoreResult = await calculateScore(answeredAt, false, selectedUser);
      }

      // menghitung total yang sudah dijawab
      let totalQuestionDone = parseInt(await getData(`${selectedUser.username}-totalQuestionDone`));

      totalQuestionDone++;
      await setData(`${selectedUser.username}-totalQuestionDone`, totalQuestionDone);

      // menghapus data pertanyaan yang sudah dijawab
      await deleteData(`${selectedUser.username}-questionSent`);
      await deleteData(`${selectedUser.username}-sentAt`);

      // mengupdate progress dan score dari user

      currentRoundScore += scoreResult;

      await selectedUser.update({
        progress: {
          status: `${totalQuestionDone === 150 ? 'Finished' : 'On Going'}`,
          totalQuestionDone,
          currentRound: await getData(`${selectedUser.username}-currentRound`),
          scoreOfCurrentRound: currentRoundScore,
        },
        totalScore: selectedUser.totalScore + scoreResult,
      });

      return responseHelper(
        res,
        200,
        null,
        `${
          answer.toLowerCase() == correctOption.toLowerCase() ? 'Correct answer' : 'Incorrect answer'
        }, your score is now ${selectedUser.progress.scoreOfCurrentRound}`
      );
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },
};

export default quizController;
