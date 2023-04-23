const {
  executeScrapeFunctions,
} = require("../globalFunctions/executeScrapeFunctions");
const { resetSheetsLogic } = require("../globalFunctions/google_sheets");
const { scrapeJobmasterLogic } = require("./jobmaster_controller");

module.exports.resetSheetData = async (req, res) => {
  try {
    await resetSheetsLogic();
    const result = await executeScrapeFunctions([scrapeJobmasterLogic]);

    res.status(200).json(
      `Executed Successfully. 
        Scraped from: ${result.jobDataLength} jobs, 
        resulted in ${result.filteredJobsLength} jobs. 
        Operation took: ${result.operationTime} Minutes`
    );
  } catch (err) {
    res.status(500).json('Something went wrong..')
  }
};
