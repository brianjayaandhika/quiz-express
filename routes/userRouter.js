import express from 'express';
import userController from '../controllers/userController.js';
import verifyController from '../controllers/verifyController.js';
import jwtController from '../controllers/verifyController.js';

const userRouter = express.Router();

verifyController.verifyToken;

userRouter.post('/register', userController.registerUser);
userRouter.post('/login', userController.loginUser);
userRouter.post('/logout/:username', verifyController.verifyToken, userController.logoutUser);
userRouter.get('/view/:username', verifyController.verifyToken, userController.getProfile);
userRouter.get('/leaderboard', userController.getLeaderboard);
userRouter.post('/reset/:username', verifyController.verifyToken, userController.resetUser);

export default userRouter;
