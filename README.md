# Create An ENTIRE NFT Collection (10,000+) & MINT

## Table of Contents

- [RESOURCES](#resources)
- [COMMANDS](#commands)
- [UPDATES & FIXES](#updates--fixes)

## RESOURCES

Original Video: 

👴 [How To Create An ENTIRE NFT Collection (10,000+) & MINT In Under 1 Hour Without Coding Knowledge](https://youtu.be/AaCgydeMu64)

(WATCH THIS ONE!) Updated video for v2.0.0 release: 

🌟 [How To Create An ENTIRE NFT Collection (10,000+) & MINT with ZERO Coding Knowledge v2.0](https://youtu.be/quGdJweadFM)

How to automate listing for sale on OpenSea: 

💰 [How To List & Reveal An ENTIRE NFT Collection (10,000+) Without Coding Knowledge on OpenSea](https://youtu.be/Iy1n_LxUwZs)

Original video code: [v0.1.0-alpha](https://github.com/codeSTACKr/video-source-code-create-nft-collection/releases/tag/v0.1.0-alpha)

Base code is from [hashlips_art_engine](https://github.com/HashLips/hashlips_art_engine)

Minting uses [NFTPort](https://nftport.xyz)

Join the Discord server for more help from the community: [codeSTACKr Discord](https://discord.gg/A9CnsVzzkZ)

The macro script from the "listing for sale" video: [macro1.mmmacro](macro1.mmmacro)

UPDATE: Added rarity calculator. See this [video](https://youtu.be/Uz1y4j9gvP8) for the walkthrough.

## COMMANDS

Generate: 
```
$ npm run generate
```
- Generates unique images based on the layers in the `layers` folder.
- WARNING: This command deletes the `build` folder if it exists!

Rarity (Hashlips): 
```
$ npm run rarity
```
- Calculates the rarity of NFT properties based on layer files.

Rarity (codeSTACKr): 
```
$ npm run rarity_md
```

- Calculates the rarity of NFT properties based on metadata.

Rarity Rank (codeSTACKr): 
```
$ npm run rarity_rank
```

- Provides ranking details through a user interface after calculating using the codeSTACKr Rarity command.

Update Info: 
```
$ npm run update_info
```

- Allows you to update `namePrefix`, `description`, and/or `baseUri` for metadata after it was already generated.

Create Generic Metadata: 
```
$ npm run create_generic
```

- Creates generic metadata using the settings from the `src/config.js` file.

Upload Files/Images: 
```
$ npm run upload_files
```

- Uploads all files in the `build/images` folder.

Upload Metadata: 
```
$ npm run upload_metadata
```

- Uploads all `.json` files in both the `build/json` folder and, if it exists, the `build/genericJson` folder as well. 

Deploy Contract: 
```
$ npm run deploy_contract
```

- Deploys a contract to the blockchain using the settings from the `src/config.js` file.

Get Contract: 
```
$ npm run get_contract
```

- Gets the deployed contract details using the transactions hash from the Deploy Contract command. 

Mint: 
```
$ npm run mint
```

- Running this command with no flags will mint all NFTs
- `--start=1`
  - The start flag indicates the edition number to start minting from.
- `--end=100`
  - The end flag indicates the edition number to stop at.
- To start at a number and continue minting all, do not include the end flag.
- Make both flags the same number to only mint a single NFT.
- NOTE: The start and end numbers are inclusive.

Reveal: 
```
$ npm run reveal
```

- Checks the contract owners wallet to see which NFTs have sold and reveals all sold NFTs.
- Including the `--start=1` and/or `--end=100` flags will reveal only the specified edition or range of editions.
- Make both flags the same number to only reveal a single NFT.

Check Transactions: 
```
$ npm run check_txns --dir=minted
```

- Verifies the success of mint or reveal transactions.
- The `--dir` flag is required. Accepted values are `minted` or `revealed`.

Refresh OpenSea: 
```
$ npm run refresh_os --start=1 --end=100
```

- Refreshes the listing for the specified editions on OpenSea.
- Both the `--start` and `--end` flags are required.

## UPDATES & FIXES

### npm not recognized

You have not installed [node.js](https://nodejs.org) properly (* and or if you're using a M1 on macs you'll need to downgrade your current version of node.js to v14 for it to work*). Be sure to follow the installation instructions from their download page for your specific operating system. And restart your computer after installation. 

For Mac M1 users, see this issue for more details: [Hashlips Art Engine - Issue 812](https://github.com/HashLips/hashlips_art_engine/issues/812)

### Images not lining up

Be sure that every layer is the same size. If you want the resulting image to be 512x512, then each layer needs to be 512x512. This will ensure that everything lines up properly.

### Only the last image shows up

This is because you are not using `.png` images. `.jpg` or any other type will not work. `.png` has transparency which means there is no background and things behind it will show through. 

### ES Module Error \[ERR_REQUIRE_ESM\]

If you are following along with the tutorial you will run into this issue unfortunately. 

When the tutorial was created, `node-fetch` was at version 2. It was recently updated to version 3 and no longer supports the `require` syntax. 

Fortunately, it's an easy fix. Just type these commands into the terminal:

- `npm uninstall node-fetch`
- `npm install node-fetch@2`

### Any sort of "path" error

Ensure that your layer names in the `config.js` file match exactly to your layer folder names. Also, remove any `-` (hyphens) from your file names.

### "Quota Limit Reached" or "Too many requests" errors

There have been some changes made to the code from the original video resulting from some errors when uploading files, metadata, and minting using NFTPort. Depending on your plan, Free vs Community, there are rate limits.

To fix these issues, I've updated the code to include a timeout that will allow the files to be uploaded at a slower rate, instead of all at once, eliminating these errors.

If you've reached your quota limit, contact NFTPort to upgrade your plan to get more. 

**To use this code:**

- Clone this repo or download the latest release zip file.
- Unzip, if needed, and open the folder in VS Code.
- From the terminal type: 
  - `npm install`
- Copy your image layers into the `layers` folder.
- Use the `src/config.js` file to set up your layers and NFT information.

## Reference the [video](https://youtu.be/quGdJweadFM) for more details.
