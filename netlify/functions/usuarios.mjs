// API REST de utilizadores (Netlify Functions).
//   GET    /api/usuarios?busca=texto   → lista
//   POST   /api/usuarios               → cria
//   PUT    /api/usuarios/:id           → atualiza
//   DELETE /api/usuarios/:id           → apaga
// Os dados ficam no Netlify Blobs (armazenamento incluído no Netlify).
import { getStore } from "@netlify/blobs";
import { criarRepositorio, ErroValidacao } from "../lib/usuarios.mjs";

const json = (corpo, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

// Permite injetar outro armazenamento nos testes.
export const obterStore = () => globalThis.__STORE_TESTE__ ?? getStore({ name: "usuarios", consistency: "strong" });

export default async (req) => {
  const repo = criarRepositorio(obterStore());
  const url = new URL(req.url);
  const id = url.pathname.replace(/^\/api\/usuarios\/?/, "").split("/")[0] || null;

  try {
    if (req.method === "GET" && !id) return json(await repo.listar(url.searchParams.get("busca") || ""));

    if (req.method === "POST" && !id) {
      const dados = await req.json().catch(() => ({}));
      return json(await repo.criar(dados), 201);
    }

    if (req.method === "PUT" && id) {
      const dados = await req.json().catch(() => ({}));
      return json(await repo.atualizar(id, dados));
    }

    if (req.method === "DELETE" && id) {
      await repo.apagar(id);
      return new Response(null, { status: 204 });
    }

    return json({ erro: "Rota não encontrada." }, 404);
  } catch (e) {
    if (e instanceof ErroValidacao) return json({ erro: e.message, campos: e.campos }, e.status);
    console.error(e);
    return json({ erro: "Erro no servidor. Tente novamente." }, 500);
  }
};

export const config = { path: ["/api/usuarios", "/api/usuarios/*"] };
