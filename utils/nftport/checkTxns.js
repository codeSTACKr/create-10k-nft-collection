const path = require("path");
const basePath = process.cwd();
const fs = require("fs");
const { txnCheck } = require(`${basePath}/utils/functions/txnCheck.js`);
const regex = new RegExp("^([0-9]+).json$");

let [dir] = process.argv.slice(2);
if(dir !== 'minted' || dir !== 'revealed') {
  console.log('Please specify the directory to check. Use "minted" or "revealed"');
  process.exit(1);
}

let success = [];
let failed = [];
let unknown = [];

async function main() {
  console.log("Checking transactions...");
  const files = fs.readdirSync(`${basePath}/build/${dir}`);
  files.sort(function(a, b){
    return a.split(".")[0] - b.split(".")[0];
  });
  for (const file of files) {
    try {
      if (regex.test(file)) {
        const edition = path.parse(file).name;
        let jsonFile = fs.readFileSync(`${basePath}/build/${dir}/${edition}.json`);
        let txnData = JSON.parse(jsonFile);
        if (
          txnData.mintData.response !== "OK" ||
          txnData.mintData.error !== null
        ) {
          failed.push(edition);
          console.log(
            `Edition #${edition}: Transaction failed`
          );
        } else {
          let check = await txnCheck(
            txnData.mintData.transaction_external_url
          );
          if (check === "Failed") {
            failed.push(edition);
            console.log(
              `Edition #${edition}: Transaction failed or not found.`
            );
          } else if (check === "Unknown") {
            unknown.push(edition);
            console.log(`Edition #${edition}: Transaction pending..`);
          } else if (check === "Success") {
            success.push(edition);
            console.log(`Edition #${edition}: Transaction success!`);
          }
        }
      }
    } catch (error) {
      console.log(`Catch: ${error}`);
    }
  }
  if(failed.length > 0) {
    console.log(`Failed Txn Count: ${failed.length}`);
    console.log(`Failed Txns: ${failed}`);
  } else if (unknown.length > 0) {
    console.log(`Unknown Txn Count: ${unknown.length}`);
    console.log(`Unknown Txns: ${unknown}`);
    console.log(`There are some transactions pending.`);
  } else if (success.length > 0) {
    console.log(`Successful Txn Count: ${success}`);
  }
}