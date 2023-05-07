const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  navigateToPage,
  searchForKeyword,
  filterJobData,
  SCRAPING_KEYWORDS,
  filterUniqueLinks,
  getTotalPages,
  setDefaultPageParams,
  processKeyword,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");

const processPages = async (page, keyword, totalPages) => {
  const jobData = [];
  console.log(`SQLINK: Attempting to scrape the keyword: ${keyword}`);

  for (let index = 0; index < totalPages; index++) {
    await page.goto(
      `https://www.sqlink.com/career/searchresults/?page=${index + 1}`
    );

    await page.waitForSelector(".positionItem");
    const jobItems = await page.$$(".positionItem");

    for (const jobItem of jobItems) {
      const innerHTML = await (
        await jobItem.getProperty("innerHTML")
      ).jsonValue();
      const $ = cheerio.load(innerHTML);

      const title = $(".article a").text().trim();
      const link = $(".article a").attr("href");
      const location = "לא צוין";
      const type = "לא צוין";
      const jobIdText = $(".description.number").text().trim();
      const IdTest = /\d+/.exec(jobIdText);
      if (IdTest === null || IdTest[0] === undefined) {
        continue;
      }
      const ID = IdTest[0];
      const description = $(".description p")
        .text()
        .trim()
        .replace(/[\n\t]+/g, " ");
      const requirements = $(".requirements p + p")
        .text()
        .trim()
        .replace(/[\n\t]+/g, " ");

      const oneJobData = {
        keyword,
        title,
        location,
        type,
        link,
        description,
        requirements,
        ID,
      };
      jobData.push(oneJobData);
    }
  }
  console.log(`SQLINK: Successfully scraped the keyword: ${keyword}`);
  return jobData;
};

const scrapeSQLinkLogic = async () => {
  console.log(`SCRAPING SQLINK...`);
  const startingScriptTime = new Date().getTime();
  // const keywords = SCRAPING_KEYWORDS;
  const keywords = ["Fullstack"];
  const jobData = [];

  console.log("SQLINK: Opening up the browser...");
  const browser = await launchBrowser();

  try {
    console.log("SQLINK: Creating a new page..");
    const page = await browser.newPage();

    console.log("SQLINK: Setting default page settings..");
    setDefaultPageParams(page);

    page.on("dialog", async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.dismiss();
    });

    console.log("SQLINK: Navigating to page..");
    await navigateToPage(
      page,
      decodeURIComponent(
        "https://www.sqlink.com/career/%D7%A4%D7%99%D7%AA%D7%95%D7%97-%D7%AA%D7%95%D7%9B%D7%A0%D7%94-webmobile/"
      )
    );

    const maxRetries = 3;

    for (const keyword of keywords) {
      console.log(`SQLINK: Searching for the keyword: ${keyword} `);
      let searchSuccess = false;
      let searchAttempts = 0;

      while (!searchSuccess && searchAttempts < maxRetries) {
        try {
          await searchForKeyword(page, keyword, {
            selectorInput: ".searchInputText",
            submitBtn: "#searchButton",
            selectorExists: "#resultsDetails",
          });
          searchSuccess = true;
        } catch (err) {
          searchAttempts++;
          if (searchAttempts === maxRetries) {
            console.log(
              `Failed to search for keyword ${keyword} after ${maxRetries} retries: ${err.message}`
            );
            continue;
          }
        }
      }

      if (!searchSuccess) {
        continue;
      }

      console.log("SQLINK: Getting the amount of pages...");
      const totalPages = await getTotalPages(page, "#resultsDetails", 20);
      if (totalPages === null || totalPages === undefined) {
        continue;
      }

      console.log("SQLINK: Processing pages...");
      const keywordJobData = await processKeyword(page, keyword, totalPages, processPages);
      jobData.push(...keywordJobData);
    }

    console.log("SQLINK: Navigating to page..");
    await navigateToPage(page, "https://www.sqlink.com/career/web/");

    console.log("SQLINK: Clicking selectors..");
    await page.waitForSelector("#drop1");
    await page.click("#drop1");
    await page.evaluate(() => {
      const el = document.querySelector('label[for="radioAreas-7091"]');
      el.click();
    });

    await page.waitForSelector('label[for="checkboxProfessions-6082"]');

    await page.evaluate(() => {
      const selectors = [
        'label[for="checkboxProfessions-6082"]',
        'label[for="checkboxProfessions-6083"]',
        'label[for="checkboxProfessions-6764"]',
        'label[for="checkboxProfessions-2934"]',
        'label[for="checkboxProfessions-6871"]',
        'label[for="checkboxProfessions-1119"]',
      ];

      const elements = document.querySelectorAll(selectors.join(", "));
      elements.forEach((element) => element.click());
    });

    await Promise.all([page.waitForNavigation(), page.click("#searchButton")]);

    console.log("SQLINK: Getting the amount of pages...");
    const totalPages = await getTotalPages(page, "#resultsDetails", 20);

    console.log("SQLINK: Processing pages...");
    const keywordJobData = await processPages(
      page,
      "Web Developement",
      totalPages
    );
    jobData.push(...keywordJobData);

    const filteredJobs = await filterJobData(jobData);
    const uniqueFilteredJobs = await filterUniqueLinks(filteredJobs);

    await browser.close();

    await executeSheets(uniqueFilteredJobs, "SQLink");

    const endingScriptTime = new Date().getTime();
    const calculateToMinutes = Math.floor(
      (endingScriptTime - startingScriptTime) / 1000 / 60
    );
    console.log(`FINISHED SCRAPING SQLINK...`);

    return {
      jobDataLength: jobData.length,
      filteredJobsLength: uniqueFilteredJobs.length,
      operationTime: calculateToMinutes,
    };
  } catch (err) {
    console.log("Something went wrong.. " + err.message);
    browser.close();
    throw new Error();
  }
};

const scrapeSQLink = async (req, res) => {
  try {
    const result = await retryFunction(scrapeSQLinkLogic, 2);
    res.status(201).json(
      `Executed Successfully. 
        Scraped from: ${result.jobDataLength} jobs, 
        resulted in ${result.filteredJobsLength} jobs. 
        Operation took: ${result.operationTime} Minutes`
    );
    console.log(`Executed Successfully. 
    Scraped from: ${result.jobDataLength} jobs, 
    resulted in ${result.filteredJobsLength} jobs. 
    Operation took: ${result.operationTime} Minutes`);
  } catch (err) {
    res.status(500).json("Something went wrong: " + err.message);
  }
};

module.exports = { scrapeSQLink, scrapeSQLinkLogic };
