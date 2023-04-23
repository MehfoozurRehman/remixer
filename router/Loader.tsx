export default (routes: any) => async (...args: any) => {
  const { loader } = await routes();
  return loader ? loader(...args) : null;
};