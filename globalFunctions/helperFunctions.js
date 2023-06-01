const sleep = async (timeout) => {
  await new Promise((res) =>
    setTimeout(() => {
      res();
    }, timeout)
  );
};

module.exports = { sleep };
