import express from 'express';

const app = express();

const { apiRouter } = require('./routes');

app.use('/api', apiRouter);

// Respond with Hello World! on the homepage:
app.get('/', (req, res) => res.send('Hello World!'));

const port = process.env.PORT || 8888;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
