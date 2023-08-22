import express from 'express';
import userController from '../controllers/userController.js';
import verifyController from '../controllers/verifyController.js';
import jwtController from '../controllers/verifyController.js';

const userRouter = express.Router();

// verifyController.verifyToken

userRouter.post('/register', userController.registerUser);
userRouter.post('/login', userController.loginUser);
userRouter.get('/view/:username', userController.getProfile);
userRouter.get('/all-user', userController.getAllUser);

export default userRouter;
