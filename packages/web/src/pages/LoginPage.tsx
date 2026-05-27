import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../services/api.js';
import type { AccessToken } from '../types/api.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';

type LoginPayload = { email: string; password: string };
type LoginResponse = { accessToken: string; refreshToken: string };

export function LoginPage() {
  const { setSession } = useAuth();
  const nav = useNavigate();
  const m = useMutation({
    mutationFn: (body: LoginPayload) => apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (data) => {
      setSession({
        accessToken: data.accessToken as AccessToken,
        refreshToken: data.refreshToken,
      });
      nav('/', { replace: true });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '');
    const password = String(fd.get('password') ?? '');
    m.mutate({ email, password });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 py-16">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AquaManager</h1>
        <p className="text-sm text-muted-foreground">Entre para gerenciar seus aquários</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            {m.isError ? <p className="text-sm text-red-600">{(m.error as Error).message}</p> : null}
            <Button type="submit" className="w-full" disabled={m.isPending}>
              {m.isPending ? 'Entrando…' : 'Entrar'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Novo aqui?{' '}
              <Link className="font-medium text-primary hover:underline" to="/register">
                Criar conta
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
