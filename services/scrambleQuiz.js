import { soalQuiz } from '../database/soal.js';
import { user } from '../database/db.js';
import { getData, setData, deleteData } from '../helpers/redisHelper.js';

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
  const lastNumberOfPhone = Number(selectedUser.phone[selectedUser.phone.length - 1]);

  // Ambil waktu saat function dipanggil
  const sentAt = new Date().getTime();
  await setData(`${selectedUser.username}-sentAt`, sentAt);

  // Menentukan nomor berapa yang dikirimkan

  // Ronde sekarang
  let currentRound = await getData(`${selectedUser.username}-currentRound`);
  // Pertanyaan pada ronde tertentu
  let columnBucketQuiz = await getData(`${selectedUser.username}-columnBucketQuiz`);
  let rowBucketQuiz = await getData(`${selectedUser.username}-rowBucketQuiz`);

  if (!currentRound && !columnBucketQuiz && !rowBucketQuiz) {
    currentRound = 1;
    columnBucketQuiz = 0;
    rowBucketQuiz = lastNumberOfPhone;
    // ronde keberapa
    await setData(`${selectedUser.username}-currentRound`, currentRound);
    // baris keberapa (untuk pertanyaan)
    await setData(`${selectedUser.username}-rowBucketQuiz`, rowBucketQuiz);
    // kolom keberapa (untuk pertanyaan)
    await setData(`${selectedUser.username}-columnBucketQuiz`, columnBucketQuiz);
    // ngitung berapa jumlah pertanyaan yang udah dijawab
    await setData(`${selectedUser.username}-totalQuestionDone`, 0);
  } else {
    if (columnBucketQuiz % 14 === 0 && columnBucketQuiz > 1) {
      const currentScoreToPass = currentRound - 1;

      currentRound++;
      rowBucketQuiz++;
      columnBucketQuiz = 0;

      await selectedUser.update({
        progress: {
          status: 'On Going',
          totalQuestionDone: await getData(`${selectedUser.username}-totalQuestionDone`),
          currentRound: await getData(`${selectedUser.username}-currentRound`),
          scoreOfCurrentRound: 0,
        },
      });

      if (currentRound > 10) {
        await selectedUser.update({
          progress: {
            status: 'Finished',
            totalQuestionDone,
            currentRound,
            scoreOfCurrentRound,
          },
        });

        return 'finished';
      }

      if (selectedUser.progress.scoreOfCurrentRound < scoreToPass[currentScoreToPass]) {
        // Reset progress and return failure response
        await selectedUser.update({
          progress: {
            status: 'Failed',
            totalQuestionDone: await getData(`${selectedUser.username}-totalQuestionDone`),
            currentRound,
            scoreOfCurrentRound: selectedUser.progress.scoreOfCurrentRound,
          },
        });

        return 'failed';
      }

      if (rowBucketQuiz > 9) {
        rowBucketQuiz = 0;
      }

      await setData(`${selectedUser.username}-currentRound`, currentRound);
      await setData(`${selectedUser.username}-rowBucketQuiz`, rowBucketQuiz);
      await deleteData(`${selectedUser.username}-columnBucketQuiz`, columnBucketQuiz);
    } else {
      columnBucketQuiz++;
      await setData(`${selectedUser.username}-columnBucketQuiz`, columnBucketQuiz);
    }
  }

  // Buat isAnswered jd belom dijawab!

  let questionIndex = bucketQuiz[rowBucketQuiz][columnBucketQuiz] - 1;

  const { type, soal, answer, correctOption } = soalQuiz.soal[questionIndex];

  // Data yang akan dikirim
  const result = {
    type,
    soal,
    answer,
    correctOption,
    timeSentAt: sentAt,
  };

  return result;
};
