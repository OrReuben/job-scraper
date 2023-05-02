const puppeteer = require("puppeteer");

const SCRAPING_KEYWORDS = [
  "Fullstack",
  "React",
  "Frontend",
  "Backend",
  "CSS",
  "HTML",
  "Typescript",
  "Node",
  "Javascript",
  "Angular",
  "SQL",
  "MongoDB",
  "Python",
];

const launchBrowser = async () => {
  return await puppeteer.launch({ headless: true });
};

const navigateToPage = async (page, link) => {
  await page.goto(link);
};

const searchForKeyword = async (page, keyword, selectors) => {
  await page.type(selectors.selectorInput, keyword);
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
    /(?:(?<=\s)|^)(?:3|4|5|6|7|8|9|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע)(?:(?=\s)|$)|(?:(?<=\D)|^)[3-9](?:(?=\D)|$)/;
  const regex2 =
    /(?:(?<=\s)|^)(?:2|two|שנתיים|שתי|שני)(?:(?=\s)|$)|(?:(?<=\D)|^)[2-2](?:(?=\D)|$)/;
  const regex3 =
    /(?:(?<=\s)|^)(?:1|0|שנה|שנת|one)(?:(?=\s)|$)|(?:(?<=\D)|^)[0-1](?:(?=\D)|$)/;
  const regex4 = /\d/;

  return jobData.filter(({ requirements, description }) => {
    if (regex1.test(requirements) || regex1.test(description)) {
      return false;
    }
    if (regex2.test(requirements) || regex2.test(description)) {
      return regex3.test(requirements);
    }
    if (regex3.test(requirements) || regex3.test(description)) {
      return true;
    }
    return !regex4.test(requirements);
  });
};

const filterUniqueLinks = (jobData) => {
  const uniqueLinks = new Set();
  return jobData.filter(({ ID }) => {
    if (!uniqueLinks.has(ID)) {
      uniqueLinks.add(ID);
      return true;
    }
    return false;
  });
};

const getTotalPages = async (page, selector, itemsPerPage) => {
  const pageCountEl = await page.$(selector);
  const pageCountRaw = await page.evaluate((el) => el.textContent, pageCountEl);
  const numberRegex = /\d+/g;
  const matchedNumbers = pageCountRaw.match(numberRegex);
  const pageCount = matchedNumbers ? Number(matchedNumbers[0]) : 0;
  return Math.ceil(pageCount / itemsPerPage);
};

module.exports = {
  launchBrowser,
  navigateToPage,
  searchForKeyword,
  closePopupIfExists,
  filterJobData,
  filterUniqueLinks,
  getTotalPages,
  SCRAPING_KEYWORDS,
};
