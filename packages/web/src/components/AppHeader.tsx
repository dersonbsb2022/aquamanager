import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { Button } from './ui/button.js';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', match: (path: string) => path === '/' || path.startsWith('/aquariums') },
  { to: '/test-parameters', label: 'Parâmetros', match: (path: string) => path.startsWith('/test-parameters') },
  { to: '/settings', label: 'Configurações', match: (path: string) => path.startsWith('/settings') },
] as const;

type AppHeaderProps = {
  onLogout: () => void;
};

export function AppHeader({ onLogout }: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function linkClass(active: boolean, block = false) {
    return cn(
      'rounded-md text-sm transition-colors',
      block ? 'block px-3 py-2.5' : 'px-3 py-1.5',
      active
        ? 'bg-accent font-medium text-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="shrink-0 text-lg font-semibold text-primary">
          AquaManager
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} className={linkClass(item.match(pathname))} to={item.to}>
              {item.label}
            </Link>
          ))}
          <Button variant="outline" size="sm" type="button" className="ml-1" onClick={onLogout}>
            Sair
          </Button>
        </nav>

        <Button
          variant="outline"
          size="icon"
          type="button"
          className="h-9 w-9 shrink-0 md:hidden"
          aria-expanded={open}
          aria-controls="app-mobile-nav"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </Button>
      </div>

      {open ? (
        <nav
          id="app-mobile-nav"
          className="border-t border-border bg-card px-4 py-3 md:hidden"
          aria-label="Principal"
        >
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <Link key={item.to} className={linkClass(item.match(pathname), true)} to={item.to}>
                {item.label}
              </Link>
            ))}
            <Button
              variant="outline"
              type="button"
              className="mt-2 w-full"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              Sair
            </Button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
