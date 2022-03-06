const path = require("path");
const basePath = process.cwd();
const fs = require("fs");
const yesno = require('yesno');
const { RateLimit } = require("async-sema");
const {
  fetchWithRetry,
} = require(`${basePath}/utils/functions/fetchWithRetry.js`);
const {
  AUTH,
  CONTRACT_ADDRESS,
  MINT_TO_ADDRESS,
  CHAIN,
  LIMIT,
  INTERVAL,
  REVEAL_PROMPT
} = require(`${basePath}/src/config.js`);
const _limit = RateLimit(LIMIT);
let [START, END] = process.argv.slice(2);

if(CHAIN === 'rinkeby') {
  console.log('Rinkeby is not supported for checking ownership of NFTs.');
  process.exit(1);
}

const ownedNFTs = [];

if (!fs.existsSync(path.join(`${basePath}/build`, "/revealed"))) {
  fs.mkdirSync(path.join(`${basePath}/build`, "revealed"));
}

async function checkOwnedNFTs() {
  try {
    let page = 1;
    let lastPage = 1;
    let url = `https://api.nftport.xyz/v0/accounts/${MINT_TO_ADDRESS}?chain=${CHAIN.toLowerCase()}&page_number=`;
    let options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH,
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

  reveal();
}

async function reveal() {
  console.log(`Found ${ownedNFTs.length} owned NFTs.`);
  console.log(`Revealing unowned NFTs...`);
  const ipfsMetas = JSON.parse(
    fs.readFileSync(`${basePath}/build/ipfsMetas/_ipfsMetas.json`)
  );
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
    if (!ownedNFTs.includes(edition)) {
      const revealedFilePath = `${basePath}/build/revealed/${edition}.json`;
      try {
        fs.accessSync(revealedFilePath);
        const revealedFile = fs.readFileSync(revealedFilePath);
        if (revealedFile.length > 0) {
          const revealedFileJson = JSON.parse(revealedFile);
          if (revealedFileJson.updateData.response !== "OK")
            throw "not revealed";
          console.log(`${meta.name} already revealed`);
        } else {
          throw "not revealed";
        }
      } catch (err) {
        let  ok = true;
        if (REVEAL_PROMPT) {
          ok = await yesno({
            question: `Reveal ${meta.name}?`,
            default: null,
          });
        }
        if (ok) {
          try {
            let url = "https://api.nftport.xyz/v0/mints/customizable";

            const updateInfo = {
              chain: CHAIN.toLowerCase(),
              contract_address: CONTRACT_ADDRESS,
              metadata_uri: meta.metadata_uri,
              token_id: meta.custom_fields.edition,
            };

            await _limit();

            let updateData = await fetchWithRetry(
              JSON.stringify(updateInfo),
              url,
              "PUT"
            );

            console.log(`Updated transaction created: ${meta.name}`);

            const combinedData = {
              metaData: meta,
              updateData: updateData,
            };
            fs.writeFileSync(
              `${basePath}/build/revealed/${meta.custom_fields.edition}.json`,
              JSON.stringify(combinedData, null, 2)
            );
            console.log(`Updated: ${meta.name}`);
          } catch (err) {
            console.log(err);
          }
        }
      }
    }
  }
  if (!START) {
    console.log(
      `Done revealing! Will run again in ${INTERVAL / 1000 / 60} minutes`
    );
  }
}

if (START) {
  reveal();
} else {
  setInterval(checkOwnedNFTs, INTERVAL);
  checkOwnedNFTs();
}
