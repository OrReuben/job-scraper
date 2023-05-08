const { retryFunction } = require("./retryFunction");

const executeScrapeFunctions = async (scrapeFunctions) => {
  const result = {
    jobDataLength: 0,
    filteredJobsLength: 0,
    operationTime: 0,
    errors: [],
  };

  for (const scrapeFunction of scrapeFunctions) {
    try {
      const scrapeResult = await retryFunction(scrapeFunction, 2);
      result.jobDataLength += scrapeResult.jobDataLength;
      result.filteredJobsLength += scrapeResult.filteredJobsLength;
      result.operationTime += scrapeResult.operationTime;
    } catch (err) {
      result.errors.push({
        functionName: scrapeFunction.name,
        message: err.message,
      });
    }
  }

  return result;
};



module.exports = { executeScrapeFunctions };
