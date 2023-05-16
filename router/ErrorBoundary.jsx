export default (routes) =>
  async (...args) => {
    const { Error } = await routes();
    return Error ? Error(...args) : null;
  };
