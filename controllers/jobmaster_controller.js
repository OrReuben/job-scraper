const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  navigateToPage,
  searchForKeyword,
  closePopupIfExists,
  filterJobData,
  SCRAPING_KEYWORDS,
  filterUniqueLinks,
  getTotalPages,
  setDefaultPageParams,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");

const processPages = async (page, totalPages, keyword) => {
  const jobData = [];
  console.log(`JOBMASTER: Attempting to scrape the keyword: ${keyword}`);
  for (let index = 0; index < totalPages; index++) {
    await page.goto(
      `https://www.jobmaster.co.il/jobs/?currPage=${index + 1}&q=${keyword}`
    );

    try {
      await page.waitForSelector(".JobItemRight", { timeout: 10000 });
    } catch (err) {
      if (err instanceof page.errors.TimeoutError) {
        break;
      } else {
        throw err;
      }
    }
    const jobItems = await page.$$(".JobItemRight");

    for (let i = 0; i < jobItems.length; i++) {
      const currentJobItems = await page.$$(".JobItemRight");
      await currentJobItems[i].click();

      try {
        await Promise.race([
          page.waitForSelector("#enterJob .jobNumStyle"),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 2000)
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
  // const keywords = ['ReactJS',"Angular"];
  const jobData = [];

  console.log("JOBMASTER: Opening up the browser...");
  const browser = await launchBrowser();

  console.log("JOBMASTER: Creating a new page..");
  const page = await browser.newPage();

  console.log("JOBMASTER: Setting default page settings..");
  setDefaultPageParams(page)

  page.on("dialog", async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.dismiss();
  });

  for (const keyword of keywords) {
    console.log("JOBMASTER: Navigating to page..");
    await navigateToPage(page, "https://www.jobmaster.co.il/");

    console.log(`JOBMASTER: Searching for the keyword: ${keyword} `);
    await searchForKeyword(page, keyword, {
      selectorInput: "#q",
      submitBtn: ".submitFind",
      selectorExists: "#desktopResultsHeader",
    });

    await closePopupIfExists(page, "#modal_closebtn");

    console.log("JOBMASTER: Getting the amount of pages...");
    let totalPages = await getTotalPages(page, "#desktopResultsHeader", 10);
    totalPages = totalPages > 10 ? 10 : totalPages;

    console.log("JOBMASTER: Processing pages...");
    const keywordJobData = await processPages(page, totalPages, keyword);
    jobData.push(...keywordJobData);
  }

  const filteredJobs = await filterJobData(jobData);
  const uniqueFilteredJobs = await filterUniqueLinks(filteredJobs);

  await browser.close();

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
};

const scrapeJobmaster = async (req, res) => {
  try {
    const result = await retryFunction(scrapeJobmasterLogic, 3);
    res.status(201).json(
      `Executed Successfully. 
        Scraped from: ${result.jobDataLength} jobs, 
        resulted in ${result.filteredJobsLength} jobs. 
        Operation took: ${result.operationTime} Minutes`
    );
  } catch (err) {
    res.status(500).json("Something went wrong: " + err.message);
  }
};

module.exports = { scrapeJobmaster, scrapeJobmasterLogic };
