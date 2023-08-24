import Redis from 'ioredis';
import { user } from '../database/db.js';

const redis = new Redis();

export const calculateScore = async (time, isCorrect, userParam) => {
  const selectedUser = await user.findByPk(userParam.username);

  // To calculate time
  const questionSentAt = await redis.get(`${selectedUser.username}-sentAt`);
  const timeAnsweringQuestion = new Date(time).getTime() - questionSentAt;
  const timeDiff = Math.ceil(timeAnsweringQuestion / 1000);

  // To get score
  let score;

  if (!isCorrect) {
    score = -5;
  } else {
    switch (true) {
      case timeDiff <= 10:
        score = 10;
        break;
      case timeDiff <= 20:
        score = 9;
        break;
      case timeDiff <= 30:
        score = 8;
        break;
      case timeDiff <= 40:
        score = 7;
        break;
      case timeDiff <= 50:
        score = 6;
        break;
      case timeDiff <= 60:
        score = 0;
        break;
      case timeDiff >= 60:
        score = 0;
        break;
      default:
        console.log('Something went wrong!!');
    }
  }

  return score;
};
