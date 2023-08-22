import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import db from './database/db.js';
import quizRouter from './routes/quizRouter.js';
import userRouter from './routes/userRouter.js';
import responseHelpers from './helpers/responseHelper.js';
import documentation from './documentation/documentation.js';

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

db.sync()
  .then(() => {
    console.log('Database Connected!');
  })
  .catch((error) => {
    console.log(error);
    console.log('Failed to connect!');
  });

app.use('/quiz', quizRouter);
app.use('/user', userRouter);
app.use('/', documentation);
// check emails in https://mailtrap.io/inboxes/2376809/messages/3658600755

app.use(express.static('temp/uploads'));

app.all('*', (req, res) => {
  responseHelpers(res, 404, null, 'API not found');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
