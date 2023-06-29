import { Footer, Header } from 'components';

import { Outlet } from 'react-router-dom';

export const meta = {
  title: 'project_name',
  description: 'project_name',
  image: '/favicon.svg',
  url: 'https://vitefilerouter.com',
};

export default function App() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
