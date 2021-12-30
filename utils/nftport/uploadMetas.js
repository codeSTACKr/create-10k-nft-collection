const fetch = require("node-fetch");
const basePath = process.cwd();
const fs = require("fs");
const readDir = `${basePath}/build/json`;

const AUTH = 'YOUR API KEY HERE';
const TIMEOUT = 1000; // Milliseconds. Extend this if needed to wait for each upload. 1000 = 1 second.

const allMetadata = [];

async function main() {
  const ipfsMetasFile = `${basePath}/build/json/_ipfsMetas.json`;
  fs.access(ipfsMetasFile, fs.F_OK, async (err) => {
    if (err) {
      fs.writeFileSync(ipfsMetasFile, "[]")
    }
  
    const ipfsMetas = JSON.parse(fs.readFileSync(ipfsMetasFile));
    const files = fs.readdirSync(readDir);
    files.sort(function(a, b){
      return a.split(".")[0] - b.split(".")[0];
    });
    for (const file of files) {
      if (file !== "_metadata.json" && file !== "_ipfsMetas.json") {
        let jsonFile = fs.readFileSync(`${readDir}/${file}`);
        let metaData = JSON.parse(jsonFile);
  
        const uploadedMeta = ipfsMetas.find(item => {
          return item.custom_fields.edition === metaData.custom_fields.edition;
        })
  
        if(!uploadedMeta) {
          try {
            const response = await fetchWithRetry(jsonFile);
            allMetadata.push(response);
            console.log(`${response.name} metadata uploaded!`);
          } catch(err) {
            console.log(`Catch: ${err}`)
          }
        } else {
          allMetadata.push(uploadedMeta);
          console.log(`${uploadedMeta.name} metadata already uploaded`);
        }
      }
    }
    fs.writeFileSync(
      `${basePath}/build/json/_ipfsMetas.json`,
      JSON.stringify(allMetadata, null, 2)
    );
  })
}

main();

function timer(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function fetchWithRetry(file)  {
  await timer(TIMEOUT);
  return new Promise((resolve, reject) => {
    const fetch_retry = (_file) => {
      let url = "https://api.nftport.xyz/v0/metadata";
      let options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH,
        },
        body: _file,
      };

      return fetch(url, options).then(async (res) => {
          const status = res.status;

          if(status === 200) {
            return res.json();
          }            
          else {
            console.error(`ERROR STATUS: ${status}`)
            console.log('Retrying')
            await timer(TIMEOUT)
            fetch_retry(_file)
          }            
      })
      .then(async (json) => {
        if(json.response === "OK"){
          return resolve(json);
        } else {
          console.error(`NOK: ${json.error}`)
          console.log('Retrying')
          await timer(TIMEOUT)
          fetch_retry(_file)
        }
      })
      .catch(async (error) => {  
        console.error(`CATCH ERROR: ${error}`)  
        console.log('Retrying')    
        await timer(TIMEOUT)    
        fetch_retry(_file)
      });
    }        
    return fetch_retry(file);
  });
}
