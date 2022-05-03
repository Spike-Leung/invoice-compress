const puppeteer = require("puppeteer");

async function getBaiwangUrl(url) {
  let downloadUrl;

  const browser = await puppeteer.launch({
    product: "firefox",
  });
  const page = await browser.newPage();
  await page.goto(url);

  const [_, page2] = await browser.pages();
  await page2.waitForSelector(".btn-web");
  await page2.click(".btn-web");
  await page2.waitForTimeout(4000);

  const [_1, _2, page3] = await browser.pages();
  downloadUrl = await page3.url();

  await browser.close();
  return downloadUrl;
}

module.exports = getBaiwangUrl;
