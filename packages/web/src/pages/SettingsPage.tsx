import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../services/api.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';

type Me = { id: string; name: string; email: string };

export function SettingsPage() {
  const { token } = useAuth();
  const meQ = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<Me>(`/users/me`, { token }),
    enabled: Boolean(token),
  });

  const [name, setName] = useState('');
  useEffect(() => {
    if (meQ.data?.name) setName(meQ.data.name);
  }, [meQ.data?.name]);

  const m = useMutation({
    mutationFn: () =>
      apiFetch<Me>(`/users/me`, { method: 'PATCH', body: JSON.stringify({ name }), token }),
    onSuccess: async () => {
      await meQ.refetch();
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    m.mutate();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link className="text-sm text-primary hover:underline" to="/">
          ← Dashboard
        </Link>
        <h2 className="mt-4 text-2xl font-semibold">Configurações</h2>
        <p className="text-sm text-muted-foreground">Perfil do usuário</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administração</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Cadastre novos usuários que poderão acessar o sistema (sem página pública de registro).
          </p>
          <Link to="/settings/create-user">
            <Button type="button" variant="outline">
              Criar conta de usuário
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={meQ.data?.email ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {m.isError ? <p className="text-sm text-red-600">{(m.error as Error).message}</p> : null}
            <Button type="submit" disabled={m.isPending}>
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
