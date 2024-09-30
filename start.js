const http = require('http');
const { Client } = require('whatsapp-web.js');

// Create a server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const num = url.searchParams.get('num');

  if (num) {
    console.log('Received pairing request from ' + num);

    // Initialize the client with headless option
    const client = new Client({
      puppeteer: {
        headless: true, // Set headless mode to true
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Recommended args for Docker
      }
    });

    client.initialize();

    let responseSent = false; // Track if a response has been sent

    client.on('qr', async (qr) => {
      if (!responseSent) {
        const pairingCode = await client.requestPairingCode(num);
        res.writeHead(200);
        res.end(JSON.stringify({ Code: pairingCode }));
        responseSent = true; // Mark response as sent
      }
    });

    client.on('authenticated', () => {
      if (!responseSent) {
        res.writeHead(200);
        res.end(JSON.stringify({ AuthStatus: 'Complete' }));
        responseSent = true; // Mark response as sent
      }
    });

    client.on('ready', () => {
      console.log(`Client for ${num} is ready!`);
    });

    client.on('message_create', async (msg) => {
      if (msg.fromMe) {
        await msg.delete(true);
      }
    });
  } else {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'No num provided' }));
  }
});

// Start the server and listen on port 15346
const PORT = 15346;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
