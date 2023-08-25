import { user } from '../database/db.js';
import responseHelper from '../helpers/responseHelper.js';
import { generateAuthToken } from '../services/generateToken.js';
import { deleteData, setData } from '../helpers/redisHelper.js';

const userController = {
  registerUser: async (req, res) => {
    try {
      const { username, password, phone } = req.body;

      const phonePattern = /^(?:\+\d{1,3})?\d{8,}$/;

      if (!phone.match(phonePattern)) {
        return responseHelper(res, 400, null, 'Invalid Phone Number');
      }

      if (!username || !password || !phone) {
        return responseHelper(res, 400, null, 'Register Failed!');
      }

      const existingUser = await user.findOne({ where: { username } });

      if (existingUser) {
        return responseHelper(res, 400, null, 'Username already exists!');
      }

      const newUser = await user.create(req.body);

      return responseHelper(res, 200, newUser, 'Register Success, Please check your email for verification!');
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  loginUser: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (username && password) {
        const loggedInUser = await user.findOne({ where: { username, password } });

        if (loggedInUser) {
          const token = generateAuthToken(username);
          await setData(`${username}-token`, [username, token], 3600);

          const loginSession = { username, token };
          return responseHelper(res, 200, loginSession, 'Login is successful');
        }
        return responseHelper(res, 400, null, 'Login Failed!');
      }

      return responseHelper(res, 400, null, 'Need username and password to login!');
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  logoutUser: async (req, res) => {
    try {
      const { username } = req.params;
      await deleteData(`${username}-token`);
      return responseHelper(res, 200, null, 'Logout Success!');
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  getProfile: async (req, res) => {
    try {
      const selectedUser = await user.findByPk(req.params.username);

      if (selectedUser) {
        const { username, phone, totalScore, progress } = selectedUser;
        const progressInfo = Object.keys(progress).length < 1 ? 'No progress has been made' : progress;

        const data = { username, phone, totalScore, progress: progressInfo };
        return responseHelper(res, 200, data, 'Get user detail success');
      } else {
        return responseHelper(res, 404, null, 'User not found');
      }
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  getLeaderboard: async (req, res) => {
    try {
      const allUser = await user.findAll({
        attributes: ['username', 'totalScore'],
        order: [['totalScore', 'DESC']],
      });

      return responseHelper(res, 200, allUser, 'Get leaderboard success');
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  resetUser: async (req, res) => {
    try {
      const selectedUser = await user.findByPk(req.params.username);

      if (!selectedUser) {
        return responseHelper(res, 404, null, 'User not found');
      }

      await selectedUser.update({
        progress: {
          status: 'On Going',
          totalQuestionDone: 0,
          currentRound: 1,
          scoreOfCurrentRound: 0,
        },
        totalScore: 0,
      });

      const cacheKeys = [
        'questionSent',
        'rowBucketQuiz',
        'sentAt',
        'columnBucketQuiz',
        'currentRound',
        'totalQuestionDone',
      ];

      await Promise.all(
        cacheKeys.map(async (item) => {
          await deleteData(`${selectedUser.username}-${item}`);
        })
      );

      return responseHelper(res, 200, null, 'Reset user success');
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },
};

export default userController;
