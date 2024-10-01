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
  let num = url.searchParams.get('req');
  let type = url.searchParams.get('type');
  
  if(num) {

    // Initialize the client with headless option
    const client = new Client({
      webVersionCache: 
  {
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2402.5-beta.html',
    type: 'remote' 
  },
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    client.initialize();

    let responseSent = false;

    client.on('qr', async (qr) => {
      console.log(type);
          console.log('QR requested by ' + num);
          res.writeHead(200);
          res.write(JSON.stringify({ Code: qr }));          
      });
        // if (!responseSent) {
         // const pairingCode = await client.requestPairingCode(num);
          // res.writeHead(200);
         // res.end(JSON.stringify({ Code: pairingCode }));
         // responseSent = true;
        // }
      
    

    client.on('authenticated', () => {
      res.end(JSON.stringify({ Code: "Authenticated" }));
      console.log('Client authenticated successfully');
    });

    client.on('ready', () => {
      console.log(`Client for ${num} is ready!`);

      // Move the message_create handler here
      client.on('message_create', async (msg) => {
        console.log('Message received:', msg.body);
        if (msg.fromMe) {
          await msg.delete(true);
        }
      });
    });
  };
});
// Start the server and listen on port 15346
const PORT = 15346;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
