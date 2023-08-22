import { user } from '../database/db.js';
import responseHelper from '../helpers/responseHelper.js';
import { generateAuthToken } from '../services/generateToken.js';

const userController = {
  registerUser: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        responseHelper(res, 400, null, 'Register Failed!');
        return;
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
          const token = generateAuthToken(username, checkLogin[0].role);

          const loginSession = {
            username,
            role: checkLogin[0].role,
            token,
          };

          return responseHelper(res, 200, loginSession, 'Login is successful');
        }
        return responseHelper(res, 400, null, 'Login Failed!');
      }

      responseHelper(res, 400, null, 'Need username and password to login!');
    } catch (error) {
      console.log(error);
      responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  getProfile: async (req, res) => {
    try {
      const selectedUser = await user.findByPk(req.params.username);
      const { username, score, answeredQuiz } = await selectedUser;

      if (selectedUser) {
        const data = {
          username,
          score,
          answeredQuiz: answeredQuiz.length < 1 ? 'No Answered Quiz' : selectedUser.answeredQuiz,
        };

        responseHelper(res, 200, data, 'Get Profile Success');
      } else {
        responseHelper(res, 404, null, 'User not found');
      }
    } catch (error) {
      responseHelper(res, 500, null, 'Internal Server Error');
    }
  },

  getAllUser: async (req, res) => {
    try {
      const allUser = await user.findAll({
        attributes: ['username', 'role', 'email', 'verified'],
      });
      responseHelper(res, 200, allUser, 'Get All User Success');
    } catch (error) {
      responseHelper(res, 500, null, 'Internal Server Error');
    }
  },
};

export default userController;
