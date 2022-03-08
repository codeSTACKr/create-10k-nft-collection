const path = require("path");
const basePath = process.cwd();
const fs = require("fs");

const { RateLimit } = require("async-sema");
const { fetchWithRetry } = require(`${basePath}/utils/functions/fetchWithRetry.js`);

const { LIMIT, GENERIC } = require(`${basePath}/src/config.js`);
const _limit = RateLimit(LIMIT);

const regex = new RegExp("^([0-9]+).json$");
let genericUploaded = false;

if (!fs.existsSync(path.join(`${basePath}/build`, "/ipfsMetas"))) {
  fs.mkdirSync(path.join(`${basePath}/build`, "ipfsMetas"));
}

let readDir = `${basePath}/build/json`;
let writeDir = `${basePath}/build/ipfsMetas`;

async function main() {
  console.log(`Starting upload of ${GENERIC ? genericUploaded ? 'generic ' : '' : ''}metadata...`);
  const allMetadata = [];
  const files = fs.readdirSync(readDir);
  files.sort(function (a, b) {
    return a.split(".")[0] - b.split(".")[0];
  });
  for (const file of files) {
    if (regex.test(file)) {
      let jsonFile = fs.readFileSync(`${readDir}/${file}`);
      let metaData = JSON.parse(jsonFile);
      const uploadedMeta = `${writeDir}/${metaData.custom_fields.edition}.json`;

      try {
        fs.accessSync(uploadedMeta);
        const uploadedMetaFile = fs.readFileSync(uploadedMeta);
        if (uploadedMetaFile.length > 0) {
          const ipfsMeta = JSON.parse(uploadedMetaFile);
          if (ipfsMeta.response !== "OK") throw "metadata not uploaded";
          allMetadata.push(ipfsMeta);
          console.log(`${metaData.name} metadata already uploaded`);
        } else {
          throw "metadata not uploaded";
        }
      } catch (err) {
        try {
          await _limit();
          const url = "https://api.nftport.xyz/v0/metadata";
          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: jsonFile,
          };
          const response = await fetchWithRetry(url, options);
          allMetadata.push(response);
          fs.writeFileSync(uploadedMeta, JSON.stringify(response, null, 2));
          console.log(`${response.name} metadata uploaded!`);
        } catch (err) {
          console.log(`Catch: ${err}`);
        }
      }
    }
    fs.writeFileSync(
      `${writeDir}/_ipfsMetas.json`,
      JSON.stringify(allMetadata, null, 2)
    );
  }

  // Upload Generic Metadata if GENERIC is true
  if (GENERIC && !genericUploaded) {
    if (!fs.existsSync(path.join(`${basePath}/build`, "/ipfsMetasGeneric"))) {
      fs.mkdirSync(path.join(`${basePath}/build`, "ipfsMetasGeneric"));
    }
    readDir = `${basePath}/build/genericJson`;
    writeDir = `${basePath}/build/ipfsMetasGeneric`;
    
    genericUploaded = true;
    main();
  }
}

main();
