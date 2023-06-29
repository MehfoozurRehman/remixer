export default (routes: any) => async (...args: any) => {
  const { action } = await routes();
  return action ? action(...args) : null;
};