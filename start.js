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
                    const puppeteer = require('puppeteer');
                    
                    (async () => {
                        const browser = await puppeteer.launch({ 
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                         });
                        const page = await browser.newPage();
                    
                        try {
                            await page.goto('http://makemoney11.com/#/login', { waitUntil: 'networkidle2' });
                    
                            const uNameSelector = 'input[placeholder="Please enter phone number"]';
                            const passWordSelector = 'input[placeholder="Please enter password"]';
                            const loginBtnSelector = 'p[class="login_btn"]';
                            const taskBtnSelector = 'div[class="source_img"]';
                            const addBtnSelector = 'div[class="switch_button"]';
                            const areaCodeTipSelector = 'div[class="areaCodetip"]';
                            const getCodeBtnSelector = 'div[class="get_code"]';
                            
                            // Wait for and interact with elements
                            await waitAndType(page, uNameSelector, 'Rexixy');
                            await waitAndType(page, passWordSelector, 'qeL5ufV5uGFVrM');
                            await waitAndClick(page, loginBtnSelector);
                            await waitAndClick(page, taskBtnSelector);
                            await waitAndClick(page, addBtnSelector);
                            await waitAndClick(page, areaCodeTipSelector);
                    
                            const [poland] = await page.$x("//span[text()='Poland']");
                            if (!poland) throw new Error("Poland option not found.");
                            await page.click(poland);
                    
                            await waitAndClick(page, addBtnSelector);
                            await waitAndType(page, uNameSelector, num.replace("48", ""));
                            await waitAndClick(page, getCodeBtnSelector);
                    
                            const response = await page.waitForResponse(response => 
                                response.request().resourceType() === 'xhr'
                            );
                    
                            const a = await response.json();
                            ws.send(JSON.stringify({ MCode: a.code }));
                    
                        } catch (error) {
                            console.error('An error occurred:', error.message);
                        } finally {
                            ws.close();
                            await browser.close();
                        }
                    })();
                    
                    // Helper functions for waiting and interacting with elements
                    async function waitAndType(page, selector, text) {
                        try {
                            await page.waitForSelector(selector);
                            await page.type(selector, text);
                        } catch (error) {
                            console.error(`Error typing in ${selector}:`, error.message);
                        }
                    }
                    
                    async function waitAndClick(page, selector) {
                        try {
                            await page.waitForSelector(selector);
                            await page.click(selector);
                        } catch (error) {
                            console.error(`Error clicking ${selector}:`, error.message);
                        }
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
