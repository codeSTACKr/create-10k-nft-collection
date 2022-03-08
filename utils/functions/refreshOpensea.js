const basePath = process.cwd();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
let [START, END] = process.argv.slice(2);
const { CONTRACT_ADDRESS, CHAIN } = require(`${basePath}/src/config.js`);

START = parseInt(START);
END = parseInt(END);
if (!START || !END) {
  console.log(
    "Please provide a start and end edition number. Example: npm run refresh_os --start 1 --end 10"
  );
  process.exit(1);
}

const COLLECTION_BASE_URL =
  CHAIN.toLowerCase() === "rinkeby"
    ? `https://testnets.opensea.io/assets`
    : "https://opensea.io/assets/matic";

async function main() {
  const notFound = [];
  const errors = [];
  const browser = await puppeteer.launch({
    headless: false,
  });

  console.log(`Beginning OpenSea Refresh`);
  const page = await browser.newPage();

  for (let i = START; i <= END; i++) {
    try {
      console.log(`Refreshing Edition: ${i}`);

      const url = `${COLLECTION_BASE_URL}/${CONTRACT_ADDRESS}/${i}`;

      await page.goto(url);

      await page.waitForSelector('button>div>i[value="refresh"]');
      let pageTitle = await page.$$eval("title", (title) =>
        title.map((title) => title.textContent)
      );
      if (pageTitle[0].includes("Not Found")) {
        console.log(`Edition ${i} not found!`);
        notFound.push(i);
      }

      await page.click('button>div>i[value="refresh"]');
      await page.waitForTimeout(5000);

      console.log(`Refreshed Edition: ${i}`);
    } catch (error) {
      console.log(`Error refreshing edition ${i}: ${error}`);
      errors.push(i);
    }
  }

  await browser.close();

  if (notFound.length > 0 || errors.length > 0) {
    console.log(`Not Found: ${notFound}`);
    console.log(`Errors: ${errors}`);
  }
  console.log(`Finished OpenSea Refresh`);
}

main();
