import { readFile } from "fs/promises";
import fs from "fs";
import jsdom from "jsdom";
import { simpleParser as smp } from "mailparser";
import { URL } from "url";
import { Parser } from "xml2js";
import http from "http";
import https from "https";
import adapters from "./adapter";

const xmlParser = new Parser();
const { JSDOM } = jsdom;
const COMMON_REQUSET_OPTIONS = {
  headers: { "Content-Type": "application/pdf" },
};

interface MailConfig {
  path: string;
  date: string;
  subject: string;
}

interface MailConfigWithDownloadLink {
  path: string;
  date: string;
  subject: string;
  links: string[];
}

readFile("./temp/mail.xml", "utf8").then((xml) => {
  xmlParser.parseStringPromise(xml).then((result) => {
    let data = [];

    data = result?.messages?.message?.map(
      ({ subject, date, path }: MailConfig) => {
        return {
          subject: subject[0],
          path: path[0],
          date: new Intl.DateTimeFormat("zh")
            .format(+date[0].padEnd(13, "0"))
            .split("/")
            .join("-"),
        };
      }
    );

    const promises: Promise<MailConfigWithDownloadLink>[] = [];

    data.forEach(async (mailConfig: MailConfig) =>
      promises.push(resolveMailPdfLink(mailConfig))
    );

    Promise.all(promises).then((results) => {
      results.forEach((r) => {
        const { links, subject, date } = r;
        const dest = `pdf/${date}_${subject}.pdf`;

        links.forEach((l) => {
          const isHttp = l.indexOf("https") === -1;
          download(l, dest, isHttp);
        });
      });
    });
  });
});

async function resolveMailPdfLink(
  mailConfig: MailConfig
): Promise<MailConfigWithDownloadLink> {
  const { path } = mailConfig;

  return readFile(path, "utf8").then(async (mail) => {
    let { html = "" } = await smp(mail);
    let links: string[] = [];
    const dom = new JSDOM(html as string);
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

    return {
      ...mailConfig,
      links: [...new Set(links)],
    };
  });
}

/**
 * If url match exclude keyword, return false; Else return true
 */
function filterExcludeLinks(url: string): boolean {
  return ["ad.", "adv.", "pdf/view", "apissp.fapiao.com/pz"].every(
    (w) => url.indexOf(w) === -1
  );
}

function download(url: string, dest: string, isHttp: boolean) {
  isHttp ? downloadByHttp(url, dest) : downloadByHttps(url, dest);
}

function downloadByHttp(url: string, dest: string) {
  const file = fs.createWriteStream(dest);

  http
    .get(url, COMMON_REQUSET_OPTIONS, async function(response) {
      const newUrl = await resolveDirectlyDownloadUrl(url, response);

      if (newUrl) {
        downloadWithNewUrlHttp(newUrl, dest);
        return;
      }

      response.pipe(file);
    })
    .on("error", function(err) {
      console.log({ error: err });
    });
}

function downloadByHttps(url: string, dest: string) {
  const file = fs.createWriteStream(dest);

  https
    .get(url, COMMON_REQUSET_OPTIONS, async function(response) {
      const newUrl = await resolveDirectlyDownloadUrl(url, response);

      if (newUrl) {
        downloadWithNewUrlHttps(newUrl, dest);
        return;
      }

      response.pipe(file);
    })
    .on("error", function(err) {
      console.log({ error: err });
    });
}

/**
 * @return {string} directly download url
 */
async function resolveDirectlyDownloadUrl(
  url: string,
  response: http.IncomingMessage
): Promise<string> {
  const { statusCode, headers } = response;

  for (const { path, resolver } of Object.values(adapters)) {
    if (url.indexOf(path) !== -1) {
      const newUrl = await resolver(url);
      return newUrl;
    }
  }

  if (statusCode === 302) {
    const { location } = headers;
    return location as string;
  }

  return "";
}

function downloadWithNewUrlHttp(url: string, dest: string): void {
  http
    .get(url, COMMON_REQUSET_OPTIONS, function(response) {
      const file = fs.createWriteStream(dest);
      response.pipe(file);
    })
    .on("error", (error) => {
      console.log(error);
    });
}

function downloadWithNewUrlHttps(url: string, dest: string): void {
  https
    .get(url, COMMON_REQUSET_OPTIONS, function(response) {
      const file = fs.createWriteStream(dest);
      response.pipe(file);
    })
    .on("error", (error) => {
      console.log(error);
    });
}
