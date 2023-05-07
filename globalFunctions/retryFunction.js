const retryFunction = async (func, maxRetries, keyword) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await func();
      return result;
    } catch (err) {
      if (i === maxRetries - 1) {
        throw new Error(err);
      }
      console.log(
        `Retrying ${keyword ? keyword : func.name}: attempt ${i + 1}`
      );
    }
  }
};

module.exports = { retryFunction };
