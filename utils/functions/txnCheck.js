const fetch = require("node-fetch");

async function txnCheck(url) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    fetch(url, options)
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        if (
          text.toLowerCase().includes("search not found") ||
          text.toLowerCase().includes("</i>fail</span>") ||
          text.toLowerCase().includes("</i>failed</span>")
        ) {
          resolve('Failed');
        } else if (text.toLowerCase().includes("</i>success</span>")) {
          resolve('Success');
        } else {
          resolve('Unknown');
        }
      })
      .catch((err) => {
        console.error("error:" + err);
        reject(err);
      });
  });
}

module.exports = { txnCheck };
