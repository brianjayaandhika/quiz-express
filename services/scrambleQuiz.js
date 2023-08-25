import { soalQuiz } from '../database/soal.js';
import { user } from '../database/db.js';
import { getData, setData } from '../helpers/redisHelper.js';
import { scoreToPass, bucketQuiz } from '../database/bucketQuiz.js';

export const scrambleQuiz = async (username) => {
  const selectedUser = await user.findByPk(username);
  const lastNumberOfPhone = Number(selectedUser.phone[selectedUser.phone.length - 1]);

  const sentAt = new Date().getTime();
  await setData(`${selectedUser.username}-sentAt`, sentAt);

  let currentRound = await getData(`${selectedUser.username}-currentRound`);
  let columnBucketQuiz = await getData(`${selectedUser.username}-columnBucketQuiz`);
  let rowBucketQuiz = await getData(`${selectedUser.username}-rowBucketQuiz`);

  const isInitialRound = !currentRound && !columnBucketQuiz && !rowBucketQuiz;

  if (isInitialRound) {
    currentRound = 1;
    columnBucketQuiz = 1;
    rowBucketQuiz = lastNumberOfPhone;

    await Promise.all([
      setData(`${selectedUser.username}-currentRound`, currentRound),
      setData(`${selectedUser.username}-rowBucketQuiz`, rowBucketQuiz),
      setData(`${selectedUser.username}-columnBucketQuiz`, columnBucketQuiz),
      setData(`${selectedUser.username}-totalQuestionDone`, 0),
    ]);
  } else {
    if (columnBucketQuiz % 5 === 0) {
      const currentScoreToPass = currentRound - 1;

      if (selectedUser.progress.scoreOfCurrentRound < scoreToPass[currentScoreToPass]) {
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

      currentRound++;
      rowBucketQuiz++;

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

      if (rowBucketQuiz > 9) {
        rowBucketQuiz = 0;
      }

      await Promise.all([
        setData(`${selectedUser.username}-currentRound`, currentRound),
        setData(`${selectedUser.username}-rowBucketQuiz`, rowBucketQuiz),
        setData(`${selectedUser.username}-columnBucketQuiz`, 1),
      ]);
    } else {
      columnBucketQuiz++;
      await setData(`${selectedUser.username}-columnBucketQuiz`, columnBucketQuiz);
    }
  }

  const questionIndex = bucketQuiz[rowBucketQuiz][columnBucketQuiz - 1] - 1;
  const { type, soal, answer, correctOption } = soalQuiz.soal[questionIndex];

  const result = {
    type,
    soal,
    answer,
    correctOption,
    timeSentAt: sentAt,
  };

  return result;
};
