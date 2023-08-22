import jwtController from '../../controllers/verifyController.js';
import jwt from 'jsonwebtoken';
import responseHelper from '../../helpers/responseHelper.js';
import { user } from '../../database/db';
import { jest } from '@jest/globals';

jest.mock('jsonwebtoken');
jest.mock('../../helpers/responseHelper.js');
jest.mock('../../database/db');

describe('jwtController', () => {
  const mockReq = {
    headers: {},
    params: {},
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('should verify token successfully', () => {
      const mockDecodedToken = {
        role: 'admin',
      };

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockDecodedToken);
      });

      mockReq.headers['access-token'] = 'Bearer token123';

      jwtController.verifyToken(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('token123', 'secret', expect.any(Function));
      expect(mockReq.userRole).toBe('admin');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token not provided', () => {
      jwtController.verifyToken(mockReq, mockRes, mockNext);

      expect(responseHelper).toHaveBeenCalledWith(mockRes, 404, null, 'Token not provided');
    });

    it('should handle incorrect token format', () => {
      mockReq.headers['access-token'] = 'incorrect-token-format token123';

      jwtController.verifyToken(mockReq, mockRes, mockNext);

      expect(responseHelper).toHaveBeenCalledWith(mockRes, 400, null, 'Incorrect token format');
    });

    it('should handle token verification error', () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Verification Error'));
      });

      mockReq.headers['access-token'] = 'Bearer token123';

      jwtController.verifyToken(mockReq, mockRes, mockNext);

      expect(responseHelper).toHaveBeenCalledWith(mockRes, 403, null, 'Forbidden');
    });
  });

  describe('verifyAdmin', () => {
    it('should allow admin access', () => {
      mockReq.userRole = 'admin';

      jwtController.verifyAdmin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle non-admin access', () => {
      mockReq.userRole = 'user';

      jwtController.verifyAdmin(mockReq, mockRes, mockNext);

      expect(responseHelper).toHaveBeenCalledWith(mockRes, 403, null, 'Forbidden');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const selectedUserMock = {
        verified: false,
        update: jest.fn(),
      };

      user.findByPk.mockResolvedValue(selectedUserMock);

      mockReq.params.username = 'testuser';

      await jwtController.verifyEmail(mockReq, mockRes);

      expect(user.findByPk).toHaveBeenCalledWith('testuser');
      expect(selectedUserMock.update).toHaveBeenCalledWith({ verified: true });
      expect(responseHelper).toHaveBeenCalledWith(mockRes, 200, null, 'Email Has Been Verified');
    });

    it('should handle already verified email', async () => {
      const selectedUserMock = {
        verified: true,
      };

      user.findByPk.mockResolvedValue(selectedUserMock);

      mockReq.params.username = 'testuser';

      await jwtController.verifyEmail(mockReq, mockRes);

      expect(responseHelper).toHaveBeenCalledWith(mockRes, 400, null, 'Email is already verified');
    });

    // Add more test cases for other scenarios
  });

  describe('verifyForgotPassword', () => {
    it('should verify forgot password successfully', async () => {
      const selectedUserMock = {
        update: jest.fn(),
      };

      user.findByPk.mockResolvedValue(selectedUserMock);

      mockReq.params.username = 'testuser';
      mockReq.params.encryptedOtp = 123456;

      await jwtController.verifyForgotPassword(mockReq, mockRes);

      expect(user.findByPk).toHaveBeenCalledWith('testuser');
      expect(selectedUserMock.update).toHaveBeenCalledWith({ password: 421.8656392006481 }); // Decrypted value
      expect(responseHelper).toHaveBeenCalledWith(
        mockRes,
        200,
        null,
        'Your password has been changed, check your email for the new password!'
      );
    });

    // Add more test cases for other scenarios
  });
});
