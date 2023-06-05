const {
  executeScrapeFunctions,
} = require("../globalFunctions/executeScrapeFunctions");
const { resetSheetsLogic } = require("../globalFunctions/google_sheets");
const { scrapeJobmasterLogic } = require("./jobmaster_controller");
const { scrapeMatrixLogic } = require("./matrix_controller");
const { scrapeDrushimLogic } = require("./drushim_controller");
const { scrapeSQLinkLogic } = require("./SQLink_controller");
const { scrapeAllJobsLogic } = require("./alljobs_controller");

module.exports.resetSheetData = async (req, res) => {
  try {
    console.log("ATTEMPTING TO RESET DATA...");
    await resetSheetsLogic();
    const result = await executeScrapeFunctions([
      scrapeJobmasterLogic,
      scrapeMatrixLogic,
      scrapeDrushimLogic,
      scrapeSQLinkLogic,
      scrapeAllJobsLogic,
    ]);
    console.log("FINISHED RESETTING DATA...");
    if (result.errors.length === 0) {
      res.status(200).json(
        `Executed Successfully. 
          Scraped from: ${result.jobDataLength} jobs, 
          resulted in ${result.filteredJobsLength} jobs. 
          Operation took: ${result.operationTime} Minutes`
      );
      console.log(`Executed Successfully. 
      Scraped from: ${result.jobDataLength} jobs, 
      resulted in ${result.filteredJobsLength} jobs. 
      Operation took: ${result.operationTime} Minutes`);
    } else if (result.errors.length === scrapeFunctions.length) {
      res
        .status(500)
        .json(
          `All functions failed: ${result.errors
            .map((error) => `${error.functionName}: ${error.message}`)
            .join(", ")}`
        );
      console.log(
        `All functions failed: ${result.errors
          .map((error) => `${error.functionName}: ${error.message}`)
          .join(", ")}`
      );
    } else {
      res.status(200).json(
        `Executed with some errors. 
          Scraped from: ${result.jobDataLength} jobs, 
          resulted in ${result.filteredJobsLength} jobs. 
          Operation took: ${result.operationTime} Minutes. 
          Failed functions: ${result.errors
            .map((error) => `${error.functionName}: ${error.message}`)
            .join(", ")}`
      );
      console.log(
        `Executed with some errors. 
          Scraped from: ${result.jobDataLength} jobs, 
          resulted in ${result.filteredJobsLength} jobs. 
          Operation took: ${result.operationTime} Minutes. 
          Failed functions: ${result.errors
            .map((error) => `${error.functionName}: ${error.message}`)
            .join(", ")}`
      );
    }
  } catch (err) {
    res.status(500).json(`Something went wrong: ${err.message}`);
    console.log(`Something went wrong: ${err.message}`);
  }
};
