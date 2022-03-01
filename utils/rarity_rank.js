const basePath = process.cwd();
const fs = require("fs");

// initialize readline to prompt user for input
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

(async () => {
  try {
    // read json data
    const rawdata = fs.readFileSync(
      `${basePath}/build/json/_metadata_with_rarity.json`
    );
    const nfts = JSON.parse(rawdata);

    // prompt user to choose how to list nfts
    // 1. get top ## nfts
    // 2. get a specific nft by edition
    const choice = await prompt(
      "Enter 1 to get top ## NFTs by rarity or 2 to get a specific NFTs rarity: "
    );

    if (choice === "1") {
      const top = await prompt("Enter the number of NFTs you want to get: ");
      const sortedNfts = nfts.sort(
        (a, b) => b.total_rarity_score - a.total_rarity_score
      );
      const topNfts = sortedNfts.slice(0, top);
      console.log(
        topNfts.map(({ rank, total_rarity_score, name }) => {
          return {
            name,
            rank,
            total_rarity_score,
          };
        })
      );
    } else if (choice === "2") {
      const nftEdition = await prompt("Enter the NFT Edition: ");
      const nft = nfts.find((nft) => nft.custom_fields.edition === +nftEdition);
      console.log({
        name: nft.name,
        rank: nft.rank,
        total_rarity_score: nft.total_rarity_score,
      });
    } else {
      console.log("Invalid choice. Enter either 1 or 2.");
    }
    
    // close readline
    rl.close();
  } catch (e) {
    console.error("unable to prompt", e);
  }
})();
