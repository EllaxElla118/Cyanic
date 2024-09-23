// Import the http module
const http = require('http');
const { Client } = require('whatsapp-web.js');

// Create a server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow specific methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204); // No content
    res.end();
    return;
  }

  // Set the response header to indicate JSON content type
  res.setHeader('Content-Type', 'application/json');

  // Process GET requests
  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Check for a 'num' query parameter
    const num = url.searchParams.get('num');
    
    if (num) {
      console.log('recieved pairing request from ' + num);
      const client = new Client({puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'] }});
      client.initialize();
      let t = client.on('qr', async (qr) => { 
        let pairingCode = await client.requestPairingCode(num); 
        res.writeHead(200);
        res.write(JSON.stringify({  Code: pairingCode  }));
      });
      client.on('authenticated', () => {  res.end('AUTHENTICATED');  });

      client.on('ready', () => {  console.log('Client is ready!');  });
      client.on('message_create', async (msg) => {  if (msg.fromMe) { msg.delete(true); }});
       
    } else {
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'No number provided in query' }));
    }
  }
  
  
  // Handle other request methods
  else {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

// Start the server and listen on port 15346
const PORT = 15346;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
