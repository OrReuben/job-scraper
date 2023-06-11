const axios = require("axios");

const axiosInstance = axios.create({
  baseURL: process.env.BASE_URL,
});

setInterval(async () => {
  try {
    const { data } = await axiosInstance.get("/wakeup");
    console.log(data);
  } catch (err) {
    console.log("WAKEUP FAILED: " + err.message);
  }
}, 300000);

const lastExecutions = {};

const automateExecutions = async (time, route, daysInterval = 1) => {
  const now = new Date();
  const [hours, minutes] = time.split(":");
  const targetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );

  if (now > targetTime) {
    targetTime.setDate(targetTime.getDate() + daysInterval);
  }

  const timeDifference = targetTime - now;

  setTimeout(async () => {
    const currentDate = new Date();
    const currentMinute = currentDate.getMinutes();
    const lastExecutionMinute =
      lastExecutions[route] && lastExecutions[route].getMinutes();
    if (lastExecutionMinute !== currentMinute) {
      console.log(`Starting to automate the route: ${route}`);
      try {
        const { data } = await axiosInstance.get(route);
        console.log(`Finished automating the route: ${route}`);
        console.log(data);
        lastExecutions[route] = currentDate;
      } catch (error) {
        console.error(error.message);
      }
    }
    automateExecutions(time, route, daysInterval);
  }, timeDifference);
};

module.exports = { automateExecutions };
