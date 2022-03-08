const basePath = process.cwd();
const fs = require("fs");

const getRarity = () => {
  // read json data
  const rawdata = fs.readFileSync(`${basePath}/build/json/_metadata.json`);
  const nfts = JSON.parse(rawdata);

  processRarity(nfts)
}

function processRarity(nfts) {
  const rarity = {}
  
  // loop through all nfts
  for(const nft of nfts) {
    // check if attributes exist
    if(nft?.attributes?.length > 0) {
      // loop through all attributes
      for(attribute of nft.attributes) {
        // add trait type to rarity object if it doesn't exist
        if(!rarity[attribute.trait_type]) {
          rarity[attribute.trait_type] = {}
        }
        // add attribute value to rarity object if it doesn't exist and set count to 0
        if(!rarity[attribute.trait_type][attribute.value]) {
          rarity[attribute.trait_type][attribute.value] = {
            count: 0
          }
        }
        // increment count of trait type
        rarity[attribute.trait_type][attribute.value].count++
        // add rarity score to rarity object for each trait type
        rarity[attribute.trait_type][attribute.value].rarityScore = (1 / (rarity[attribute.trait_type][attribute.value].count / nfts.length)).toFixed(2)
      }
    }
  }

  // create a total rarity score for each nft by adding up all the rarity scores for each trait type
  nfts.map(nft => {
    if(nft?.attributes?.length > 0) {
      let totalScore = 0;
      for(attribute of nft.attributes) {
        attribute.rarity_score = rarity[attribute.trait_type][attribute.value].rarityScore
        totalScore += parseFloat(attribute.rarity_score)
      }
      nft.total_rarity_score = +parseFloat(totalScore).toFixed(2)
    }
  })

  // sort nfts by total rarity score
  nfts.sort((a, b) => b.total_rarity_score - a.total_rarity_score)
  
  // add rank to nfts
  nfts.map((nft, index) => {
    nft.rank = index + 1
  })

  // sort nfts by edition again
  nfts.sort((a, b) => a.custom_fields.edition - b.custom_fields.edition)

  fs.writeFileSync(`${basePath}/build/json/_metadata_with_rarity.json`, JSON.stringify(nfts, null, 2));
}

getRarity();
