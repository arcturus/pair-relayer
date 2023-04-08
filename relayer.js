const net = require('net');
const logger = require('./logger');

// List of open pairs of sockets
const socketsPair = [];
// List of all open sockets
const sockets = [];

// Create server and listen to connections
const server = net.createServer((socket) => {
  logger.info('New incoming connection');

  const otherSocket = socketsPair.pop();

  if (otherSocket) {
    logger.debug('Pairing incoming connection with existing connection');
    const cleanup = () => {
      const index = sockets.indexOf(otherSocket);
      if (index > -1) {
        sockets.splice(index, 1);
      }
      otherSocket.removeListener('end', cleanup);
    };
    otherSocket.on('end', cleanup);
    socket.on('end', () => {
      if (otherSocket) {
        otherSocket.end();
        logger.debug('Closing other socket');
      }
    });
    otherSocket.pipe(socket).pipe(otherSocket);
    sockets.push(socket, otherSocket);
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
  
  // Close all socket connections
  sockets.forEach((socket) => {
    socket.end();
    logger.debug('Closing socket connection');
  });

  // Close the server
  server.close(() => {
    logger.info('Server shut down successfully');
    process.exit();
  });
});
