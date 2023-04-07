import { SvgLogo } from "@assets";

export default function Index() {
  return (
    <div className="flex flex-col bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 h-screen align-middle justify-between">
      <div className="flex flex-col flex-1 align-middle justify-center">
        <img src={SvgLogo} alt="Logo" className="w-32 h-32 mx-auto mb-8" />
        <p className="text-1xl text-center text-slate-300 max-w-2xl mx-auto">
          Our React app starter includes file-based routing, lazy loading,
          automatic component and asset exporting, and SASS/CSS import support
          for easy styling. We also offer prefetching and a head component.
          Inspired by Next.js and Remix, we aim to accelerate your development
          process. 💻💨
        </p>
        <div className="flex flex-row justify-center space-x-4 mt-8">
          <a
            href="https://github.com/MehfoozurRehman/remixer"
            target="_blank"
            rel="noreferrer"
            className="bg-slate-700 rounded-md pl-5  pr-5 pt-2 pb-2 text-slate-300 hover:bg-slate-600 border border-slate-300 hover:border-slate-400"
          >
            Get Started on Web
          </a>
          <a
            href="https://github.com/MehfoozurRehman/remixer-electron"
            target="_blank"
            rel="noreferrer"
            className="bg-slate-700 rounded-md pl-5  pr-5 pt-2 pb-2 text-slate-300 hover:bg-slate-600 border border-slate-300 hover:border-slate-400"
          >
            Get Started on Desktop
          </a>
        </div>
      </div>
      <div className="flex flex-row justify-center mb-8">
        <a
          href="https://github.com/MehfoozurRehman"
          className="text-slate-300 hover:text-slate-400"
          target="_blank"
          rel="noreferrer"
        >
          Made with ❤️ by Mehfoozur Rehman
        </a>
      </div>
    </div>
  );
}
