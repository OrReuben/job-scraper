const puppeteer = require("puppeteer");

const scrapingKeywords = [
  "Fullstack",
  "React",
  "Frontend",
  "Backend",
  "CSS",
  "HTML",
  "Typescript",
  "Node",
  "Javascript",
];

const launchBrowser = async () => {
  return await puppeteer.launch({ headless: false });
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
  const regex1 =
    /(?:(?<=\s)|^)(?:3|4|5|6|7|שלוש|ארבע|חמש|שש|שבע)(?:(?=\s)|$)|(?:(?<=\D)|^)[3-7](?:(?=\D)|$)/;
  const regex2 =
    /(?:(?<=\s)|^)(?:2|two|שנתיים|שתי|שני)(?:(?=\s)|$)|(?:(?<=\D)|^)[2-2](?:(?=\D)|$)/;
  const regex3 =
    /(?:(?<=\s)|^)(?:1|0|שנה|שנת|one)(?:(?=\s)|$)|(?:(?<=\D)|^)[0-1](?:(?=\D)|$)/;
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

const filterUniqueLinks = (jobData) => {
  const uniqueLinks = new Set();
  return jobData.filter(({ link }) => {
    if (!uniqueLinks.has(link)) {
      uniqueLinks.add(link);
      return true;
    }
    return false;
  });
};

module.exports = {
  launchBrowser,
  navigateToPage,
  searchForKeyword,
  closePopupIfExists,
  filterJobData,
  filterUniqueLinks,
  scrapingKeywords,
};
