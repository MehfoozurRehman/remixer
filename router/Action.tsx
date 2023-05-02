export default (routes) =>
  async (...args) => {
    const { action } = await routes();
    return action ? action(...args) : null;
  };
