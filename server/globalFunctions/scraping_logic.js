const puppeteer = require("puppeteer");
const { retryFunction } = require("./retryFunction");
const { scrollPageToBottom } = require('puppeteer-autoscroll-down');

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
  return await puppeteer.launch({ headless: 'new', timeout: 90000, defaultViewport:{height:1080, width:1920}});
};

const setDefaultPageParams = (page) => {
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(90000);
};

const navigateToPage = async (page, link) => {
  await page.goto(link, { waitUntil: "domcontentloaded" });
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
  const titleRegex = /(?:senior|ראש|סניור|בוגר|מומחה|מנהל|הנדסאי|team|lead|manager|expert)/i;

  const numberRegex = /(?<!angular\s)\b(?:[3-9]|1[0-5])\b/i;

  const wordRegex =
    /(?:שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|three|four|five|six|seven|eight|nine)/i;

  const educationRegex = /(?:תואר|ניהולי|ראש|degree|bachelors|academic|academy|השכלה|bsc)/i;

  const twoYearsRegex =
    /(?:(?<=\s)|^)(?:2|two|שנתיים|שתי|שני)(?:(?=\s)|$)|(?:(?<=\D)|^)[2-2](?:(?=\D)|$)/i;

  const oneYearRegex =
    /(?:(?<=\s)|^)(?:1|0|שנה|שנת|one)(?:(?=\s)|$)|(?:(?<=\D)|^)[0-1](?:(?=\D)|$)/i;

  const noNumbersRegex = /\d/;

  return jobData.filter(({ requirements, description, title, ID }) => {
    if (titleRegex.test(title)) {
      return false;
    }
    if (numberRegex.test(requirements) || wordRegex.test(requirements)) {
      return false;
    }
    if (educationRegex.test(requirements) || educationRegex.test(description)) {
      return false;
    }
    if (twoYearsRegex.test(requirements)) {
      return oneYearRegex.test(requirements) || oneYearRegex.test(description);
    }
    if (oneYearRegex.test(requirements) || oneYearRegex.test(description)) {
      return true;
    }
    return !noNumbersRegex.test(requirements);
  });
};

const filterUniqueJobsByID = (jobData) => {
  const uniqueLinks = new Set();
  return jobData.filter(({ ID }) => {
    if (!uniqueLinks.has(ID)) {
      uniqueLinks.add(ID);
      return true;
    }
    return false;
  });
};

const getTotalPages = async (page, selector, itemsPerPage, index = 0) => {
  const pageCountEl = await page.$(selector);
  const pageCountRaw = await page.evaluate((el) => el.textContent, pageCountEl);
  const numberRegex = /\d+/g;
  const matchedNumbers = pageCountRaw.match(numberRegex);
  const pageCount = matchedNumbers ? Number(matchedNumbers[index]) : 0;
  return Math.ceil(pageCount / itemsPerPage);
};

const processKeyword = async (
  page,
  keyword,
  totalPages = null,
  processPages
) => {
  try {
    const keywordJobData = await retryFunction(
      () => processPages(page, keyword, totalPages),
      3,
      keyword
    );
    return keywordJobData;
  } catch (err) {
    console.log(
      `Failed to process keyword ${keyword} after 3 retries: ${err.message}`
    );
    return [];
  }
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}

module.exports = {
  launchBrowser,
  navigateToPage,
  searchForKeyword,
  closePopupIfExists,
  filterJobData,
  filterUniqueJobsByID,
  getTotalPages,
  setDefaultPageParams,
  processKeyword,
  autoScroll,
  SCRAPING_KEYWORDS,
};
