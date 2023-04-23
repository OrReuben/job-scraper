const cheerio = require("cheerio");
const { executeSheets } = require("../globalFunctions/google_sheets");
const {
  launchBrowser,
  navigateToPage,
  searchForKeyword,
  closePopupIfExists,
  filterJobData,
  scrapingKeywords,
} = require("../globalFunctions/scrapingLogic");

const getTotalPages = async (page) => {
  const pageCountEl = await page.$("#desktopResultsHeader");
  const pageCountRaw = await page.evaluate((el) => el.textContent, pageCountEl);
  const numberRegex = /\d+/g;
  const pageCount = Number(pageCountRaw.match(numberRegex)[0]);
  return Math.ceil(pageCount / 10);
};

const processPages = async (page, totalPages, keyword) => {
  const jobData = [];

  for (let index = 0; index < totalPages; index++) {
    await page.goto(
      `https://www.jobmaster.co.il/jobs/?currPage=${index + 1}&q=${keyword}`
    );

    await page.waitForSelector(".JobItemRight");
    const jobItems = await page.$$(".JobItemRight");

    for (let i = 0; i < jobItems.length; i++) {
      const currentJobItems = await page.$$(".JobItemRight");
      await currentJobItems[i].click();

      try {
        await Promise.race([
          page.waitForSelector("#enterJob .jobNumStyle"),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 1500)
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
      const jobId = (jobIdText && jobIdText.match(numberRegex)[0]);
      const link = `https://www.jobmaster.co.il/jobs/checknum.asp?key=${jobId}`;
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
      };
      jobData.push(oneJobData);
    }
  }

  return jobData;
};

const scrapeJobmasterLogic = async () => {
  const startingScriptTime = new Date().getTime();
  const keywords = scrapingKeywords;

  const browser = await launchBrowser();
  const page = await browser.newPage();

  page.on("dialog", async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.dismiss();
  });

  const jobData = [];

  for (const keyword of keywords) {
    await navigateToPage(page, "https://www.jobmaster.co.il/");
    await searchForKeyword(page, keyword, {
      submitBtn: ".submitFind",
      selectorExists: "#desktopResultsHeader",
    });

    await closePopupIfExists(page, "#modal_closebtn");

    const totalPages = await getTotalPages(page);
    const keywordJobData = await processPages(page, totalPages, keyword);
    jobData.push(...keywordJobData);
  }

  const filteredJobs = filterJobData(jobData);

  await browser.close();

  await executeSheets(filteredJobs, "Jobmaster");

  const endingScriptTime = new Date().getTime();
  const calculateToMinutes = Math.floor(
    (endingScriptTime - startingScriptTime) / 1000 / 60
  );

  return {
    jobDataLength: jobData.length,
    filteredJobsLength: filteredJobs.length,
    operationTime: calculateToMinutes,
  };
};

const scrapeJobmaster = async (req, res) => {
  try {
    const result = await scrapeJobmasterLogic();
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
