import { soalQuiz } from '../database/soal.js';
import Redis from 'ioredis';

const redis = new Redis();

export const scrambleQuiz = () => {
  const sentAt = new Date();
  const randomNumber = Math.ceil(Math.random() * 149);

  const result = soalQuiz.soal[randomNumber + 1];

  redis.set('sentAt', sentAt); // key utk sentAt
  redis.set('isAnswered', false); // key utk cek apakah sudah dijawab atau belum
  redis.set('questionSent', JSON.stringify(result));

  return result;
};
