const path = require("path");
const basePath = process.cwd();
const fs = require("fs");
const yesno = require('yesno');
const { RateLimit } = require("async-sema");
const {
  fetchWithRetry,
} = require(`${basePath}/utils/functions/fetchWithRetry.js`);
const { txnCheck } = require(`${basePath}/utils/functions/txnCheck.js`);
const {
  CONTRACT_ADDRESS,
  MINT_TO_ADDRESS,
  CHAIN,
  LIMIT,
  INTERVAL,
  REVEAL_PROMPT
} = require(`${basePath}/src/config.js`);
const _limit = RateLimit(LIMIT);
let [START, END] = process.argv.slice(2);
START = parseInt(START);
END = parseInt(END);

const ownedNFTs = [];

async function checkOwnedNFTs() {
  try {
    let page = 1;
    let lastPage = 1;
    let url = `https://api.nftport.xyz/v0/accounts/${MINT_TO_ADDRESS}?chain=${CHAIN.toLowerCase()}&page_number=`;
    let options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    let ownedNFTsData = await fetchWithRetry(`${url}${page}`, options);
    for (const ownedNFT of ownedNFTsData.nfts) {
      if (ownedNFT.contract_address === CONTRACT_ADDRESS) {
        ownedNFTs.push(parseInt(ownedNFT.token_id));
      }
    }
    lastPage = Math.ceil(ownedNFTsData.total / 50);
    while (page < lastPage) {
      page++;
      ownedNFTsData = await fetchWithRetry(`${url}${page}`, options);
      for (const ownedNFT of ownedNFTsData.nfts) {
        if (ownedNFT.contract_address === CONTRACT_ADDRESS) {
          ownedNFTs.push(parseInt(ownedNFT.token_id));
        }
      }
    }
  } catch (error) {
    console.log(`Catch: Error: ${error}`);
  }

  console.log(`Found ${ownedNFTs.length} owned NFTs.`);
  console.log(`Revealing unowned NFTs...`);
  reveal();
}

async function reveal() {
  if (!fs.existsSync(path.join(`${basePath}/build`, "/revealed"))) {
    fs.mkdirSync(path.join(`${basePath}/build`, "revealed"));
  }
  const ipfsMetas = JSON.parse(
    fs.readFileSync(`${basePath}/build/ipfsMetas/_ipfsMetas.json`)
  );
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
    if (!ownedNFTs.includes(edition)) {
      const revealedFilePath = `${basePath}/build/revealed/${edition}.json`;
      try {
        fs.accessSync(revealedFilePath);
        const revealedFile = fs.readFileSync(revealedFilePath);
        if (revealedFile.length > 0) {
          const revealedFileJson = JSON.parse(revealedFile);
          if (revealedFileJson.updateData.response !== "OK" || revealedFileJson.updateData.error !== null) {
            throw "not revealed";
          } else if(revealedFileJson.updateData.transaction_verified === true) {
            console.log(`${meta.name} already revealed.`);
          } else {
            let check = await txnCheck(
              revealedFileJson.updateData.transaction_external_url
            );
            if (check.includes("Success")) {
              revealedFileJson.updateData.transaction_verified = true;
              fs.writeFileSync(revealedFilePath,JSON.stringify(revealedFileJson, null, 2));
              console.log(`${meta.name} already revealed.`);
            } else if (check.includes("Fail")) {
              console.log(
                `Transaction failed or not found, will retry revealing Edition #${edition}`
              );
              throw `Transaction failed, will retry revealing Edition #${edition}`;
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
          throw "not revealed";
        }
      } catch (err) {
        let  ok = true;
        if (REVEAL_PROMPT) {
          ok = await yesno({
            question: `Reveal ${meta.name}? (y/n):`,
            default: null,
          });
        }
        if (ok) {
          try {
            await _limit();
            const url = "https://api.nftport.xyz/v0/mints/customizable";
            const updateInfo = {
              chain: CHAIN.toLowerCase(),
              contract_address: CONTRACT_ADDRESS,
              metadata_uri: meta.metadata_uri,
              token_id: meta.custom_fields.edition,
            };
            const options = {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updateInfo),
            };
            let updateData = await fetchWithRetry(url, options);

            
            const combinedData = {
              metaData: meta,
              updateData: updateData,
            };
            fs.writeFileSync(
              `${basePath}/build/revealed/${meta.custom_fields.edition}.json`,
              JSON.stringify(combinedData, null, 2)
              );
            console.log(`Updated transaction created for ${meta.name}`);
          } catch (err) {
            console.log(err);
          }
        } else {
          console.log(`Skipped: ${meta.name}`);
        }
      }
    }
  }
  if (!START) {
    console.log(
      `Done revealing! Will run again in ${INTERVAL / 1000 / 60} minutes`
    );
  } else {
    console.log(
      `Done revealing!`
    );
  }
  console.log("To check for errors run command: npm run check_txns --dir=revealed");
}

if (START) {
  reveal();
} else {
  if(CHAIN === 'rinkeby') {
    console.log('Rinkeby is not supported for checking ownership of NFTs.');
    process.exit(1);
  }
  setInterval(checkOwnedNFTs, INTERVAL);
  checkOwnedNFTs();
}
