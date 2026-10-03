import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  pathname: string;
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  searchParams: URLSearchParams;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [search, setSearch] = useState(window.location.search);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const push = (href: string) => {
    const url = new URL(href, window.location.origin);
    window.history.pushState({}, '', url.pathname + url.search);
    setPathname(url.pathname);
    setSearch(url.search);
  };

  const replace = (href: string) => {
    const url = new URL(href, window.location.origin);
    window.history.replaceState({}, '', url.pathname + url.search);
    setPathname(url.pathname);
    setSearch(url.search);
  };

  const back = () => {
    window.history.back();
  };

  const searchParams = new URLSearchParams(search);

  return (
    <RouterContext.Provider value={{ pathname, push, replace, back, searchParams }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    // Fallback if not inside provider yet
    return {
      push: (href: string) => { window.location.pathname = href; },
      replace: (href: string) => { window.location.replace(href); },
      back: () => { window.history.back(); },
      forward: () => window.history.forward(),
      prefetch: () => {},
    };
  }
  return {
    push: context.push,
    replace: context.replace,
    back: context.back,
    forward: () => window.history.forward(),
    prefetch: () => {},
  };
}

export function usePathname() {
  const context = useContext(RouterContext);
  if (!context) {
    return window.location.pathname;
  }
  return context.pathname;
}

export function useSearchParams() {
  const context = useContext(RouterContext);
  if (!context) {
    return new URLSearchParams(window.location.search);
  }
  return context.searchParams;
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: React.ReactNode;
}

export default function Link({ href, children, onClick, ...props }: LinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented) {
      e.preventDefault();
      router.push(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
