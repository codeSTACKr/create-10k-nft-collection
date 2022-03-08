const path = require("path");
const basePath = process.cwd();
const fs = require("fs");
const { txnCheck } = require(`${basePath}/utils/functions/txnCheck.js`);
const regex = new RegExp("^([0-9]+).json$");

let [dir] = process.argv.slice(2);
const acceptedDirectories = ["minted", "revealed"];
if (!acceptedDirectories.includes(dir)) {
  console.log(
    'Please specify the directory to check. Use "minted" or "revealed"'
  );
  process.exit(1);
}

let success = [];
let failed = [];
let pending = [];
let unknown = [];

async function main() {
  console.log("Checking transactions...");
  const files = fs.readdirSync(`${basePath}/build/${dir}`);
  files.sort(function (a, b) {
    return a.split(".")[0] - b.split(".")[0];
  });
  for (const file of files) {
    try {
      if (regex.test(file)) {
        const edition = path.parse(file).name;
        let jsonFile = fs.readFileSync(
          `${basePath}/build/${dir}/${edition}.json`
        );
        let txnData = JSON.parse(jsonFile);
        const response =
          dir === "minted"
            ? txnData.mintData.response
            : txnData.updateData.response;
        const err =
          dir === "minted" ? txnData.mintData.error : txnData.updateData.error;
        const verified =
          dir === "minted"
            ? txnData.mintData.transaction_verified
            : txnData.updateData.transaction_verified;
        const txUrl =
          dir === "minted"
            ? txnData.mintData.transaction_external_url
            : txnData.updateData.transaction_external_url;

        if (response !== "OK" || err !== null) {
          failed.push(edition);
          console.log(`Edition #${edition}: Transaction failed`);
        } else if (verified === true) {
          success.push(edition);
          console.log(`Edition #${edition}: Transaction success!`);
        } else {
          let check = await txnCheck(txUrl);
          if (check === "Failed") {
            failed.push(edition);
            console.log(
              `Edition #${edition}: Transaction failed or not found.`
            );
          } else if (check.includes("Success")) {
            if (dir === "minted") {
              txnData.mintData.transaction_verified = true;
            } else if (dir === "revealed") {
              txnData.updateData.transaction_verified = true;
            }
            fs.writeFileSync(
              `${basePath}/build/${dir}/${edition}.json`,
              JSON.stringify(txnData, null, 2)
            );
            success.push(edition);
            console.log(`Edition #${edition}: Transaction success!`);
          } else if (check.includes("Pending")) {
            pending.push(edition);
            console.log(
              `Edition #${edition}: Transaction pending, check again in a few minutes..`
            );
          } else if (check.includes("Indexing")) {
            pending.push(edition);
            console.log(
              `Edition #${edition}: Transaction indexing, check again in a few minutes..`
            );
          } else {
            unknown.push(edition);
            console.log(
              `Edition #${edition}: Transaction unknown, please manually check Edition #${edition}`,
              `Directory: ${`${basePath}/build/${dir}/${edition}.json`}`,
              `Received: ${check}`
            );
          }
        }
      }
    } catch (error) {
      console.log(`Catch: ${error}`);
    }
  }
  console.log(`All transactions checked.`);
  if (failed.length > 0) {
    console.log(`Failed Txn Count: ${failed.length}`);
    console.log(`Failed Txns: ${failed}`);
  } else if (pending.length > 0) {
    console.log(`Pending Txn Count: ${pending.length}`);
    console.log(`Pending Txns: ${pending}`);
    console.log(`There are some transactions pending.`);
  } else if (unknown.length > 0) {
    console.log(`Unknown Txn Count: ${unknown.length}`);
    console.log(`Unknown Txns: ${unknown}`);
    console.log(`There are some unknown transaction statuses'.`);
  } else if (success.length > 0) {
    console.log(`Successful Txn Count: ${success.length}`);
  }
}

main();
