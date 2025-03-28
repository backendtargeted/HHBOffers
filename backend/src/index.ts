import express from 'express';
import logger from './logger';

const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
