const { retryFunction } = require("./retryFunction");

const executeScrapeFunctions = async (scrapeFunctions) => {
  const result = {
    jobDataLength: 0,
    filteredJobsLength: 0,
    operationTime: 0,
  };

  for (const scrapeFunction of scrapeFunctions) {
    const scrapeResult = await retryFunction(scrapeFunction, 2);
    result.jobDataLength += scrapeResult.jobDataLength;
    result.filteredJobsLength += scrapeResult.filteredJobsLength;
    result.operationTime += scrapeResult.operationTime;
  }

  return result;
};
module.exports = {executeScrapeFunctions}