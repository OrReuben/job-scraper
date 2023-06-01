const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  navigateToPage,
  closePopupIfExists,
  filterJobData,
  SCRAPING_KEYWORDS,
  filterUniqueJobsByID,
  getTotalPages,
  setDefaultPageParams,
  processKeyword,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");
const { handleMongoActions } = require("../globalFunctions/mongoActions");

const processPages = async (page, keyword, totalPages) => {
  const jobData = [];
  console.log(`JOBMASTER: Attempting to scrape the keyword: ${keyword}`);
  for (let index = 0; index < totalPages; index++) {
    (index + 1) % 5 === 0 && console.log("JOBMASTER: +5 Pages scraped");

    await Promise.race([
      page.goto(
        `https://www.jobmaster.co.il/jobs/?currPage=${index + 1}&q=${keyword}`,
        { waitUntil: "domcontentloaded" }
      ),
      page.waitForFunction(() => {
        const jobItems = document.querySelectorAll(".JobItemRight");
        return jobItems.length === 10;
      }),
    ]);

    const jobItems = await page.$$(".JobItemRight");

    for (let i = 0; i < jobItems.length; i++) {
      const currentJobItems = await page.$$(".JobItemRight");
      await currentJobItems[i].click();

      try {
        await Promise.race([
          page.waitForSelector("#enterJob .jobNumStyle"),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000)
          ),
        ]);
      } catch (err) {
        if (err.message === "Timeout") {
          console.log(
            "Job item took too long to load, refreshing and skipping to the next item."
          );
          await page.reload();
          await page.waitForSelector(".JobItemRight");
          continue;
        } else {
          throw err;
        }
      }

      const pageData = await page.evaluate(() => {
        return {
          html: document.documentElement.innerHTML,
        };
      });
      const $ = cheerio.load(pageData.html);

      const title = $("#enterJob .jobHead__text .CardHeader").text().trim();
      const location = $("#enterJob .jobLocation").text().trim();
      const type = $("#enterJob .jobType").text().trim();
      const jobIdText = $("#enterJob .jobNumStyle").text().trim();
      const numberRegex = /\d+/g;
      const ID = jobIdText.match(numberRegex)[0];
      const link = `https://www.jobmaster.co.il/jobs/checknum.asp?key=${ID}`;
      const description = $("#jobFullDetails .jobDescription")
        .text()
        .trim()
        .replace(/[\n\t]+/g, " ");
      const requirements = $("#jobFullDetails .jobRequirements")
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
  console.log(`JOBMASTER: Successfully scraped the keyword: ${keyword}`);
  return jobData;
};

const scrapeJobmasterLogic = async () => {
  console.log(`SCRAPING JOBMASTER...`);

  const startingScriptTime = new Date().getTime();
  const keywords = SCRAPING_KEYWORDS;
  // const keywords = ["Fullstack"];
  const jobData = [];

  console.log("JOBMASTER: Opening up the browser...");
  const browser = await launchBrowser();
  try {
    console.log("JOBMASTER: Creating a new page..");
    const page = await browser.newPage();

    console.log("JOBMASTER: Setting default page settings..");
    setDefaultPageParams(page);

    page.on("dialog", async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.dismiss();
    });

    const maxRetries = 3;

    for (const keyword of keywords) {
      console.log("JOBMASTER: Navigating to page..");
      let navigateSuccess = false;
      let navigateAttempts = 0;

      while (!navigateSuccess && navigateAttempts < maxRetries) {
        try {
          await navigateToPage(
            page,
            `https://www.jobmaster.co.il/jobs/?currPage=1&q=${keyword}`
          );
          navigateSuccess = true;
        } catch (err) {
          navigateAttempts++;
          if (navigateAttempts === maxRetries) {
            console.log(
              `Failed to navigate to page ${keyword} after ${maxRetries} retries: ${err.message}`
            );
            continue;
          }
        }
      }

      if (!navigateSuccess) {
        continue;
      }

      await closePopupIfExists(page, "#modal_closebtn");

      console.log("JOBMASTER: Getting the amount of pages...");
      let totalPages = await getTotalPages(page, "#desktopResultsHeader", 10);
      totalPages = totalPages > 10 ? 10 : totalPages;

      console.log("JOBMASTER: Processing pages...");
      const keywordJobData = await processKeyword(
        page,
        keyword,
        totalPages,
        processPages
      );
      jobData.push(...keywordJobData);
    }
    const filteredJobs = await filterJobData(jobData);
    const uniqueFilteredJobs = await filterUniqueJobsByID(filteredJobs);


    await browser.close();

    await handleMongoActions(uniqueFilteredJobs, "Jobmaster")
    await executeSheets(uniqueFilteredJobs, "Jobmaster");

    const endingScriptTime = new Date().getTime();
    const calculateToMinutes = Math.floor(
      (endingScriptTime - startingScriptTime) / 1000 / 60
    );
    console.log(`FINISHED SCRAPING JOBMASTER...`);

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

const scrapeJobmaster = async (req, res) => {
  try {
    const result = await retryFunction(scrapeJobmasterLogic, 2);
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

module.exports = { scrapeJobmaster, scrapeJobmasterLogic };
