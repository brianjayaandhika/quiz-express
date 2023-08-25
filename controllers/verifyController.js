import jwt from 'jsonwebtoken';
import responseHelper from '../helpers/responseHelper.js';
import { getData } from '../helpers/redisHelper.js';

const jwtController = {
  verifyToken: async (req, res, next) => {
    try {
      const tokenHeader = req.headers['access-token'];

      if (!tokenHeader) {
        return responseHelper(res, 403, null, 'No token provided');
      }

      const tokenParts = tokenHeader.split(' ');

      if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return responseHelper(res, 400, null, 'Incorrect token format');
      }

      const token = tokenParts[1];

      jwt.verify(token, 'secret', async (err, decoded) => {
        if (err) {
          return responseHelper(res, 403, null, 'Forbidden');
        }

        const tokenPerUser = await getData(`${decoded?.username}-token`);

        if (!tokenPerUser) {
          return responseHelper(res, 403, null, 'No login token detected');
        }

        const [storedUsername, storedToken] = tokenPerUser;

        if (`Bearer ${token}` === storedToken && req.params.username === storedUsername) {
          next();
        } else {
          return responseHelper(res, 403, null, 'Authorization failed');
        }
      });
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },
};

export default jwtController;
