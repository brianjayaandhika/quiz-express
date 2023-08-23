import { soalQuiz } from '../database/soal.js';
import { user } from '../database/db.js';
import Redis from 'ioredis';

const redis = new Redis();

const bucketQuiz = [
  [1, 20, 21, 40, 41, 60, 61, 80, 81, 100, 101, 120, 121, 140, 141],
  [2, 19, 22, 39, 42, 59, 62, 79, 82, 99, 102, 119, 122, 139, 142],
  [3, 18, 23, 38, 43, 58, 63, 78, 83, 98, 103, 118, 123, 138, 143],
  [4, 17, 24, 37, 44, 57, 64, 77, 84, 97, 104, 117, 124, 137, 144],
  [5, 16, 25, 36, 45, 56, 65, 76, 85, 96, 105, 116, 125, 136, 145],
  [6, 15, 26, 35, 46, 55, 66, 75, 86, 95, 106, 115, 126, 135, 146],
  [7, 14, 27, 34, 47, 54, 67, 74, 87, 94, 107, 114, 127, 134, 147],
  [8, 13, 28, 33, 48, 53, 68, 73, 88, 93, 108, 113, 128, 133, 148],
  [9, 12, 29, 32, 49, 52, 69, 72, 89, 92, 109, 112, 129, 132, 149],
  [10, 11, 30, 31, 50, 51, 70, 71, 90, 91, 110, 111, 130, 131, 150],
];

const scoreToPass = [105, 110, 115, 120, 125, 130, 135, 140, 145, 150];
// Refactored function to scramble the quiz
export const scrambleQuiz = async (username) => {
  // Ambil user dan nomor terakhir dari nomor telfon user
  const selectedUser = await user.findByPk(username);
  const lastNumberOfPhone = selectedUser.phone[selectedUser.phone.length - 1];

  // Ambil waktu saat function dipanggil
  const sentAt = new Date().getTime();
  redis.set(`${selectedUser.username}-sentAt`, sentAt);

  // Menentukan nomor berapa yang dikirimkan

  // Ronde sekarang
  let currentRound = await redis.get(`${selectedUser.username}-currentRound`);
  // Pertanyaan pada ronde tertentu
  let specificQuestion = await redis.get(`${selectedUser.username}-columnBucketQuiz`);

  if (currentRound === null || specificQuestion === null) {
    currentRound = 1;
    specificQuestion = 0;
    // ronde keberapa
    await redis.set(`${selectedUser.username}-currentRound`, currentRound);
    // kolom keberapa (untuk pertanyaan)
    await redis.set(`${selectedUser.username}-columnBucketQuiz`, 0);
    // ngitung berapa jumlah pertanyaan yang udah dijawab
    await redis.set(`${selectedUser.username}-totalQuestionDone`, 0);
  } else {
    const totalQuestionsAnswered = selectedUser.progress.questionAnswered;

    if (totalQuestionsAnswered % 15 === 0) {
      // const currentScoreToPass = currentRound - 1;
      // if (selectedUser.score < scoreToPass[currentScoreToPass]) {
      //   // Reset progress and return failure response
      //   await redis.del(`${selectedUser.username}-columnBucketQuiz`);
      //   await redis.del(`${selectedUser.username}-totalQuestionDone`);
      //   await redis.del(`${selectedUser.username}-currentRound`);
      //   await redis.del(`${selectedUser.username}-isAnswered`);
      //   await redis.del(`${selectedUser.username}-sentAt`);

      //   await selectedUser.update({
      //     progress: {
      //       status: 'Failed',
      //     },
      //   });

      //   return -1;
      // }

      currentRound++;
      await redis.set(`${selectedUser.username}-currentRound`, currentRound);
      await redis.set(`${selectedUser.username}-columnBucketQuiz`, 0);
    } else {
      specificQuestion = specificQuestion;
      specificQuestion++;
      await redis.set(`${selectedUser.username}-columnBucketQuiz`, specificQuestion);
    }
  }

  const bucketQuizRow = lastNumberOfPhone - 1;
  const questionIndex = bucketQuiz[bucketQuizRow][Number(specificQuestion)];

  // Buat isAnswered jd belom dijawab!
  redis.set(`${selectedUser.username}-isAnswered`, false); // key utk cek apakah sudah dijawab atau belum

  // Data yang akan dikirim
  const result = {
    soal: soalQuiz.soal[questionIndex],
    timeSentAt: sentAt,
  };

  return result;
};
