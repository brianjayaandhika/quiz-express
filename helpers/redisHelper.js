import Redis from 'ioredis';

const projectName = process.env.PROJECT_NAME || 'brian-quiz';
const redisSocket = process.env.REDIS_SOCKET || '/home/phinconc/redis.sock';
const redisConfig = process.env.NODE_ENV === 'production' ? redisSocket : '';

const redis = new Redis(redisConfig);

redis.on('error', (err) => {
  console.log(err);
  redis.disconnect();
});

export const getData = async (key) => {
  const keyRedis = `${projectName}-${key}`;
  const data = await redis.get(keyRedis);
  return JSON.parse(data);
};

export const setData = async (key, data, expire) => {
  const keyRedis = `${projectName}-${key}`;
  if (expire) {
    return redis.set(keyRedis, JSON.stringify(data), 'EX', expire);
  } else {
    return redis.set(keyRedis, JSON.stringify(data));
  }
};

export const deleteData = async (key) => {
  const keyRedis = `${projectName}-${key}`;
  return redis.del(keyRedis);
};

export const flushData = async () => {
  return redis.flushdb();
};
