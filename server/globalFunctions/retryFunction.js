const retryFunction = async (func, maxRetries, keyword, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await func();
      return result;
    } catch (err) {
      if (i === maxRetries - 1) {
        throw new Error(err);
      }
      console.log(
        `Retrying ${keyword ? keyword : func.name}: attempt ${i + 1}, Error: ${
          err.message
        }`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = { retryFunction };
