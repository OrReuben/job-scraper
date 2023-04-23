const express = require("express");
const app = express();
require("dotenv").config();
const executeActionsRoute = require("./routes/execute_actions_route");
// const axios = require("axios");

// const axiosInstance = axios.create({
//   baseURL: "http://localhost:5000",
// });

// let executingAction = false;

// setTimeout(async () => {
//   const timeNowHours = new Date().getHours();
//   const timeNowMinutes = new Date().getMinutes();
//   const timeNow = `${timeNowHours}:${timeNowMinutes}`;
//   if (timeNow === "19:53" && !executingAction) {
//     executingAction = true;
//     const { data } = await axiosInstance.get("/execute/jobmaster");
//     console.log(data);
//     executingAction = false;
//   }
// }, 29999);

app.use(express.json());
app.use("/execute", executeActionsRoute);

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server started on ${process.env.PORT || 5000}`)
);
