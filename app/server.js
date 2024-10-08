// Import the http module
const http = require('http');
const { Client } = require('whatsapp-web.js');

// Create a server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Set the response header to indicate JSON content type
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const num = url.searchParams.get('num');

  if (num) {
    console.log('Received pairing request from ' + num);

    const client = new Client(); // Initialize the client here
    client.initialize();

    client.on('qr', async (qr) => {
      const pairingCode = await client.requestPairingCode(num);
      res.writeHead(200);
      res.end(JSON.stringify({ Code: pairingCode }));
    });

    client.on('authenticated', () => {
      res.writeHead(200);
      res.end(JSON.stringify({ AuthStatus: 'Complete' }));
    });

    client.on('ready', () => {
      console.log(`Client for ${num} is ready!`);
    });

    client.on('message_create', async (msg) => {
      if (msg.fromMe) {
        await msg.delete(true);
      }
    }); // Close the message_create event handler
  } else {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'No num provided' }));
  }
}); // Close the createServer callback

// Start the server and listen on port 15346
const PORT = 15346;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
