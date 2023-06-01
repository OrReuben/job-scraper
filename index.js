const express = require("express");
const app = express();
require("dotenv").config();
const executeActionsRoute = require("./routes/execute_actions_route");
const fetchDataRoute = require('./routes/fetch_data_route')
const { automateExecutions } = require("./globalFunctions/automateExecutions");
const uri = process.env.MONGO_URL;
const mongoose = require('mongoose')

mongoose
  .connect(uri, { useNewUrlParser: true })
  .then(() => console.log(`Database connected successfully`))
  .catch((err) => console.log(err));
mongoose.Promise = global.Promise;

const schedule = [
  { time: "00:00", route: "/execute/reset", daysInterval: 3 },
  { time: "12:00", route: "/execute/jobmaster" },
  { time: "15:00", route: "/execute/matrix" },
  { time: "15:30", route: "/execute/drushim" },
  { time: "18:00", route: "/execute/sqlink" },
  { time: "21:00", route: "/execute/alljobs" },
];

schedule.forEach(({ time, route, daysInterval }) => {
  automateExecutions(time, route, daysInterval);
});

app.use(express.json());
app.use("/", fetchDataRoute);
app.use("/execute", executeActionsRoute);
app.use("/ping", (req, res) => {
  res.status(200).json("pinged");
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server started on ${process.env.PORT || 5000}`)
);
