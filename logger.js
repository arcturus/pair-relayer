const { createLogger, format, transports } = require('winston');

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(info => {
          return `${info.timestamp} [${info.level}]: ${info.message}`;
        })
      )
    })
  ]
});

module.exports = logger;