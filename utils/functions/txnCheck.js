const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function txnCheck(url) {
  return new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    const session = await page.target().createCDPSession();
    const {windowId} = await session.send('Browser.getWindowForTarget');
    await session.send('Browser.setWindowBounds', {windowId, bounds: {windowState: 'minimized'}});
    await page.goto(url);
    await page.waitForSelector("#ContentPlaceHolder1_maintable");
    
    try {
      let cardText = await page.$eval("#ContentPlaceHolder1_maintable .row:nth-child(4) div:nth-child(2)", (text) => text.textContent);
      await browser.close();
      resolve(cardText);
    } catch (error) {
      await browser.close();
      resolve("Unknown");
    }
  });
}

module.exports = { txnCheck };
