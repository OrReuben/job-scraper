const puppeteer = require("puppeteer");

const scrapingKeywords = [
  "Fullstack",
  "ReactJS",
  "Frontend",
  "Backend",
  "CSS",
  "HTML",
  "Typescript",
  "NodeJS",
  "Javascript",
];

const launchBrowser = async () => {
  return await puppeteer.launch({ headless: true });
};

const navigateToPage = async (page, link) => {
  await page.goto(link);
};

const searchForKeyword = async (page, keyword, selectors) => {
  await page.type("#q", keyword);
  await Promise.all([
    page.waitForNavigation(),
    page.click(selectors.submitBtn),
  ]);
  await page.waitForSelector(selectors.selectorExists);
};

async function closePopupIfExists(page, closeButtonSelector) {
    try {
      if (page.isClosed()) {
        console.log("Page is closed, not attempting to close pop-up");
        return;
      }
  
      await page.waitForSelector(closeButtonSelector, {
        visible: true,
        timeout: 500,
      });
  
      const closeButton = await page.$(closeButtonSelector);
      if (closeButton) {
        await closeButton.click();
        console.log("Closed pop-up");
      }
    } catch (error) {
      if (error.name !== "TimeoutError") {
        console.log("Error closing pop-up:", error);
      }
    }
  }

  const filterJobData = (jobData) => {
    const regex1 = /(?:(?<=\s)|^)(?:3|4|5|6|7|שלוש|ארבע|חמש|שש|שבע)(?:(?=\s)|$)|(?:(?<=\D)|^)[3-7](?:(?=\D)|$)/;
    const regex2 =
      /(^|\W)(2|\u{05E9}\u{05E0}\u{05EA}\u{05D9}\u{05D9}\u{05DD}|two)($|\W)/iu;
    const regex3 = /(^|\W)(1|\u{05E9}\u{05E0}\u{05D4}|one)($|\W)/iu;
    const regex4 = /\d/;
  
    return jobData.filter(({ requirements }) => {
      if (regex1.test(requirements)) {
        return false;
      } else if (regex2.test(requirements)) {
        if (regex3.test(requirements)) {
          return true;
        }
        return false;
      } else if (regex3.test(requirements)) {
        return true;
      } else if (!regex4.test(requirements)) {
        return true;
      }
    });
  };

module.exports = { launchBrowser, navigateToPage, searchForKeyword, closePopupIfExists, filterJobData,  scrapingKeywords };
