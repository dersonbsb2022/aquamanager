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

type RegisterPayload = { name: string; email: string; password: string };
type RegisterResponse = { accessToken: string; refreshToken: string };

export function RegisterPage() {
  const { setSession } = useAuth();
  const nav = useNavigate();
  const m = useMutation({
    mutationFn: (body: RegisterPayload) =>
      apiFetch<RegisterResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
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
    m.mutate({
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      password: String(fd.get('password') ?? ''),
    });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 py-16">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nova conta</h1>
        <p className="text-sm text-muted-foreground">Cadastre-se para usar o AquaManager</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            {m.isError ? <p className="text-sm text-red-600">{(m.error as Error).message}</p> : null}
            <Button type="submit" className="w-full" disabled={m.isPending}>
              {m.isPending ? 'Criando…' : 'Criar conta'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link className="font-medium text-primary hover:underline" to="/login">
                Entrar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
