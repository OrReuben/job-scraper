const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  navigateToPage,
  filterJobData,
  filterUniqueLinks,
  setDefaultPageParams,
} = require("../globalFunctions/scraping_logic");
const { retryFunction } = require("../globalFunctions/retryFunction");

const processPages = async (page, website) => {
  console.log(`${website}: Processing pages...`);

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
  const websiteName = 'MATRIX'
  console.log("MATRIX: Attempting to scrape...");
  const startingScriptTime = new Date().getTime();

  const browser = await launchBrowser(websiteName);

  try {
    console.log("MATRIX: Creating a new page..");
    const page = await browser.newPage();

    setDefaultPageParams(page, websiteName);

    page.on("dialog", async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.dismiss();
    });

    await navigateToPage(
      page,
      decodeURIComponent(
        "https://www.matrix.co.il/jobs/%D7%9E%D7%A9%D7%A8%D7%95%D7%AA/%d7%a4%d7%99%d7%aa%d7%95%d7%97-%d7%aa%d7%95%d7%9b%d7%a0%d7%94/"
      ),
      websiteName
    );

    const keywordJobData = await processPages(page, websiteName);
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
  } catch (err) {
    console.log("Something went wrong.. " + err.message);
    browser.close();
    throw new Error();
  }
};

const scrapeMatrix = async (req, res) => {
  try {
    const result = await retryFunction(scrapeMatrixLogic, 2);
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

module.exports = { scrapeMatrix, scrapeMatrixLogic };
