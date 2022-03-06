const fetch = require("node-fetch");
const { AUTH } = require(`${basePath}/src/config.js`);

function fetchWithRetry(data, url, method) {
  return new Promise((resolve, reject) => {
    const fetch_retry = (_data) => {
      let options = {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH,
        },
        body: _data,
      };

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
          fetch_retry(_data);
        });
    };
    return fetch_retry(data);
  });
}

module.exports = { fetchWithRetry };