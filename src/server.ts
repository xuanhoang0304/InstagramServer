import app from './app';
import initMongoDb from './config/database';
import ConfignEnv from './config/env';
import { logger } from './utils/logger';

const PORT = ConfignEnv.port;

const startServer = async () => {
  await initMongoDb(); // Kết nối MongoDB

  app.listen(PORT, () => {
    logger.info(`🚀 Server listening on port : ${PORT}`);
  });
};

startServer();
