const fetch = require("node-fetch");

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");

const AUTH = 'YOUR API KEY HERE';

fs.writeFileSync(`${basePath}/build/json/_ipfsMetas.json`, "");
const writter = fs.createWriteStream(`${basePath}/build/json/_ipfsMetas.json`, {
  flags: "a",
});
writter.write("[");
const readDir = `${basePath}/build/json`;
fileCount = fs.readdirSync(readDir).length - 2;

fs.readdirSync(readDir).forEach((file) => {
  if (file === "_metadata.json" || file === "_ipfsMetas.json") return;

  const jsonFile = fs.readFileSync(`${readDir}/${file}`);

  let url = "https://api.nftport.xyz/v0/metadata";
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH,
    },
    body: jsonFile,
  };

  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      writter.write(JSON.stringify(json, null, 2));
      fileCount--;

      if (fileCount === 0) {
        writter.write("]");
        writter.end();
      } else {
        writter.write(",\n");
      }

      console.log(`${json.name} metadata uploaded & added to _ipfsMetas.json`);
    })
    .catch((err) => console.error("error:" + err));
});
