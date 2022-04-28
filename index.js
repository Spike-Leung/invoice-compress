const { readFile } = require("fs/promises");
const jsdom = require("jsdom");
const smp = require("mailParser").simpleParser;
const URL = require("url").URL;
const fs = require("fs");
const http = require("http");
const https = require("https");
const { JSDOM } = jsdom;

readFile("./temp/mail.xml", "utf8").then((data) => {
  const mailPaths = [...data.matchAll(/<path>(.*)<\/path>/g)].map(
    ([_, path]) => path
  );

  const linkSet = new Set();
  const promises = [];

  mailPaths.forEach(async (mailPath) => {
    promises.push(
      readFile(mailPath, "utf8").then(async (mail) => {
        let { html } = await smp(mail);
        const dom = new JSDOM(html);
        const anchors = dom.window.document.querySelectorAll("a");
        anchors.forEach((a) => {
          if (a.href.trim() !== "") {
            const url = new URL(a.href);
            const excludeLinkKeywords = [
              "ad.",
              "adv.",
              "pdf/view",
              "apissp.fapiao.com/pz",
            ];
            const activeLink = excludeLinkKeywords.every(
              (w) => url.href.indexOf(w) === -1
            );
            const hasPathName = url.pathname !== "/";

            if (activeLink && hasPathName) {
              linkSet.add(a.href);
            }
          }
        });
      })
    );
  });

  Promise.all(promises).then(() => {
    const links = [...linkSet];
    links.forEach((l, index) => {
      const isHttp = l.indexOf("https") === -1;
      download(l, "./pdf/" + index + ".pdf", isHttp);
    });
  });
});

var download = function (url, dest, isHttp) {
  var file = fs.createWriteStream(dest);
  if (isHttp) {
    http
      .get(
        url,
        { headers: { "Content-Type": "application/pdf" } },
        function (response) {
          response.pipe(file);
        }
      )
      .on("error", function (err) {
        console.log({ error: err });
      });
  } else {
    https
      .get(
        url,
        { headers: { "Content-Type": "application/pdf" } },
        function (response) {
          response.pipe(file);
        }
      )
      .on("error", function (err) {
        console.log({ error: err });
      });
  }
};
