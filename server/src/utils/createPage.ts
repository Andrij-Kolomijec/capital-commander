import puppeteer from "puppeteer-extra";
import UserAgent from "user-agents";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { type Browser, type Page } from "puppeteer";

puppeteer.use(StealthPlugin()).use(AdblockerPlugin());

export default async function createPage(
  browser: Browser,
  url: string
): Promise<Page> {
  const userAgent = new UserAgent();

  const page = await browser.newPage();

  await page.setViewport({
    width: 1920 + Math.floor(Math.random() * 100),
    height: 3000 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });

  await page.setUserAgent(userAgent.random().toString());

  const navigationPromise = page.waitForNavigation({
    waitUntil: "domcontentloaded",
  });

  //Skip images/styles/fonts loading for performance
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (
      req.resourceType() == "stylesheet" ||
      req.resourceType() == "font" ||
      req.resourceType() == "image"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(
    (url.includes("financials") || url.includes("term/pettm/")
      ? process.env.GURUFOCUS
      : process.env.MACROTRENDS) + url,
    {
      waitUntil: "domcontentloaded",
    }
  );

  await navigationPromise;

  return page;
}
