"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
async function getBaiwangUrl(url) {
    let downloadUrl;
    const browser = await puppeteer_1.default.launch({
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
exports.default = {
    path: "baiwang.com",
    resolver: getBaiwangUrl,
};
