import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../services/api.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';

type CreateUserPayload = { name: string; email: string; password: string };
type CreatedUser = { id: string; name: string; email: string };

export function CreateUserPage() {
  const { token } = useAuth();
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: (body: CreateUserPayload) =>
      apiFetch<CreatedUser>('/users', { method: 'POST', body: JSON.stringify(body), token }),
    onSuccess: (user) => {
      setCreatedEmail(user.email);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreatedEmail(null);
    const fd = new FormData(e.currentTarget);
    m.mutate({
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      password: String(fd.get('password') ?? ''),
    });
    e.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link className="text-sm text-primary hover:underline" to="/settings">
          ← Configurações
        </Link>
        <h2 className="mt-4 text-2xl font-semibold">Nova conta de usuário</h2>
        <p className="text-sm text-muted-foreground">
          Uso interno — a pessoa entra depois com o e-mail e a senha definidos aqui.
        </p>
      </div>

      {createdEmail ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Conta criada para <strong>{createdEmail}</strong>. Pode criar outra abaixo.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados do usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha inicial</Label>
              <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
            </div>
            {m.isError ? <p className="text-sm text-red-600">{(m.error as Error).message}</p> : null}
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? 'Criando…' : 'Criar conta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
