export default (routes) =>
  async (...args) => {
    const { loader } = await routes();
    return loader ? loader(...args) : null;
  };
