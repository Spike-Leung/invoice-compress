import puppeteer from "puppeteer";

async function getBaiwangUrl(url: string) {
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
  downloadUrl = page3.url();

  await browser.close();
  return downloadUrl;
}

export default {
  path: "pis.baiwang.com",
  resolver: getBaiwangUrl,
};
