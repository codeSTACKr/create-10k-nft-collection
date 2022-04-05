const basePath = process.cwd();
const fs = require("fs");
const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);

const {
  offset_x,
  offset_y,
  rarity_thresholds,
} = require(`${basePath}/rarity_layer/config`);

const rarity_decals = rarity_thresholds.sort(
  (a, b) => b.threshold - a.threshold
);

(async () => {
  try {
    let rarity_decals = [];
    const decal_thresholds = rarity_thresholds.sort(
      (a, b) => b.threshold - a.threshold
    );
    for (let i = 0; i < decal_thresholds.length; i++) {
      rarity_decals.push({
        imageData: await loadImage(`${basePath}/rarity_layer/${decal_thresholds[i].image}`),
        threshold: decal_thresholds[i].threshold,
      });
    }

      if (!fs.existsSync(`${basePath}/build/json/_metadata_with_rarity.json`))
      throw new Error(
        "_metadata_with_rarity.json not found, please run `npm run rarity_md` first"
      );
    const startAt0 = fs.existsSync(`${basePath}/build/images/0.png`);
    if (!startAt0 && !fs.existsSync(`${basePath}/build/images/1.png`))
      throw new Error("no images found");
    // read json data
    const rawdata = fs.readFileSync(
      `${basePath}/build/json/_metadata_with_rarity.json`
    );
    const nfts = JSON.parse(rawdata);

    for (let i = startAt0 ? 0 : 1; i < nfts.length + (startAt0 ? 0 : 1); i++) {
      const nft = nfts[i - (startAt0 ? 0 : 1)];
      const rarity = nft.total_rarity_score;
      const imagePath = `${basePath}/build/images/${i}.png`;
      const image = await loadImage(imagePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      for (let j = 0; j < rarity_decals.length; j++) {
        if (rarity_decals[j].threshold < rarity) {
          ctx.drawImage(rarity_decals[j].imageData, offset_x, offset_y);
          break;
        }
      }
      const newImagePath = `${basePath}/build/images/${i}_.png`;
      canvas.toBuffer((err, buf) => {
        if (err) throw err;
        fs.writeFileSync(newImagePath, buf);
      });
    }
  } catch (e) {
    console.error("unable to complete", e);
  }
})();
