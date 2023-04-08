/*
 * Author: Francisco Jordano <francisco@jordano.es>
 * License: MPL 2.0
 */

const net = require('net');

const socketPairs = [];

const port = process.env.PORT || 3000;

const server = net.createServer((socket) => {
  if (socketPairs.length === 0 || socketPairs[socketPairs.length - 1].length === 2) {
    // Create a new socket pair
    const newPair = [socket];
    socketPairs.push(newPair);
  } else {
    // Forward data between the last pair and the new socket
    const lastPair = socketPairs[socketPairs.length - 1];
    lastPair.push(socket);
    forwardData(lastPair);
  }

  socket.on('end', () => {
    const pair = getPair(socket);
    if (pair) {
      // Close the other socket before removing the pair
      const otherSocket = getOtherSocket(pair, socket);
      if (otherSocket) {
        otherSocket.end();
      }
      // Remove the socket pair
      socketPairs.splice(socketPairs.indexOf(pair), 1);
    }
  });

  socket.on('error', (err) => {
    console.error(`Socket error: ${err}`);
  });
});

function getPair(socket) {
  return socketPairs.find((pair) => pair.includes(socket));
}

function getOtherSocket(pair, socket) {
  return pair.find((s) => s !== socket);
}

function forwardData(pair) {
  const [socket1, socket2] = pair;
  socket1.pipe(socket2);
  socket2.pipe(socket1);
}

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
