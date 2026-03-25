"use client";

import { useState, useEffect, FormEvent } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GlobalConfig, UpdateConfigInput } from "@/lib/config";

export default function ConfiguracaoPage() {
  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [form, setForm] = useState<UpdateConfigInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setForm({
          gl: data.gl,
          hl: data.hl,
          location: data.location,
          currency: data.currency,
          trip_type: data.trip_type,
        });
      })
      .catch(() => setMessage("Erro ao carregar configuração"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setMessage("Erro ao salvar");
        return;
      }

      const updated = await res.json();
      setConfig(updated);
      setMessage("Configuração salva com sucesso");
    } catch {
      setMessage("Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-text-muted">Carregando configuração...</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text font-[family-name:var(--font-manrope)] mb-6">
        Configuração SerpAPI
      </h2>

      <Card>
        <CardHeader
          title="Parâmetros Globais"
          description="Configurações padrão para novas rotas. Cada rota pode sobrescrever esses valores individualmente."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                País da busca (gl)
              </label>
              <input
                type="text"
                value={form.gl || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, gl: e.target.value }))
                }
                placeholder="br"
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Idioma (hl)
              </label>
              <input
                type="text"
                value={form.hl || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, hl: e.target.value }))
                }
                placeholder="pt"
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Localização (origem simulada da busca)
            </label>
            <input
              type="text"
              value={form.location || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, location: e.target.value }))
              }
              placeholder="Joao Pessoa, Paraiba, Brazil"
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Moeda (currency)
              </label>
              <input
                type="text"
                value={form.currency || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, currency: e.target.value }))
                }
                placeholder="BRL"
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Tipo de viagem
              </label>
              <select
                value={form.trip_type || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, trip_type: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="round_trip">Ida e volta</option>
                <option value="one_way">Só ida</option>
              </select>
            </div>
          </div>

          {message && (
            <p
              role="status"
              className={`text-sm ${
                message.includes("sucesso") ? "text-success" : "text-danger"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </div>
        </form>
      </Card>

      {config && (
        <Card className="mt-4">
          <CardHeader title="Informações" />
          <p className="text-sm text-text-muted">
            Última atualização:{" "}
            {new Date(config.updated_at).toLocaleString("pt-BR")}
          </p>
        </Card>
      )}
    </div>
  );
}
