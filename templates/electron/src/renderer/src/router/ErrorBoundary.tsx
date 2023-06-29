export default (routes: any) => async (...args: any) => {
  const { Error } = await routes();
  return Error ? Error(...args) : null;
};