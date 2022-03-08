const { RateLimit } = require("async-sema");
const path = require("path");
const basePath = process.cwd();
const fs = require("fs");
let [START, END] = process.argv.slice(2);
START = parseInt(START);
END = parseInt(END);
let range = START ? END ? `${START}-${END}` : `${START}-Remaining` : "ALL";
const yesno = require('yesno');

const { txnCheck } = require(`${basePath}/utils/functions/txnCheck.js`);
const {
  fetchWithRetry,
} = require(`${basePath}/utils/functions/fetchWithRetry.js`);

const {
  CONTRACT_ADDRESS,
  MINT_TO_ADDRESS,
  CHAIN,
  GENERIC,
} = require(`${basePath}/src/config.js`);
const _limit = RateLimit(1); // Currently, minting is limited to 1/second.

const ipfsMetasFile = GENERIC
  ? `${basePath}/build/ipfsMetasGeneric/_ipfsMetas.json`
  : `${basePath}/build/ipfsMetas/_ipfsMetas.json`;

async function main() {
  const ok = await yesno({
    question: `OK to mint ${range}? (y/n):`,
    default: null,
  });

  if(!ok) {
    console.log("Exiting...");
    process.exit(0);
  }

  if (!fs.existsSync(path.join(`${basePath}/build`, "/minted"))) {
    fs.mkdirSync(path.join(`${basePath}/build`, "minted"));
  }

  const ipfsMetas = JSON.parse(fs.readFileSync(ipfsMetasFile));

  for (const meta of ipfsMetas) {
    const edition = meta.custom_fields.edition;
    if (START && END) {
      if (edition < START || edition > END) {
        continue;
      }
    } else if (START) {
      if (edition < START) {
        continue;
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
        } else if(mintedMeta.mintData.transaction_verified === true) {
          console.log(`${meta.name} already minted`);
        } else {
          let check = await txnCheck(
            mintedMeta.mintData.transaction_external_url
          );
          if (check.includes("Success")) {
            mintedMeta.mintData.transaction_verified = true;
            fs.writeFileSync(mintFile,JSON.stringify(mintedMeta, null, 2));
            console.log(`${meta.name} already minted`);
          } else if (check.includes("Fail")) {
            console.log(
              `Transaction failed or not found, will retry Edition #${edition}`
            );
            throw `Transaction failed, will retry Edition #${edition}`;
          } else if(check.includes("Pending")) {
            console.log(
              `Transaction transaction still pending for Edition #${edition}`
            );
          } else {
            console.log(
              `Transaction unknown, please manually check Edition #${edition}`,
              `Directory: ${mintFile}`
            );
          }
        }
      } else {
        throw `Edition #${edition} not minted`;
      }
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
        const url = 'https://api.nftport.xyz/v0/mints/customizable';
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mintInfo),
        };
        let mintData = await fetchWithRetry(url, options);
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
            `Minting ${meta.name} failed :(`,
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

  console.log("Minting complete. To check for errors run command: npm run check_txns --dir=minted");
}

main();
