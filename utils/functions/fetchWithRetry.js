const basePath = process.cwd();
const fetch = require("node-fetch");
const { AUTH } = require(`${basePath}/src/config.js`);

function fetchWithRetry(url, options) {
  return new Promise((resolve, reject) => {
    const fetch_retry = () => {
      options.headers.Authorization = AUTH;

      return fetch(url, options)
        .then((res) => {
          const status = res.status;

          if (status === 200) {
            return res.json();
          } else {
            throw `ERROR STATUS: ${status}`;
          }
        })
        .then((json) => {
          if (json.response === "OK") {
            return resolve(json);
          } else {
            throw `NOK: ${json.error}`;
          }
        })
        .catch((error) => {
          console.error(`CATCH ERROR: ${error}`);
          console.log("Retrying");
          fetch_retry();
        });
    };
    return fetch_retry();
  });
}

module.exports = { fetchWithRetry };