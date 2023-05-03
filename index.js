const express = require("express");
const app = express();
require("dotenv").config();
const executeActionsRoute = require("./routes/execute_actions_route");
const { automateExecutions } = require("./globalFunctions/automateExecutions");

const schedule = [
  { time: "01:00", route: "/execute/reset", daysInterval: 3 },
  { time: "02:00", route: "/execute/jobmaster" },
  { time: "11:15", route: "/execute/matrix" },
  { time: "04:00", route: "/execute/drushim" },
  { time: "05:00", route: "/execute/sqlink" },
];

schedule.forEach(({ time, route, daysInterval }) => {
  automateExecutions(time, route, daysInterval);
});

app.use(express.json());
app.use("/execute", executeActionsRoute);

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server started on ${process.env.PORT || 5000}`)
);
