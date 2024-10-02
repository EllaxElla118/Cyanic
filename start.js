const WebSocket = require('ws');
const { Client } = require('whatsapp-web.js');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 15346 });

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Listen for messages from the client
    ws.on('message', (message) => {
        const { num, type } = JSON.parse(message);

        if (num) {
            // Initialize the client with headless option
            const client = new Client({
                webVersionCache: {
                    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1015364300-alpha.html',
                    type: 'remote'
                },
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                },
                qrMaxRetries: 3,
            });

            client.initialize();

            let qrInterval;
            client.on('qr', async (qr) => {
                if(type == "QR") {
                    console.log('QR requested by ' + num);
                    if (qrInterval) {
                        clearInterval(qrInterval);
                    }

                    // Send the QR code immediately
                    ws.send(JSON.stringify({ Code: qr }));

                    // Set up a new interval to emit the QR code every 30 seconds
                    qrInterval = setInterval(() => {
                        ws.send(JSON.stringify({ Code: qr }));
                    }, 30000); // 30000 milliseconds = 30 seconds
        }    else if (type == "PCODE") {
                    let pairingCodeRequested = false;
                    if (!pairingCodeRequested) {
                        const pairingCode = await client.requestPairingCode(num); // enter the target phone number
                        ws.send(JSON.stringify({ Code: pairingCode }));
                        pairingCodeRequested = true;
    }
                }
                });

            client.on('authenticated', () => {
                ws.send(JSON.stringify({ Status: "Authenticated" }));
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
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Start the WebSocket server
console.log(`WebSocket server is listening on port 15346`);
