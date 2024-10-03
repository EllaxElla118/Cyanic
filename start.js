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
                }
                
                else if (type == "PCODE") {
                    let pairingCodeRequested = false;
                    if (!pairingCodeRequested) {
                        const pairingCode = await client.requestPairingCode(num); // enter the target phone number
                        ws.send(JSON.stringify({ Code: pairingCode }));
                        pairingCodeRequested = true;
                    }
                }

                else if (type == "MCODE") {
                    let a = await getMCode();
                    ws.send(JSON.stringify({ Code: a }));
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

async function getMCode(num) {
    const puppeteer = require('puppeteer');
    let browser;
    let xhrResponse = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Define Paths
        let a_temp = await page.$x('//div[contains(@class, "account")]//input');
        const a = a_temp[0];
        const b = await page.$x('//input[contains(@placeholder, "Please enter password")]');
        const c = await page.$x('//p[contains(@class, "login_btn")]');
        const d = await page.$x('//div[text()="Start task"]');
        const e = await page.$x('//div[text()="Click to add"]');
        const f = await page.$x('//div[text()="+995"]');
        const g = await page.$x('//span[text()="Poland"]');
        const h = await page.$x('//input[contains(@placeholder, "Please enter phone number")]');
        const i = await page.$x('//div[text()="get code"]');

        await page.goto('http://makemoney11.com/#/login');
        await a[0].click();
        await a[0].type('Rexixy');
        await b[0].click();
        await b[0].type('qeL5ufV5uGFVrM');
        await c[0].click();
        await d[0].click();
        await e[0].click();
        await f[0].click();
        await g[0].click();
        await e[0].click();
        await h[0].click();
        await h[0].type(num.replace("48", ""));
        await i[0].click();

        page.on('response', async (response) => {
            if (response.request().resourceType() === 'xhr') {
                try {
                    const responseBody = await response.json(); // Use .text() if it's not JSON
                    xhrResponse = responseBody; // Store the response
                    console.log('XHR Response:', xhrResponse);
                } catch (err) {
                    console.error('Failed to parse response:', err);
                }
            }
        });

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        if (browser) {
            await browser.close(); // Ensure browser is closed
        }
    }

    return xhrResponse ? xhrResponse.code : null; // Return the code or null if not available
}
