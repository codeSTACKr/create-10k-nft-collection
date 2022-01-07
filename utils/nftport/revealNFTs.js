const fetch = require("node-fetch");
const path = require("path");
const basePath = process.cwd();
const fs = require("fs");

const AUTH = 'YOUR API KEY HERE';
const CONTRACT_ADDRESS = 'YOUR CONTRACT ADDRESS HERE';
const ACCOUNT_ADDRESS = 'METAMASK ACCOUNT THAT MINTED NFTs';
const CHAIN = 'rinkeby'; // Test: rinkeby, Real: polygon
const TIMEOUT = 1000; // Milliseconds. This a timeout for errors only. If there is an error, it will wait then try again. 5000 = 5 seconds.
const INTERVAL = 900000; // Milliseconds. This is the interval for it to check for sales and reveal the NFT. 900000 = 15 minutes.

const ownedNFTs = []

if (!fs.existsSync(path.join(`${basePath}/build`, "/revealed"))) {
  fs.mkdirSync(path.join(`${basePath}/build`, "revealed"));
}

async function checkOwnedNFTs() {
  let page = 1
  let lastPage = 1
  let url = `https://api.nftport.xyz/v0/accounts/${ACCOUNT_ADDRESS}?chain=${CHAIN}&page_number=`
  let options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH,
    }
  };

  let ownedNFTsData = await fetchWithRetry(`${url}${page}`, options)
  for(ownedNFT of ownedNFTsData.nfts) {
    if(ownedNFT.contract_address === CONTRACT_ADDRESS) {
      ownedNFTs.push(parseInt(ownedNFT.token_id))
    }
  }
  lastPage = Math.ceil(ownedNFTsData.total / 50)
  while(page < lastPage) {
    page++
    ownedNFTsData = await fetchWithRetry(`${url}${page}`, options)
    for(ownedNFT of ownedNFTsData.nfts) {
      if(ownedNFT.contract_address === CONTRACT_ADDRESS) {
        ownedNFTs.push(parseInt(ownedNFT.token_id))
      }
    }
  }

  reveal()
}

async function reveal() {
  const ipfsMetas = JSON.parse(
    fs.readFileSync(`${basePath}/build/ipfsMetas/_ipfsMetas.json`)
  );
  for (const meta of ipfsMetas) {
    const edition = meta.custom_fields.edition
    if(!ownedNFTs.includes(edition)) {
      const revealedFilePath = `${basePath}/build/revealed/${edition}.json`;
      try {
        fs.accessSync(revealedFilePath);
        const revealedFile = fs.readFileSync(revealedFilePath)
        if(revealedFile.length > 0) {
          const revealedFileJson = JSON.parse(revealedFile)
          if(revealedFileJson.updateData.response !== "OK") throw 'not revealed'
          console.log(`${meta.name} already revealed`);
        } else {
          throw 'not revealed'
        }
      } catch(err) {
        try {
          let url = "https://api.nftport.xyz/v0/mints/customizable";

          const updateInfo = {
            chain: CHAIN,
            contract_address: CONTRACT_ADDRESS,
            metadata_uri: meta.metadata_uri,
            token_id: meta.custom_fields.edition,
          };

          let options = {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: AUTH,
            },
            body: JSON.stringify(updateInfo),
          };
          let updateData = await fetchWithRetry(url, options, meta)
          console.log(`Updated: ${meta.name}`);
          const combinedData = {
            metaData: meta,
            updateData: updateData
          }
          writeMintData(meta.custom_fields.edition, combinedData)
        } catch(err) {
          console.log(err)
        }
      }
    }
  }
  console.log(`Done revealing! Will run again in ${(INTERVAL/1000)/60} minutes`)
}

async function fetchWithRetry(url, options, meta)  {
  return new Promise((resolve, reject) => {
    const fetch_retry = (_url, _options, _meta) => {
      
      return fetch(url, options).then(async (res) => {
        const status = res.status;

        if(status === 200) {
          return res.json();
        }            
        else {
          console.error(`ERROR STATUS: ${status}`)
          console.log('Retrying')
          await timer(TIMEOUT)
          fetch_retry(_url, _options, _meta)
        }            
      })
      .then(async (json) => {
        if(json.response === "OK"){
          return resolve(json);
        } else {
          console.error(`NOK: ${json.error}`)
          console.log('Retrying')
          await timer(TIMEOUT)
          fetch_retry(_url, _options, _meta)
        }
      })
      .catch(async (error) => {  
        console.error(`CATCH ERROR: ${error}`)  
        console.log('Retrying')    
        await timer(TIMEOUT)    
        fetch_retry(_url, _options, _meta)
      });
    }          
    return fetch_retry(url, options, meta);
  });
}

function timer(ms) {
  return new Promise(res => setTimeout(res, ms));
}

const writeMintData = (_edition, _data) => {
  fs.writeFileSync(`${basePath}/build/revealed/${_edition}.json`, JSON.stringify(_data, null, 2));
};

setInterval(checkOwnedNFTs, INTERVAL)
checkOwnedNFTs()