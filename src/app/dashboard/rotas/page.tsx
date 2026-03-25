"use client";

import { useState, useEffect, FormEvent } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { Route, CreateRouteInput } from "@/lib/routes";

const EMPTY_FORM: CreateRouteInput = {
  origin: "",
  destination: "",
  outbound_date: "",
  return_date: "",
  trip_type: null,
  gl: null,
  hl: null,
  location: null,
  currency: null,
};

export default function RotasPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateRouteInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState<string | null>(null);

  async function fetchRoutes() {
    try {
      const res = await fetch("/api/rotas");
      const data = await res.json();
      setRoutes(data);
    } catch {
      setError("Erro ao carregar rotas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoutes();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(route: Route) {
    setEditingId(route.id);
    setForm({
      origin: route.origin,
      destination: route.destination,
      outbound_date: route.outbound_date,
      return_date: route.return_date || "",
      trip_type: route.trip_type,
      gl: route.gl,
      hl: route.hl,
      location: route.location,
      currency: route.currency,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/rotas/${editingId}` : "/api/rotas";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          return_date: form.return_date || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao salvar rota");
        return;
      }

      setModalOpen(false);
      fetchRoutes();
    } catch {
      setError("Erro de conexão");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta rota?")) return;
    try {
      await fetch(`/api/rotas/${id}`, { method: "DELETE" });
      fetchRoutes();
    } catch {
      setError("Erro ao excluir rota");
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      await fetch(`/api/rotas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      fetchRoutes();
    } catch {
      setError("Erro ao alterar status");
    }
  }

  async function handleExtract(id: string) {
    setExtracting(id);
    try {
      const res = await fetch("/api/coleta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_id: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro na extração");
      }
    } catch {
      setError("Erro ao extrair dados");
    } finally {
      setExtracting(null);
    }
  }

  function updateField(field: keyof CreateRouteInput, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return <p className="text-text-muted">Carregando rotas...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text font-[family-name:var(--font-manrope)]">
          Rotas Monitoradas
        </h2>
        <Button onClick={openCreate}>Adicionar Rota</Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger mb-4">
          {error}
        </p>
      )}

      {routes.length === 0 ? (
        <Card>
          <p className="text-text-muted text-center py-8">
            Nenhuma rota cadastrada. Clique em &quot;Adicionar Rota&quot; para
            começar.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <Card key={route.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      route.active ? "bg-success" : "bg-text-muted"
                    }`}
                    aria-label={route.active ? "Ativa" : "Inativa"}
                  />
                  <div>
                    <p className="font-semibold text-text">
                      {route.origin} → {route.destination}
                    </p>
                    <p className="text-xs text-text-muted">
                      Ida: {route.outbound_date}
                      {route.return_date && ` | Volta: ${route.return_date}`}
                    </p>
                    {(route.gl || route.location || route.currency) && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {[
                          route.gl && `gl: ${route.gl}`,
                          route.location && `loc: ${route.location}`,
                          route.currency && `moeda: ${route.currency}`,
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExtract(route.id)}
                    disabled={extracting === route.id || !route.active}
                  >
                    {extracting === route.id ? "Extraindo..." : "Extrair agora"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(route.id, route.active)}
                  >
                    {route.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(route)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(route.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Rota" : "Nova Rota"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Origem (IATA)
              </label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => updateField("origin", e.target.value)}
                placeholder="JPA"
                maxLength={3}
                required
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text uppercase placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Destino (IATA)
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => updateField("destination", e.target.value)}
                placeholder="MAO"
                maxLength={3}
                required
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text uppercase placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Data de Ida
              </label>
              <input
                type="date"
                value={form.outbound_date}
                onChange={(e) => updateField("outbound_date", e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Data de Volta
              </label>
              <input
                type="date"
                value={form.return_date || ""}
                onChange={(e) => updateField("return_date", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <details className="border border-border rounded-md">
            <summary className="px-3 py-2 text-sm text-text-muted cursor-pointer hover:text-text">
              Configurações avançadas (override SerpAPI)
            </summary>
            <div className="p-3 space-y-3 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    País (gl)
                  </label>
                  <input
                    type="text"
                    value={form.gl || ""}
                    onChange={(e) =>
                      updateField("gl", e.target.value || null)
                    }
                    placeholder="br"
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Idioma (hl)
                  </label>
                  <input
                    type="text"
                    value={form.hl || ""}
                    onChange={(e) =>
                      updateField("hl", e.target.value || null)
                    }
                    placeholder="pt"
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  value={form.location || ""}
                  onChange={(e) =>
                    updateField("location", e.target.value || null)
                  }
                  placeholder="Joao Pessoa, Paraiba, Brazil"
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Moeda
                  </label>
                  <input
                    type="text"
                    value={form.currency || ""}
                    onChange={(e) =>
                      updateField("currency", e.target.value || null)
                    }
                    placeholder="BRL"
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Tipo de Viagem
                  </label>
                  <select
                    value={form.trip_type || ""}
                    onChange={(e) =>
                      updateField("trip_type", e.target.value || null)
                    }
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Usar padrão global</option>
                    <option value="round_trip">Ida e volta</option>
                    <option value="one_way">Só ida</option>
                  </select>
                </div>
              </div>
            </div>
          </details>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{editingId ? "Salvar" : "Criar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
