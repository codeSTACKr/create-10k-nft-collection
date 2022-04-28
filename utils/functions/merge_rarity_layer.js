const basePath = process.cwd();
const fs = require("fs");

const files = fs.readdirSync(`${basePath}/build/images`);
for (let i = 0; i < files.length; i++) {
  if (files[i].includes("_")) {
    const filename = `${basePath}/build/images/${files[i]}`
    fs.renameSync(filename, filename.replace("_", ""));
  }
}
