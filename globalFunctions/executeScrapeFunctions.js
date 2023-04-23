module.exports.executeScrapeFunctions = async (scrapeFunctions) => {
    const result = {
      jobDataLength: 0,
      filteredJobsLength: 0,
      operationTime: 0,
    };
  
    for (const scrapeFunction of scrapeFunctions) {
      const scrapeResult = await scrapeFunction();
      result.jobDataLength += scrapeResult.jobDataLength;
      result.filteredJobsLength += scrapeResult.filteredJobsLength;
      result.operationTime += scrapeResult.operationTime;
    }
  
    return result;
  };
  