import express from 'express';
import mongoose from 'mongoose';
import auth from './controllers/auth';
import anime from './controllers/anime';
import cors from 'cors';
import bp from 'body-parser';

const app = express();

app.use(cors());
app.use(bp.json());

mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/coroname', {
  useNewUrlParser: true, useUnifiedTopology: true
});

app.get('/', (req, res) => {
  res.redirect('https://coroname.net');
});

app.use('/auth', auth);
app.use('/anime', anime);

app.listen(process.env.PORT || 3000, () => console.log("Listening!"));
