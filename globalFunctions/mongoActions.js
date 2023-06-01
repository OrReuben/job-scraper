const { Site } = require("../models/siteModel");

function convertDataToMongoModel(jobs, website) {
  const result = [];
  for (const obj of jobs) {
    result.push({ website, ...obj });
  }
  return result;
}

const handleMongoActions = async (jobs, website) => {
  console.log(`${website.toUpperCase()}: Posting jobs on mongo..`);
  const convertedJobData = convertDataToMongoModel(jobs, website);
  try {
    const siteExists = await Site.findOne({ website });
    if (siteExists) {
      await Site.findOneAndUpdate(
        { website },
        { website, jobs: convertedJobData },
        { new: true }
      );
      console.log(`${website.toUpperCase()}: Successfully updated document..`);
    } else {
      await Site.create({
        website,
        jobs: convertedJobData,
      });
      console.log(`${website.toUpperCase()}: Successfully created new document..`);
    }
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = { handleMongoActions };
