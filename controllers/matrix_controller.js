const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  navigateToPage,
  filterJobData,
  filterUniqueLinks,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");

const processPages = async (page) => {
  const jobData = [];
  await page.waitForSelector(".job-item");
  const jobItems = await page.$$(".job-item");

  for (const jobItem of jobItems) {
    const innerHTML = await (
      await jobItem.getProperty("innerHTML")
    ).jsonValue();
    const $ = cheerio.load(innerHTML);

    const title = $(".job-title a").text().trim();
    const location = $(".job-areas").text().trim();
    const type = "לא צוין";
    // const jobIdText = await page.evaluate((el) => el.id, jobItem);
    // const ID = /\d+/.exec(jobIdText)[0];
    const ID = $(".add-to-my-jobs-id").text().trim();
    const linkEncoded = $(".job-title a").attr("href");
    const link = decodeURIComponent(linkEncoded);
    const description = $(".job-areas + p")
      .text()
      .trim()
      .replace(/[\n\t]+/g, " ");
    const requirements = $(".job-more-content")
      .text()
      .trim()
      .replace(/[\n\t]+/g, " ");
    const keyword = "Fullstack";

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

  return jobData;
};

const scrapeMatrixLogic = async () => {
  const jobData = [];

  console.log("MATRIX: Attempting to scrape...");
  const startingScriptTime = new Date().getTime();

  console.log("MATRIX: Opening up the browser...");
  const browser = await launchBrowser();

  console.log("MATRIX: Creating a new page..");
  const page = await browser.newPage();

  console.log("MATRIX: Setting default page settings..");
  setDefaultPageParams(page);

  page.on("dialog", async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.dismiss();
  });

  console.log("MATRIX: Navigating to page..");
  await navigateToPage(
    page,
    decodeURIComponent(
      "https://www.matrix.co.il/jobs/%D7%9E%D7%A9%D7%A8%D7%95%D7%AA/%d7%a4%d7%99%d7%aa%d7%95%d7%97-%d7%aa%d7%95%d7%9b%d7%a0%d7%94/"
    )
  );

  console.log("MATRIX: Processing pages...");
  const keywordJobData = await processPages(page);
  jobData.push(...keywordJobData);

  const filteredJobs = await filterJobData(jobData);
  const uniqueFilteredJobs = await filterUniqueLinks(filteredJobs);
  await browser.close();

  await executeSheets(uniqueFilteredJobs, "Matrix");

  const endingScriptTime = new Date().getTime();
  const calculateToMinutes = Math.floor(
    (endingScriptTime - startingScriptTime) / 1000 / 60
  );
  console.log("MATRIX: Succesfully scraped!");

  return {
    jobDataLength: jobData.length,
    filteredJobsLength: uniqueFilteredJobs.length,
    operationTime: calculateToMinutes,
  };
};

const scrapeMatrix = async (req, res) => {
  try {
    const result = await retryFunction(scrapeMatrixLogic, 3);
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

module.exports = { scrapeMatrix, scrapeMatrixLogic };
