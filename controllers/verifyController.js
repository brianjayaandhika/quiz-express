import jwt from 'jsonwebtoken';
import responseHelper from '../helpers/responseHelper.js';
import { getData } from '../helpers/redisHelper.js';

const jwtController = {
  verifyToken: async (req, res, next) => {
    try {
      if (!req?.headers?.['access-token']) {
        return responseHelper(res, 403, null, 'No token provided');
      }

      let tokenHeader = req.headers['access-token'];

      let token = tokenHeader.split(' ')[1];

      if (tokenHeader.split(' ')[0] !== 'Bearer') {
        return responseHelper(res, 400, null, 'Incorrect token format');
      }

      jwt.verify(token, 'secret', async (err, decoded) => {
        if (err) {
          return responseHelper(res, 403, null, 'Forbidden');
        }

        const tokenPerUser = await getData(`${decoded?.username}-token`);

        if (!tokenPerUser) {
          return responseHelper(res, 403, null, 'No login token detected');
        }

        if (`Bearer ${token}` === tokenPerUser[1] && req.params.username === tokenPerUser[0]) {
          next();
          return -1;
        }

        return responseHelper(res, 403, null, 'Authorization failed');
      });
    } catch (error) {
      console.log(error);
      return responseHelper(res, 500, null, 'Internal Server Error');
    }
  },
};
export default jwtController;
