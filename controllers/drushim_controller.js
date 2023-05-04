const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  filterJobData,
  SCRAPING_KEYWORDS,
  filterUniqueLinks,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");

const processPages = async (page, keyword) => {
  const jobData = [];
  console.log(`DRUSHIM: Attempting to scrape the keyword: ${keyword}`);
  console.log('DRUSHIM: Navigating to page..')
  await page.goto(
    `https://www.drushim.co.il/jobs/search/${keyword}/?experience=1-2&ssaen=3`
  );

  await page.waitForSelector(".jobs-row div:nth-child(2) .job-item");
  const jobItems = await page.$$(".jobs-row div:nth-child(2) .job-item");

  for (const jobItem of jobItems) {
    await jobItem.click();
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
    const requirements = $(".job-requirement div p")
      .text()
      .trim()
      .replace(/[\n\t]+/g, " ");
    const websiteLink = $(".pc-view div a").attr("href");
    const link = `https://www.drushim.co.il/${websiteLink}`;
    const ID = websiteLink.split("/")[2];

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
  //   const keywords = ["Fullstack", 'React'];

  console.log("DRUSHIM: Opening up the browser...");
  const browser = await launchBrowser();

  console.log("DRUSHIM: Creating a new page..");
  const page = await browser.newPage();
  const jobData = [];

  page.on("dialog", async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.dismiss();
  });

  for (const keyword of keywords) {
    console.log('DRUSHIM: Processing pages...')
    const keywordJobData = await processPages(page, keyword);
    jobData.push(...keywordJobData);
  }

  const filteredJobs = await filterJobData(jobData);
  const uniqueFilteredJobs = await filterUniqueLinks(filteredJobs);

  await browser.close();

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
};

const scrapeDrushim = async (req, res) => {
  try {
    const result = await retryFunction(scrapeDrushimLogic, 3);
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

module.exports = { scrapeDrushim, scrapeDrushimLogic };
