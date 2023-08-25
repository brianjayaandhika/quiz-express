import Redis from 'ioredis';
import { user } from '../database/db.js';

const redis = new Redis();

export const calculateScore = async (time, isCorrect, userParam) => {
  try {
    const selectedUser = await user.findByPk(userParam.username);

    // Calculate time difference
    const questionSentAt = parseInt(await redis.get(`${selectedUser.username}-sentAt`));
    const timeAnsweringQuestion = new Date(time).getTime() - questionSentAt;
    const timeDiffInSeconds = Math.floor(timeAnsweringQuestion / 1000);

    // Define scoring criteria
    const scoringCriteria = [
      { time: 10, score: 10 },
      { time: 20, score: 9 },
      { time: 30, score: 8 },
      { time: 40, score: 7 },
      { time: 50, score: 6 },
      { time: 60, score: 5 },
    ];

    // Calculate score based on time and correctness
    let score = 0;
    if (isCorrect) {
      for (const criteria of scoringCriteria) {
        if (timeDiffInSeconds <= criteria.time) {
          score = criteria.score;
          break;
        }
      }
    } else {
      score = -5;
    }

    return score;
  } catch (error) {
    console.log(error);
    throw new Error('Error calculating score');
  }
};
