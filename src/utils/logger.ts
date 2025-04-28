import { Logger, createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

class LocalLogger {
  private static instance: LocalLogger;
  private logger: Logger;

  private constructor() {
    const consoleFormat = format.printf(
      ({ service, level, message, timestamp, data }) =>
        `[${timestamp}][${level}][${service}] ${JSON.stringify({ message, data }, null)}`,
    );

    const transport = new transports.DailyRotateFile({
      filename: `[NodeJS Course Service]-%DATE%.log`, // Tên của file log với một mẫu (%DATE%) để tạo tên file dựa trên ngày.
      dirname: './logs', // Thư mục  nơi các file log sẽ được lưu trữ.
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true, // các file log cũ sẽ được nén lại.
      maxSize: '25m', // Nếu file log vượt quá kích thước 25mb, một file mới sẽ được tạo.
      maxFiles: '30d', // Xóa các file log khi quá 30 ngày,
    });
    const errorFileTransport = new transports.File({
      filename: 'error.log',
      level: 'error',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        format.json(),
        format.splat(),
        consoleFormat,
      ),
    });
    const console = new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss:SSSZ' }),
        format.splat(),
        consoleFormat,
      ),
    });
    const logger = createLogger({
      defaultMeta: { service: '[NodeJS Course Service]' },
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
      },
      level: 'debug',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        format.json(),
        consoleFormat,
      ),
      transports: [transport, errorFileTransport],
    });

    logger.add(console);

    this.logger = logger;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new LocalLogger();
    }

    return this.instance;
  }

  info(message: string, data?: any) {
    this.logger.log({ level: 'info', message, data });
  }

  warning(message: string, data?: any) {
    this.logger.log({ level: 'warn', message, data });
  }

  error(message: string, data?: any) {
    this.logger.log({ level: 'error', message, data });
  }

  debug(message: string, data?: any) {
    this.logger.log({ level: 'debug', message, data });
  }
}

export const logger = LocalLogger.getInstance();
