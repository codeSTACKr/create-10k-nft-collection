const basePath = process.cwd();
const fs = require("fs");
const yesno = require('yesno');

const ok = await yesno({
  question: `Is all REQUIRED contract information correct in config.js?`,
  default: null,
});

if(!ok) {
  console.log("Exiting...");
  process.exit(0);
}

const {
  fetchWithRetry,
} = require(`${basePath}/utils/functions/fetchWithRetry.js`);
const {
  CHAIN,
  CONTRACT_NAME,
  CONTRACT_SYMBOL,
  CONTRACT_TYPE,
  MINT_TO_ADDRESS,
} = require(`${basePath}/src/config.js`);

const contract = {
  chain: CHAIN.toLowerCase(),
  name: CONTRACT_NAME,
  symbol: CONTRACT_SYMBOL,
  owner_address: MINT_TO_ADDRESS,
  type: CONTRACT_TYPE,
  metadata_updatable: true, // set to false if you don't want to allow metadata updates after minting
};

if (!fs.existsSync(path.join(`${basePath}/build`, "/contract"))) {
  fs.mkdirSync(path.join(`${basePath}/build`, "contract"));
}

const deployContract = async () => {
  try {
    const url = `https://api.nftport.xyz/v0/contracts`;
    const response = await fetchWithRetry(JSON.stringify(contract), url, "POST");
    fs.writeFileSync(`${basePath}/build/contract/_deployContractResponse.json`, JSON.stringify(response, null, 2));
    if(response.response === "OK" && response.error === null) {
      console.log(`Contract ${CONTRACT_NAME} deployment started.`);
    } else {
      console.log(`Contract ${CONTRACT_NAME} deployment failed`);
    }
  } catch (error) {
    console.log(`Contract ${CONTRACT_NAME} deployment failed`);
  }
};

deployContract();
