const axios = require("axios");

const axiosInstance = axios.create({
  baseURL: "https://job-scraper-api.onrender.com",
});

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
      const { data } = await axiosInstance.get(route);
      console.log(data);
      automateExecutions(time, route, daysInterval); // Reschedule the job based on daysInterval
    }, timeDifference);
  };

  module.exports = {automateExecutions}
