import { user } from '../database/db.js';
import responseHelper from '../helpers/responseHelper.js';
import { generateAuthToken } from '../services/generateToken.js';
import { deleteData, setData } from '../helpers/redisHelper.js';

const userController = {
  registerUser: async (req, res) => {
    try {
      const { username, password, phone } = req.body;

      if (!username || !password || !phone) {
        return responseHelper(res, 400, null, 'Register Failed!');
      }

      const duplicateUsername = await user.findAll({
        where: {
          username,
        },
      });

      if (duplicateUsername.length > 0) {
        return responseHelper(res, 400, null, 'Username already exists!');
      }

      const newUser = await user.create(req.body);

      return responseHelper(res, 200, newUser, 'Register Success, Please check your email for verification!');
    } catch (error) {
      console.log(error);
      responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  loginUser: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (username && password) {
        const checkLogin = await user.findAll({
          where: {
            username,
            password,
          },
        });

        if (checkLogin.length > 0) {
          const token = generateAuthToken(username);

          await setData(`${username}-token`, [username, token], 3600);

          const loginSession = {
            username,
            token,
          };

          return responseHelper(res, 200, loginSession, 'Login is successful');
        }
        return responseHelper(res, 400, null, 'Login Failed!');
      }

      return responseHelper(res, 400, null, 'Need username and password to login!');
    } catch (error) {
      console.log(error);
      responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  logoutUser: async (req, res) => {
    try {
      await deleteData(`${req.params.username}-token`);
      return responseHelper(res, 200, null, 'Logout Success!');
    } catch (error) {
      console.log(error);
      responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  getProfile: async (req, res) => {
    try {
      const selectedUser = await user.findByPk(req.params.username);
      const { username, phone, totalScore, progress } = await selectedUser;

      if (selectedUser) {
        const data = {
          username,
          phone,
          totalScore,
          progress: Object.keys(progress).length < 1 ? 'No progress has been made' : selectedUser.progress,
        };

        responseHelper(res, 200, data, 'Get user detail success');
      } else {
        responseHelper(res, 404, null, 'User not found');
      }
    } catch (error) {
      console.log(error);
      responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  getLeaderboard: async (req, res) => {
    try {
      const allUser = await user.findAll({
        attributes: ['username', 'totalScore'],
      });

      const sortByScore = allUser.sort((a, b) => b.totalScore - a.totalScore);
      responseHelper(res, 200, sortByScore, 'Get leaderboard success');
    } catch (error) {
      console.log(error);
      responseHelper(res, 500, null, 'Internal Server Error');
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

      const arrayOfCache = [
        'questionSent',
        'rowBucketQuiz',
        'sentAt',
        'columnBucketQuiz',
        'currentRound',
        'totalQuestionDone',
      ];

      arrayOfCache.map(async (item) => {
        await deleteData(`${selectedUser.username}-${item}`);
      });

      return responseHelper(res, 200, null, 'Reset user success');
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },
};

export default userController;
