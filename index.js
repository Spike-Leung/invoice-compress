const { readFile } = require("fs/promises");
const fs = require("fs");
const jsdom = require("jsdom");
const smp = require("mailParser").simpleParser;
const URL = require("url").URL;
const http = require("http");
const https = require("https");
const { JSDOM } = jsdom;
const handleBaiwangUrl = require("./adapter/baiwang");
const COMMON_REQUSET_OPTIONS = {
  headers: { "Content-Type": "application/pdf" },
};

readFile("./temp/mail.xml", "utf8").then((data) => {
  const mailPaths = [...data.matchAll(/<path>(.*)<\/path>/g)].map(
    ([_, path]) => path
  );

  const promises = [];

  mailPaths.forEach(async (mailPath) =>
    promises.push(resolveMailPdfLink(mailPath))
  );

  Promise.all(promises).then((rawLinks) => {
    const links = [...new Set(rawLinks.flat())];

    links.forEach((l, index) => {
      const isHttp = l.indexOf("https") === -1;
      download(l, "./pdf/" + index + ".pdf", isHttp);
    });
  });
});

async function resolveMailPdfLink(mailPath) {
  return readFile(mailPath, "utf8").then(async (mail) => {
    let { html } = await smp(mail);
    let links = [];
    const dom = new JSDOM(html);
    const anchors = dom.window.document.querySelectorAll("a");

    anchors.forEach((a) => {
      if (a.href.trim() !== "") {
        const url = new URL(a.href);
        const activeLink = filterExcludeLinks(url.href);
        const hasPathName = url.pathname !== "/";

        if (activeLink && hasPathName) {
          links.push(a.href);
        }
      }
    });
    return links;
  });
}

/**
 * @param {string} url
 * @return {boolean} if url match exclude keyword, return false; Else return true
 */
function filterExcludeLinks(url) {
  return ["ad.", "adv.", "pdf/view", "apissp.fapiao.com/pz"].every(
    (w) => url.indexOf(w) === -1
  );
}

function download(url, dest, isHttp) {
  isHttp ? downloadByHttp(url, dest) : downloadByHttps(url, dest);
}

function downloadByHttp(url, dest) {
  const file = fs.createWriteStream(dest);

  http
    .get(url, COMMON_REQUSET_OPTIONS, function (response) {
      response.pipe(file);
    })
    .on("error", function (err) {
      console.log({ error: err });
    });
}

function downloadByHttps(url, dest) {
  const file = fs.createWriteStream(dest);

  https
    .get(url, COMMON_REQUSET_OPTIONS, async function (response) {
      const { statusCode } = response;

      if (url.indexOf("baiwang.com") !== -1) {
        handleHttpsBaiWang(url, dest);
        return;
      }

      if (statusCode === 302) {
        const { location } = response.headers;
        handleHttpsRedirectUrl(location, dest);
        return;
      }

      response.pipe(file);
    })
    .on("error", function (err) {
      console.log({ error: err });
    });
}

async function handleHttpsBaiWang(url, dest) {
  const pdfUrl = await handleBaiwangUrl(url);

  https
    .get(pdfUrl, COMMON_REQUSET_OPTIONS, function (response) {
      const file = fs.createWriteStream(dest);
      response.pipe(file);
    })
    .on("error", (error) => {
      console.log(error);
    });
}

function handleHttpsRedirectUrl(url, dest) {
  const file = fs.createWriteStream(dest);

  https
    .get(url, COMMON_REQUSET_OPTIONS, function (response) {
      response.pipe(file);
    })
    .on("error", (error) => {
      console.log(error);
    });
}
