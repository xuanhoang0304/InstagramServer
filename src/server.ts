import server from './app';
import initMongoDb from './config/database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await initMongoDb(); // Kết nối MongoDB

  server.listen(PORT, () => {
    logger.info(`🚀 Server listening on port : ${PORT}`);
  });
};

startServer();
