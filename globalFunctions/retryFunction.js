const retryFunction = async (func, maxRetries) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await func();
        return result;
      } catch (err) {
        if (i === maxRetries - 1) {
          throw err;
        }
        console.log(`Retrying ${func.name}: attempt ${i + 1}`);
      }
    }
  };

  module.exports = {retryFunction}
  