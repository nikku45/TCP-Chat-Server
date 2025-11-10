

const net = require('net');


const CLI_PORT = process.argv[2];
const PORT = CLI_PORT || process.env.PORT || 4000;


const clients = new Map();


const IDLE_TIMEOUT_MS = 60 * 1000;


function sendLine(socket, text) {
  try {
    socket.write(text + '\n');
  } catch (e) {
  
  }
}

// Broadcast a chat message to all other clients in format: MSG <username> <text>
function broadcastMessage(fromUsername, text) {
  const line = `MSG ${fromUsername} ${text}`;
  for (const [username, client] of clients) {
    if (username !== fromUsername) {
      sendLine(client.socket, line);
    }
  }
  console.log(`[BROADCAST] ${line}`);
}

// Broadcast an info message to all clients (system messages), e.g.: INFO <username> disconnected
function broadcastInfo(text) {
  const line = `INFO ${text}`;
  for (const [, client] of clients) {
    sendLine(client.socket, line);
  }
  console.log(`[INFO] ${line}`);
}

// Reset idle timer for a client (clears old timer and sets a new one)
function resetIdleTimer(username) {
  const client = clients.get(username);
  if (!client) return;

  // Clear existing timeout
  if (client.timeoutRef) {
    clearTimeout(client.timeoutRef);
  }

  // Set a new idle timeout
  client.timeoutRef = setTimeout(() => {
    try {
      sendLine(client.socket, 'INFO idle-timeout disconnected');
      client.socket.end(); // will trigger 'end'/'close' handling
    } catch (e) {}
  }, IDLE_TIMEOUT_MS);
}

// Remove a client (cleanup) and notify others
function removeClient(username) {
  const client = clients.get(username);
  if (!client) return;
  if (client.timeoutRef) clearTimeout(client.timeoutRef);
  clients.delete(username);
  broadcastInfo(`${username} disconnected`);
  console.log(`${username} removed.`);
}

// Input sanitation helpers
function normalizeLine(raw) {
  // Convert buffer to string, remove leading/trailing spaces and normalize internal whitespace to single spaces
  return raw.toString().replace(/\r/g, '').split('\n')[0].trim().replace(/\s+/g, ' ');
}

// Handle raw incoming line (single command) from a socket
function handleLine(socket, line) {
  // If the socket doesn't have a username yet -> expect LOGIN <username>
  if (!socket.username) {
    if (!line.startsWith('LOGIN ')) {
      sendLine(socket, 'ERR Please login first');
      return;
    }

    const parts = line.split(' ');
    const username = parts[1];
    if (!username) {
      sendLine(socket, 'ERR username-required');
      return;
    }

    // Basic username validation (no spaces, reasonable length)
    if (username.length > 30 || /\s/.test(username)) {
      sendLine(socket, 'ERR invalid-username');
      return;
    }

    if (clients.has(username)) {
      sendLine(socket, 'ERR username-taken');
      return;
    }

    // Accept login
    socket.username = username;
    clients.set(username, { socket, timeoutRef: null });
    sendLine(socket, 'OK');
    console.log(`${username} logged in.`);

    // Notify others that this user joined 
    broadcastInfo(`${username} connected`);

    // Start idle timer for this user
    resetIdleTimer(username);
    return;
  }

  // User is logged in: reset idle timer for activity
  resetIdleTimer(socket.username);

  // Handle commands after login
  if (line.startsWith('MSG ')) {
    const text = line.slice(4).trim();
    if (!text) {
      sendLine(socket, 'ERR empty-message');
      return;
    }
    // Broadcast text to others
    broadcastMessage(socket.username, text);
    return;
  }

  if (line === 'WHO') {
    // Return USER <username> for each connected user (including requester)
    for (const uname of clients.keys()) {
      sendLine(socket, `USER ${uname}`);
    }
    return;
  }

  if (line.startsWith('DM ')) {
    // DM <username> <text>
    const parts = line.split(' ');
    const target = parts[1];
    const text = parts.slice(2).join(' ').trim();
    if (!target || !text) {
      sendLine(socket, 'ERR dm-usage'); // usage error
      return;
    }
    const targetClient = clients.get(target);
    if (!targetClient) {
      sendLine(socket, 'ERR user-not-found');
      return;
    }
    // Send direct message to target in format: DM <from> <text>
    sendLine(targetClient.socket, `DM ${socket.username} ${text}`);
    // Optionally confirm to sender
    sendLine(socket, `DM-SENT ${target} ${text}`);
    return;
  }

  if (line === 'PING') {
    sendLine(socket, 'PONG');
    return;
  }

  // Unknown command
  sendLine(socket, 'ERR Unknown command');
}

// Create the TCP server
const server = net.createServer((socket) => {
  console.log('New connection from', socket.remoteAddress + ':' + socket.remotePort);

  // Set encoding optional (we parse buffers ourselves)
  // socket.setEncoding('utf8');

  // We'll buffer partial data until newline (so user can type messages)
  let buffer = '';

  socket.on('data', (chunk) => {
    buffer += chunk.toString();

    // Split on newline(s) and process each full line
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const rawLine = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);

      const line = normalizeLine(rawLine);
      if (line.length === 0) {
        // ignore empty lines but reset idle timer
        if (socket.username) resetIdleTimer(socket.username);
        continue;
      }

      handleLine(socket, line);
    }
  });

  socket.on('end', () => {
    // Clean up on graceful end
    if (socket.username) {
      console.log(`${socket.username} connection ended (end).`);
      removeClient(socket.username);
    } else {
      console.log('Connection ended before login.');
    }
  });

  socket.on('close', (hadError) => {
    // close is fired after end or on error; ensure cleanup if not already done
    if (socket.username && clients.has(socket.username)) {
      console.log(`${socket.username} closed connection (close).`);
      removeClient(socket.username);
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
    // Ensure cleanup on error
    if (socket.username && clients.has(socket.username)) {
      removeClient(socket.username);
    }
  });

  // If the client doesn't send anything and stays un-logged, optionally we could start a login timeout here.
});

// Start server
server.listen(PORT, () => {
  console.log(`Chat server listening on port ${PORT}`);
});

// Handle server-level errors
server.on('error', (err) => {
  console.error('Server error:', err.message);
});
