const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  filterJobData,
  SCRAPING_KEYWORDS,
  filterUniqueJobsByID,
  setDefaultPageParams,
  processKeyword,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");
const { handleMongoActions } = require("../globalFunctions/mongoActions");

const processPages = async (page, keyword) => {
  const jobData = [];
  console.log(`DRUSHIM: Attempting to scrape the keyword: ${keyword}`);
  console.log("DRUSHIM: Navigating to page..");
  await Promise.race([
    page.goto(
      `https://www.drushim.co.il/jobs/search/${keyword}/?experience=1-2&ssaen=3`
    ),
    page.waitForSelector(".jobs-row div:nth-child(2) .job-item"),
  ]);

  const jobItems = await page.$$(".jobs-row div:nth-child(2) .job-item");

  for (const jobItem of jobItems) {
    const specificSelector = await jobItem.$(".sub-details-btns .pointer");
    await specificSelector.click();
    await page.waitForSelector(".job-requirements div p");
    const innerHTML = await (
      await jobItem.getProperty("innerHTML")
    ).jsonValue();
    const $ = cheerio.load(innerHTML);

    const title = $(".job-url.primary--text.font-weight-bold.primary--text")
      .text()
      .trim();
    const locationAndType = $(".job-details-sub div div div:nth-child(1)")
      .text()
      .trim();
    const location = locationAndType.split("|")[0];
    const type = locationAndType.split("|")[1];
    const description = $(".job-details p")
      .text()
      .trim()
      .replace(/[\n\t]+/g, " ");
    const requirements = $(".job-requirements div p")
      .text()
      .trim()
      .replace(/[\n\t]+/g, " ");

    const websiteLink = $(".pc-view div a").attr("href");
    const link = `https://www.drushim.co.il/${websiteLink}`;
    const ID = websiteLink.split("/")[2];

    if (!title || !link || !description || !requirements || !ID || !location || !type) {
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
  console.log(`DRUSHIM: Successfully scraped the keyword: ${keyword}`);

  return jobData;
};

const scrapeDrushimLogic = async () => {
  console.log(`SCRAPING DRUSHIM...`);

  const startingScriptTime = new Date().getTime();
  const keywords = SCRAPING_KEYWORDS;
  // const keywords = ["Javascript"];
  const jobData = [];

  console.log("DRUSHIM: Opening up the browser...");
  const browser = await launchBrowser();

  try {
    console.log("DRUSHIM: Creating a new page..");
    const page = await browser.newPage();

    console.log("DRUSHIM: Setting default page settings..");
    setDefaultPageParams(page);

    page.on("dialog", async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.dismiss();
    });

    for (const keyword of keywords) {
      console.log("DRUSHIM: Processing pages...");
      const keywordJobData = await processKeyword(
        page,
        keyword,
        null,
        processPages
      );
      jobData.push(...keywordJobData);
    }
    const filteredJobs = await filterJobData(jobData);
    const uniqueFilteredJobs = await filterUniqueJobsByID(filteredJobs);

    await browser.close();

    await handleMongoActions(uniqueFilteredJobs, "Drushim")
    await executeSheets(uniqueFilteredJobs, "Drushim");

    const endingScriptTime = new Date().getTime();
    const calculateToMinutes = Math.floor(
      (endingScriptTime - startingScriptTime) / 1000 / 60
    );
    console.log(`FINISHED SCRAPING DRUSHIM...`);

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

const scrapeDrushim = async (req, res) => {
  try {
    const result = await retryFunction(scrapeDrushimLogic, 2);
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

module.exports = { scrapeDrushim, scrapeDrushimLogic };
