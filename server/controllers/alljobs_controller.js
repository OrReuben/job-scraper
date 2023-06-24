const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  filterJobData,
  filterUniqueJobsByID,
  setDefaultPageParams,
  processKeyword,
  getTotalPages,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");
const { handleMongoActions } = require("../globalFunctions/mongoActions");

const processPages = async (page, keyword) => {
  console.log(`ALLJOBS: Attempting to scrape the keyword: ${keyword}`);
  console.log("ALLJOBS: Navigating to page..");

  const baseUrl = "https://www.alljobs.co.il";
  const searchUrl = `${baseUrl}/SearchResultsGuest.aspx?page=1&position=1712,1994,1710,1759,1758,1711,1731,1694,1883&type=&source=&duration=0&exc=&region=`;

  await Promise.all([
    page.goto(searchUrl),
    page.waitForSelector("div#search_bar_title span.T14"),
  ]);

  let totalPages = await getTotalPages(
    page,
    "div#search_bar_title span.T14",
    15,
    1
  );

  const jobData = [];

  for (let index = 0; index < totalPages; index++) {
    if ((index + 1) % 5 === 0) {
      console.log("ALLJOBS: +5 Pages scraped");
    }

    const pageUrl = `${baseUrl}/SearchResultsGuest.aspx?page=${
      index + 1
    }&position=1712,1994,1710,1759,1758,1711,1731,1694,1883&type=&source=&duration=0&exc=&region=`;
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

    const jobItems = await page.$$(".open-board");

    for (const jobItem of jobItems) {
      const innerHTML = await jobItem
        .getProperty("innerHTML")
        .then((el) => el.jsonValue());
      const $ = cheerio.load(innerHTML);

      const title = $(".H10 + div a h3").text().trim();

      const allLocations = $(".H5 + div a")
        .map((index, element) => $(element).text())
        .get();
      const location = allLocations.join(", ");

      const jobTypes = $(".H5 + div + div a")
        .map((index, element) => $(element).text())
        .get();
      const type = jobTypes.join(", ");

      const description = $(".job-content-top-desc div")
        .first()
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text()
        .trim();

      const requirements = $(".job-content-top-desc .PT15").text().trim();
      const shortenedLink = $(".H10 + div div a").attr("href");
      const link = `${baseUrl}${shortenedLink}`;
      const ID = shortenedLink.split("=")[1];

      if (
        !title ||
        !link ||
        !description ||
        !requirements ||
        !ID ||
        !location ||
        !type
      ) {
        continue;
      }

      const jobItemData = {
        title,
        location,
        type,
        ID,
        link,
        description,
        requirements,
        keyword,
      };
      jobData.push(jobItemData);
    }
  }

  console.log(`ALLJOBS: Successfully scraped the keyword: ${keyword}`);
  return jobData;
};

const scrapeAllJobsLogic = async () => {
  console.log(`SCRAPING ALLJOBS...`);

  const startingScriptTime = new Date().getTime();

  console.log("ALLJOBS: Opening up the browser...");
  const browser = await launchBrowser();

  try {
    console.log("ALLJOBS: Creating a new page..");
    const page = await browser.newPage();

    console.log("ALLJOBS: Setting default page settings..");
    setDefaultPageParams(page);

    page.on("dialog", async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.dismiss();
    });

    console.log("ALLJOBS: Processing pages...");
    const keyword = "Web Development";
    const keywordJobData = await processKeyword(
      page,
      keyword,
      null,
      processPages
    );

    const filteredJobs = await filterJobData(keywordJobData);
    const uniqueFilteredJobs = await filterUniqueJobsByID(filteredJobs);

    await browser.close();

    await handleMongoActions(uniqueFilteredJobs, "AllJobs");
    await executeSheets(uniqueFilteredJobs, "AllJobs");

    const endingScriptTime = new Date().getTime();
    const calculateToMinutes = Math.floor(
      (endingScriptTime - startingScriptTime) / 1000 / 60
    );
    console.log(`FINISHED SCRAPING ALLJOBS...`);

    return {
      jobDataLength: keywordJobData.length,
      filteredJobsLength: uniqueFilteredJobs.length,
      operationTime: calculateToMinutes,
    };
  } catch (err) {
    console.log("Something went wrong.. " + err.message);
    browser.close();
    throw new Error();
  }
};

const scrapeAllJobs = async (req, res) => {
  try {
    const result = await retryFunction(scrapeAllJobsLogic, 2);
    res.status(201).json({
      jobDataLength: result.jobDataLength,
      filteredJobsLength: result.filteredJobsLength,
      operationTime: result.operationTime,
    });
    console.log(`Executed Successfully. 
    Scraped from: ${result.jobDataLength} jobs, 
    resulted in ${result.filteredJobsLength} jobs. 
    Operation took: ${result.operationTime} Minutes`);
  } catch (err) {
    res.status(500).json("Something went wrong: " + err.message);
  }
};

module.exports = { scrapeAllJobs, scrapeAllJobsLogic };
