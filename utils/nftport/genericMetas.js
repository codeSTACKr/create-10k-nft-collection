const path = require("path");
const basePath = process.cwd();
const fs = require("fs");
const buildDir = path.join(basePath, "/build");

const {
  GENERIC_TITLE,
  GENERIC_DESCRIPTION,
  GENERIC_IMAGE,
} = require(`${basePath}/src/config.js`);

if (!fs.existsSync(path.join(buildDir, "/genericJson"))) {
  fs.mkdirSync(path.join(buildDir, "/genericJson"));
}

let rawdata = fs.readFileSync(`${buildDir}/json/_metadata.json`);
let data = JSON.parse(rawdata);

console.log("Starting generic metadata creation.");

for (let item of data) {
  const genericImage = GENERIC_IMAGE[Math.floor(Math.random() * GENERIC_IMAGE.length)];
  item.name = `${GENERIC_TITLE} #${item.custom_fields.edition}`;
  item.description = GENERIC_DESCRIPTION;
  item.file_url = genericImage;
  item.image = genericImage;
  delete item.attributes;
  delete item.custom_fields.dna;

  fs.writeFileSync(
    `${buildDir}/genericJson/${item.custom_fields.edition}.json`,
    JSON.stringify(item, null, 2)
  );

  console.log(`${item.name} copied and updated!`);
}

fs.writeFileSync(
  `${buildDir}/genericJson/_metadata.json`,
  JSON.stringify(data, null, 2)
);

console.log("Generic metadata created!");