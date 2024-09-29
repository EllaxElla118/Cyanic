// Import the http module
const http = require('http');
const { Client } = require('whatsapp-web.js');

// Store clients in a map
const clients = new Map();

// Create a server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Set the response header to indicate JSON content type
  res.setHeader('Content-Type', 'application/json');

  // Process GET requests
  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const num = url.searchParams.get('num');

    if (num) {
      console.log('Received pairing request from ' + num);
      
      // Check if a client for this number already exists
      if (!clients.has(num)) {
        const client = new Client({
          puppeteer: {
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
          }
        });

        client.initialize();

        client.on('qr', async (qr) => {
          const pairingCode = await client.requestPairingCode(num);
          if (!res.finished) {
            res.writeHead(200);
            res.end(JSON.stringify({ Code: pairingCode }));
          }
        });

        client.on('authenticated', () => {
          if (!res.finished) {
            res.writeHead(200);
            res.end(JSON.stringify({ AuthStatus: 'Complete' }));
          }
        });

        client.on('ready', () => {
          console.log(`Client for ${num} is ready!`);
        });

        client.on('message_create', async (msg) => {
          if (msg.fromMe) {
            msg.delete(true);
          }
        });

        // Store the client instance in the map
        clients.set(num, { client, authenticated: false });
      } else {
        const { client, authenticated } = clients.get(num);

        if (!authenticated) {
          // If the client exists but is not authenticated, re-request the pairing code
          client.on('qr', async (qr) => {
            const pairingCode = await client.requestPairingCode(num);
            if (!res.finished) {
              res.writeHead(200);
              res.end(JSON.stringify({ Code: pairingCode }));
            }
          });
          
          // Add an event listener for authenticated status
          client.on('authenticated', () => {
            if (!res.finished) {
              res.writeHead(200);
              res.end(JSON.stringify({ AuthStatus: 'Complete' }));
            }
            // Update the authentication status
            clients.set(num, { client, authenticated: true });
          });
        } else {
          // If client is already authenticated, send a message
          if (!res.finished) {
            res.writeHead(200);
            res.end(JSON.stringify({ message: 'Client already authenticated for this number.' }));
          }
        }
      }
    } else {
      if (!res.finished) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'No number provided in query' }));
      }
    }
  } else {
    if (!res.finished) {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  }
});

// Start the server and listen on port 15346
const PORT = 15346;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
