const { retryFunction } = require("./retryFunction");

const executeScrapeFunctions = async (scrapeFunctions) => {
  const result = {
    jobDataLength: 0,
    filteredJobsLength: 0,
    operationTime: 0,
    errors: [],
  };

  const promises = scrapeFunctions.map((scrapeFunction) =>
    retryFunction(scrapeFunction, 2).catch((err) => ({
      error: {
        functionName: scrapeFunction.name,
        message: err.message,
      },
    }))
  );

  const results = await Promise.all(promises);

  for (const scrapeResult of results) {
    if (scrapeResult.error) {
      result.errors.push(scrapeResult.error);
    } else {
      result.jobDataLength += scrapeResult.jobDataLength;
      result.filteredJobsLength += scrapeResult.filteredJobsLength;
      result.operationTime += scrapeResult.operationTime;
    }
  }

  return result;
};




module.exports = { executeScrapeFunctions };
