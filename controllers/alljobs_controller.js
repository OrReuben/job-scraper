const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  filterJobData,
  SCRAPING_KEYWORDS,
  filterUniqueLinks,
  setDefaultPageParams,
  processKeyword,
  getTotalPages,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");

const processPages = async (page, keyword) => {
  const jobData = [];
  console.log(`ALLJOBS: Attempting to scrape the keyword: Web Developement`);
  console.log("ALLJOBS: Navigating to page..");
  await page.goto(
    `https://www.alljobs.co.il/SearchResultsGuest.aspx?page=1&position=1712,1994,1710,1759,1758,1711,1731,1694,1883&type=&source=&duration=0&exc=&region=`
  );

  let totalPages = await getTotalPages(
    page,
    "div#search_bar_title span.T14",
    15,
    1
  );

  for (let index = 0; index < totalPages; index++) {
    (index + 1) % 5 === 0 && console.log("ALLJOBS: +5 Pages scraped");

    await page.goto(
      `https://www.alljobs.co.il/SearchResultsGuest.aspx?page=${
        index + 1
      }&position=1712,1994,1710,1759,1758,1711,1731,1694,1883&type=&source=&duration=0&exc=&region=`
    );
    await page.waitForSelector(".open-board");
    const jobItems = await page.$$(".open-board");

    for (const jobItem of jobItems) {
      const innerHTML = await (
        await jobItem.getProperty("innerHTML")
      ).jsonValue();
      const $ = cheerio.load(innerHTML);

      const title = $(".H10 + div a h3").text().trim();
      const location = $(".H5 + div a").text().trim();
      const type = $(".H5 + div + div a").text().trim();
      const description = $(".job-content-top-desc div")
        .first()
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text()
        .trim()
        .replace(/[\n\t]+/g, " ");
      const requirements = $(".job-content-top-desc .PT15")
        .text()
        .trim()
        .replace(/[\n\t]+/g, " ");
      const shortenedLink = $(".H10 + div div a").attr("href");
      const link = `http://alljobs.co.il${shortenedLink}`;
      const ID = shortenedLink.split("=")[1];
      index === 0 &&
        console.log({
          title,
          location,
          type,
          ID,
          link,
          description,
          requirements,
          keyword: "Web Developement",
        });
      const jobItemData = {
        title,
        location,
        type,
        ID,
        link,
        description,
        requirements,
        keyword: "Web Developement",
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
  const jobData = [];

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
    const keywordJobData = await processKeyword(
      page,
      "Web Developement",
      null,
      processPages
    );
    jobData.push(...keywordJobData);

    const filteredJobs = await filterJobData(jobData);
    console.log(filteredJobs.length);
    const uniqueFilteredJobs = await filterUniqueLinks(filteredJobs);

    await browser.close();

    await executeSheets(uniqueFilteredJobs, "AllJobs");

    const endingScriptTime = new Date().getTime();
    const calculateToMinutes = Math.floor(
      (endingScriptTime - startingScriptTime) / 1000 / 60
    );
    console.log(`FINISHED SCRAPING ALLJOBS...`);

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

const scrapeAllJobs = async (req, res) => {
  try {
    const result = await retryFunction(scrapeAllJobsLogic, 2);
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

module.exports = { scrapeAllJobs, scrapeAllJobsLogic };