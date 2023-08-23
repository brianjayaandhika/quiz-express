import Redis from 'ioredis';

const redis = new Redis();

export const getData = async (key) => {
  const data = await redis.get(key);
  return JSON.parse(data);
};

export const setData = async (key, data) => {
  return redis.set(key, JSON.stringify(data));
};

export const deleteData = async (key) => {
  return redis.del(key);
};
