const basePath = process.cwd();
const fs = require("fs");

const {
  fetchNoRetry,
} = require(`${basePath}/utils/functions/fetchWithRetry.js`);
const { CHAIN, CONTRACT_NAME } = require(`${basePath}/src/config.js`);

const retrieveContract = async () => {
  try {
    const rawDeployData = fs.readFileSync(
      `${basePath}/build/contract/_deployContractResponse.json`
    );
    const deployData = JSON.parse(rawDeployData);
    if (deployData.response === "OK") {
      const txnHash = deployData.transaction_hash;
      const chain = CHAIN.toLowerCase();
      const url = `https://api.nftport.xyz/v0/contracts/${txnHash}?chain=${chain}`;
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      };
      const response = await fetchNoRetry(url, options);
      fs.writeFileSync(
        `${basePath}/build/contract/_contract.json`,
        JSON.stringify(response, null, 2)
      );
      if (response.response === "OK") {
        console.log(`Contract ${CONTRACT_NAME} deployed successfully`);
      } else {
        console.log(`Contract ${CONTRACT_NAME} deployment failed`);
      }
    } else {
      console.log(`Contract ${CONTRACT_NAME} deployment failed`);
    }
  } catch (error) {
    console.log(`CATCH: Contract ${CONTRACT_NAME} deployment failed`, `ERROR: ${error}`);
  }
};

retrieveContract();
