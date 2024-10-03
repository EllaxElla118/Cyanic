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
                            args: ['--no-sandbox', '--disable-setuid-sandbox'],
                            devtools: true
                         });
                        const page = await browser.newPage();

    try {
        await page.goto('http://makemoney11.com/#/login', { waitUntil: 'networkidle2' });

        // Define locators
        const uNameLocator = page.locator('input[placeholder="Please enter phone number"]');
        const passWordLocator = page.locator('input[placeholder="Please enter password"]');
        const loginBtnLocator = page.locator('p[class="login_btn"]');
        const taskBtnLocator = page.locator('div[class="source_img"]');
        const addBtnLocator = page.locator('div[class="switch_button"]');
        const areaCodeTipLocator = page.locator('div[class="areaCodetip"]');
        const getCodeBtnLocator = page.locator('div[class="get_code"]');

        // Wait for and interact with elements
        await waitForVisible(uNameLocator);
        await uNameLocator.fill('Rexixy');
        await waitForVisible(passWordLocator);
        await passWordLocator.fill('qeL5ufV5uGFVrM');
        await waitForVisible(loginBtnLocator);
        await loginBtnLocator.click();
        await waitForVisible(taskBtnLocator);
        await taskBtnLocator.click();
        await waitForVisible(addBtnLocator);
        await addBtnLocator.click();
        await waitForVisible(areaCodeTipLocator);
        await areaCodeTipLocator.click();

        const [poland] = await page.locator("//span[text()='Poland']").elementHandles();
        if (!poland) throw new Error("Poland option not found.");
        await poland.click();

        await waitForVisible(addBtnLocator);
        await addBtnLocator.click();
        await waitForVisible(uNameLocator);
        await uNameLocator.fill(num.replace("48", ""));
        await waitForVisible(getCodeBtnLocator);
        await getCodeBtnLocator.click();

        const response = await page.waitForResponse(response => 
            response.request().resourceType() === 'xhr'
        );

        const a = await response.json();
        ws.send(JSON.stringify({ MCode: a.code }));
        ws.close();

    } catch (error) {
        console.error('An error occurred:', error.message);
    } finally {
        await browser.close();
    }
})();

// Helper function to wait for visibility
async function waitForVisible(locator) {
    try {
        await locator.waitFor({ state: 'visible', timeout: 60000 });
    } catch (error) {
        console.error(`Error waiting for visibility:`, error.message);
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
