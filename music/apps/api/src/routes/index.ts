const { Router } = require('express');
import { artistsRouter } from './artists';
const apiRouter = Router();

apiRouter.use('/artists', artistsRouter);

module.exports = {
  apiRouter,
};
