const { RateLimit } = require("async-sema");
const path = require("path");
const basePath = process.cwd();
const fs = require("fs");
let [START, END] = process.argv.slice(2);
let range = START ? END ? `${START}-${END}` : START : "ALL";
const yesno = require('yesno');

const ok = await yesno({
  question: `OK to mint ${range}?`,
  default: null,
});

if(!ok) {
  console.log("Exiting...");
  process.exit(0);
}

const { txnCheck } = require(`${basePath}/utils/functions/txnCheck.js`);
const {
  fetchWithRetry,
} = require(`${basePath}/utils/functions/fetchWithRetry.js`);

const {
  CONTRACT_ADDRESS,
  MINT_TO_ADDRESS,
  CHAIN,
  LIMIT,
  GENERIC,
} = require(`${basePath}/src/config.js`);
const _limit = RateLimit(LIMIT);

const ipfsMetasFile = GENERIC
  ? `${basePath}/build/ipfsMetasGeneric/_ipfsMetas.json`
  : `${basePath}/build/ipfsMetas/_ipfsMetas.json`;

if (!fs.existsSync(path.join(`${basePath}/build`, "/minted"))) {
  fs.mkdirSync(path.join(`${basePath}/build`, "minted"));
}

async function main() {
  const ipfsMetas = JSON.parse(fs.readFileSync(ipfsMetasFile));

  for (const meta of ipfsMetas) {
    const edition = meta.custom_fields.edition;
    if (START && END) {
      if (edition < START || edition > END) {
        return;
      }
    } else if (START) {
      if (edition !== START) {
        return;
      }
    }

    const mintFile = `${basePath}/build/minted/${edition}.json`;

    try {
      fs.accessSync(mintFile);
      const mintedFile = fs.readFileSync(mintFile);
      if (mintedFile.length > 0) {
        const mintedMeta = JSON.parse(mintedFile);
        if (
          mintedMeta.mintData.response !== "OK" ||
          mintedMeta.mintData.error !== null
        ) {
          console.log(
            `Response: ${mintedMeta.mintData.response}`,
            `Error: ${mintedMeta.mintData.error}`,
            `Retrying Edition #${edition}`
          );
          throw "Edition not minted";
        } else {
          let check = await txnCheck(
            mintedMeta.mintData.transaction_external_url
          );
          if (check !== "Success") {
            console.log(
              `Transaction failed or not found, will retry Edition #${edition}`
            );
            throw "Transaction failed or not found";
          }
        }
      }
      console.log(`${meta.name} already minted`);
    } catch (err) {
      try {
        await _limit();
        const mintInfo = {
          chain: CHAIN.toLowerCase(),
          contract_address: CONTRACT_ADDRESS,
          metadata_uri: meta.metadata_uri,
          mint_to_address: MINT_TO_ADDRESS,
          token_id: edition,
        };
        let mintData = await fetchWithRetry(
          JSON.stringify(mintInfo),
          "https://api.nftport.xyz/v0/mints/customizable",
          "POST"
        );
        const combinedData = {
          metaData: meta,
          mintData: mintData,
        };
        fs.writeFileSync(
          `${basePath}/build/minted/${edition}.json`,
          JSON.stringify(combinedData, null, 2)
        );

        if (mintData.response !== "OK" || mintData.error !== null) {
          console.log(
            `Minting ${meta.name} failed!`,
            `Response: ${mintData.response}`,
            `Error: ${mintData.error}`
          );
        } else {
          console.log(`Mint transaction created for: ${meta.name}!`);
        }
      } catch (err) {
        console.log(`Catch: Minting ${meta.name} failed with ${err}!`);
      }
    }
  }

  console.log("Minting complete. Run mintCheck to check for errors.");
}

main();
