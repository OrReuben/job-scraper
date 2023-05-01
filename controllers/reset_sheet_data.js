const {
  executeScrapeFunctions,
} = require("../globalFunctions/executeScrapeFunctions");
const { resetSheetsLogic } = require("../globalFunctions/google_sheets");
const { scrapeJobmasterLogic } = require("./jobmaster_controller");
const { scrapeMatrixLogic } = require("./matrix_controller");
const { scrapeDrushimLogic } = require("./drushim_controller");
const { scrapeSQLinkLogic } = require("./SQLink_controller");

module.exports.resetSheetData = async (req, res) => {
  try {
    await resetSheetsLogic();

    const result = await executeScrapeFunctions([
      scrapeJobmasterLogic,
      scrapeMatrixLogic,
      scrapeDrushimLogic,
      scrapeSQLinkLogic
    ]);

    res.status(200).json(
      `Executed Successfully. 
        Scraped from: ${result.jobDataLength} jobs, 
        resulted in ${result.filteredJobsLength} jobs. 
        Operation took: ${result.operationTime} Minutes`
    );
  } catch (err) {
    res.status(500).json(`Something went wrong: ${err.message}`);
  }
};
