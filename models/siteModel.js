const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const siteModel = new Schema({
  website: { type: String, required: true, unique: true },
  jobs: [
    {
      title: { type: String, required: true },
      location: { type: String, required: true },
      type: { type: String, required: true },
      ID: { type: String, required: true },
      link: { type: String, required: true },
      description: { type: String, required: true },
      requirements: { type: String, required: true },
      keyword: { type: String, required: true },
    },
  ],
});

const Site = mongoose.model("site", siteModel);
module.exports = { Site };
