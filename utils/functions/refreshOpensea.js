const basePath = process.cwd();
const puppeteer = require("puppeteer");
let [START, END] = process.argv.slice(2);
const { CONTRACT_ADDRESS } = require(`${basePath}/src/config.js`);

if(!START || !END) {
  console.log("Please provide a start and end edition number. Example: node refreshOpensea.js 1 100");
  process.exit(1);
}

const COLLECTION_BASE_URL = `https://opensea.io/assets/matic/${CONTRACT_ADDRESS}/`;

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 60000,
  });
  const notFound = [];
  const errors = [];

  console.log(`Beginning OpenSea Refresh - ${COLLECTION_BASE_URL}`);
  const page = await browser.newPage();

  for (let i = START; i <= END; i++) {
    try {
      console.log(`Refreshing Edition: ${i}`);

      const url = COLLECTION_BASE_URL + i.toString();

      await page.goto(url);

      await page.waitForSelector('main');
      let pageTitle = await page.$$eval('title', title => title.map(title => title.textContent));
      if(pageTitle[0] === "Not Found | OpenSea") {
        console.log(`Edition ${i} not found!`);
        notFound.push(i);
      }

      await page.click('button>div>i[value="refresh"]')
      await page.waitForTimeout(5000);

      console.log(`Refreshed Edition: ${i}`);
    } catch (error) {
      console.log(`Error refreshing edition ${i}: ${error}`);
      errors.push(i);
    }
  }

  await browser.close();

  if(notFound.length > 0 || errors.length > 0) {
    console.log(`Not Found: ${notFound}`);
    console.log(`Errors: ${errors}`);
  }
  console.log(
    `Finished OpenSea Refresh - ${COLLECTION_BASE_URL}`
  );
}

main();
