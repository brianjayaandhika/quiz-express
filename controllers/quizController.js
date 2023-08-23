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

      // Ngecek, kalo misalnya udah ada pertanyaan sebelomnya maka jangan kasih pertanyaan baru
      const isAnswered = await getData(`${selectedUser.username}-isAnswered`);

      if (isAnswered === null) {
        await setData(`${selectedUser.username}-isAnswered`, true);
      } else {
        if (!Boolean(isAnswered)) {
          const existingQuestion = await getData(`${selectedUser.username}-questionSent`);

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
      }

      // Panggil fungsi buat nerima pertanyaan
      const quizzes = await scrambleQuiz(req.params.username);

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
      let scoreResult;

      // Handle kalau user tidak ada
      if (!selectedUser) {
        return responseHelper(res, 400, null, 'User not found!');
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

      // handle kalau tidak ada jawaban di body
      if (!answer) {
        return responseHelper(res, 400, null, 'Please give an answer!');
      }

      // hande untuk menyimpan pertanyaan di redis
      const question = await getData(`${selectedUser.username}-questionSent`);
      // untuk mendapatkan waktu pada saat menjawab pertanyaan
      const answeredAt = new Date();

      // kalo gaada pertanyaan, kasih eror
      if (question === null) {
        return responseHelper(res, 404, null, 'No question available');
      }

      // ambil id, dadn juga jawaban yang bener
      const { id, correctOption } = question;

      // cek kebenaran jawaban
      if (answer == correctOption) {
        scoreResult = await calculateScore(answeredAt, true, selectedUser);
      } else {
        scoreResult = await calculateScore(answeredAt, false, selectedUser);
      }

      // menghitung total yang sudah dijawab
      let totalQuestion = parseInt(await getData(`${selectedUser.username}-totalQuestionDone`));

      if (totalQuestion === null) {
        setData(`${selectedUser.username}-totalQuestionDone`, 0);
      } else {
        totalQuestion++;
        setData(`${selectedUser.username}-totalQuestionDone`, totalQuestion);
      }

      // menghapus data pertanyaan yang sudah dijawab

      deleteData(`${selectedUser.username}-questionSent`);
      deleteData(`${selectedUser.username}-sentAt`);
      setData(`${selectedUser.username}-isAnswered`, true);

      // mengupdate progress dan score dari user
      selectedUser.update({
        progress: {
          questionAnswered: totalQuestion,
          status: `${totalQuestion === 150 ? 'Finished' : 'On Going'}`,
        },
        score: selectedUser.score + scoreResult,
      });

      return responseHelper(res, 200, `${answer == correctOption ? 'Correct answer' : 'Incorrect answer'}`);
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },
};

export default quizController;
