const fetch = require("node-fetch");
const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");

const AUTH = 'YOUR API KEY HERE';
const CONTRACT_ADDRESS = 'YOUR CONTRACT ADDRESS HERE';
const MINT_TO_ADDRESS = 'YOUR WALLET ADDRESS HERE';
const CHAIN = 'rinkeby';

const ipfsMetas = JSON.parse(
  fs.readFileSync(`${basePath}/build/json/_ipfsMetas.json`)
);

fs.writeFileSync(`${basePath}/build/minted.json`, "");
const writter = fs.createWriteStream(`${basePath}/build/minted.json`, {
  flags: "a",
});
writter.write("[");
nftCount = ipfsMetas.length;

ipfsMetas.forEach((meta) => {
  let url = "https://api.nftport.xyz/v0/mints/customizable";

  const mintInfo = {
    chain: CHAIN,
    contract_address: CONTRACT_ADDRESS,
    metadata_uri: meta.metadata_uri,
    mint_to_address: MINT_TO_ADDRESS,
    token_id: meta.custom_fields.edition,
  };

  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH,
    },
    body: JSON.stringify(mintInfo),
  };

  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      writter.write(JSON.stringify(json, null, 2));
      nftCount--;

      if (nftCount === 0) {
        writter.write("]");
        writter.end();
      } else {
        writter.write(",\n");
      }

      console.log(`Minted: ${json.transaction_external_url}`);
    })
    .catch((err) => console.error("error:" + err));
});
