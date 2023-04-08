const net = require('net');
const winston = require('winston');

// Set up logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'relayer' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, label, timestamp }) => {
          return `${timestamp} [${label}] ${level}: ${message}`;
        })
      ),
    }),
  ],
});

// List of open pairs of sockets
const socketsPair = [];

// Create server and listen to connections
const server = net.createServer((socket) => {
  logger.info('New incoming connection');

  const otherSocket = socketsPair.pop();

  if (otherSocket) {
    logger.debug('Pairing incoming connection with existing connection');
    socket.on('end', () => {
      if (otherSocket) {
        otherSocket.end();
        logger.debug('Closing other socket');
      }
    });
    otherSocket.pipe(socket).pipe(otherSocket);
    logger.debug('Forwarding data between sockets');

  } else {
    logger.debug('No other connections to pair with');
    socketsPair.push(socket);
  }
});

server.listen(process.env.PORT || 3000, () => {
  logger.info(`Listening on port ${server.address().port}`);
});

server.on('error', (err) => {
  logger.error(`Server error: ${err}`);
});

process.on('SIGINT', () => {
  logger.info('Shutting down server');
  server.close(() => {
    logger.info('Server shut down successfully');
    process.exit();
  });
});
