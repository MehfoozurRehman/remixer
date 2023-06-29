import { Head } from '@router';
import { Outlet } from 'react-router-dom';

export default () => {
  return (
    <>
      <Head
        title="project_name"
        image="/favicon.ico"
        url="https://vitefilerouter.com"
        description="project_name"
      />
      <Outlet />
    </>
  );
};
