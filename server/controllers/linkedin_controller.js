const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  navigateToPage,
  filterJobData,
  filterUniqueJobsByID,
  setDefaultPageParams,
  SCRAPING_KEYWORDS,
  autoScroll,
  processKeyword,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");
const { handleMongoActions } = require("../globalFunctions/mongoActions");
const { sleep } = require("../globalFunctions/helperFunctions");

const processPages = async (page, keyword) => {
  const jobData = [];
  console.log(`LINKEDIN: Attempting to scrape the keyword: ${keyword}`);
  console.log("LINKEDIN: Navigating to page..");

  await page.goto(
    `https://www.linkedin.com/jobs/search?keywords=${keyword}&location=Israel&locationId=&geoId=101620260&f_TPR=&f_E=2%2C3%2C4&position=1&pageNum=0`
  );

//   await autoScroll(page);

  const jobItems = await page.$$(".jobs-search__results-list .base-card");

  console.log(jobItems.length);
    for (const jobItem of jobItems) {
      await jobItem.click();
    //   await page.waitForSelector(".details-pane__content.details-pane__content--show");

    //   const detailsPane = await page.$(".details-pane__content.details-pane__content--show");

    //   const innerHTML = await (
    //     await detailsPane.getProperty("innerHTML")
    //   ).jsonValue();
    //   const $ = cheerio.load(innerHTML);

      const title = 's'
      console.log(title);
      await sleep(1000)
    //   const locationAndType = $(".job-details-sub div div div:nth-child(1)")
    //     .text()
    //     .trim();
    //   const location = locationAndType.split("|")[0];
    //   const type = locationAndType.split("|")[1];
    //   const description = $(".job-details p")
    //     .text()
    //     .trim()
    //     .replace(/[\n\t]+/g, " ");
    //   const requirements = $(".job-requirements div p")
    //     .text()
    //     .trim()
    //     .replace(/[\n\t]+/g, " ");

    //   const websiteLink = $(".pc-view div a").attr("href");
    //   const link = `https://www.drushim.co.il/${websiteLink}`;
    //   const ID = websiteLink.split("/")[2];

    //   if (
    //     !title ||
    //     !link ||
    //     !description ||
    //     !requirements ||
    //     !ID ||
    //     !location ||
    //     !type
    //   ) {
    //     continue;
    //   }

      const jobItemData = {
        title,
        // location,
        // type,
        // ID,
        // link,
        // description,
        // requirements,
        // keyword,
      };
      jobData.push(jobItemData);
    }

    console.log(`LINKEDIN: Successfully scraped the keyword: ${keyword}`);

  return jobData;
};

const scrapeLinkedinLogic = async () => {
  const jobData = [];

  console.log("LINKEDIN: Attempting to scrape...");
  const startingScriptTime = new Date().getTime();
  const keywords = SCRAPING_KEYWORDS;

  console.log("LINKEDIN: Opening up the browser...");
  const browser = await launchBrowser();

  try {
    console.log("LINKEDIN: Creating a new page..");
    const page = await browser.newPage();

    console.log("LINKEDIN: Setting default page settings..");
    setDefaultPageParams(page);

    page.on("dialog", async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.dismiss();
    });

    console.log("LINKEDIN: Navigating to page..");
    await navigateToPage(
      page,
      decodeURIComponent(
        "https://www.linkedin.com/jobs/search?keywords=Fullstack&location=Israel&locationId=&geoId=101620260&f_TPR=&f_E=2%2C3%2C4&position=1&pageNum=0"
      )
    );

    for (const keyword of keywords) {
      console.log("LINKEDIN: Processing pages...");
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

    await handleMongoActions(uniqueFilteredJobs, "Linkedin");
    await executeSheets(uniqueFilteredJobs, "Linkedin");

    const endingScriptTime = new Date().getTime();
    const calculateToMinutes = Math.floor(
      (endingScriptTime - startingScriptTime) / 1000 / 60
    );
    console.log("LINKEDIN: Succesfully scraped!");

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

const scrapeLinkedin = async (req, res) => {
  try {
    const result = await retryFunction(scrapeLinkedinLogic, 2);
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

module.exports = { scrapeLinkedin, scrapeLinkedinLogic };
