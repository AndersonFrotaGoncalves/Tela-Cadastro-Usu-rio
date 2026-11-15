// REST API client (/api/usuarios), served by Netlify Functions.
const BASE = "/api/usuarios";

export class ErroApi extends Error {
  constructor(mensagem, campos = {}, status = 0) {
    super(mensagem);
    this.campos = campos;
    this.status = status;
  }
}

async function pedir(caminho, opcoes = {}) {
  let r;
  try {
    r = await fetch(BASE + caminho, { headers: { "content-type": "application/json" }, ...opcoes });
  } catch {
    throw new ErroApi("Can't reach the server. Check your internet connection and try again.");
  }
  if (r.status === 204) return null;
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErroApi(dados.erro || "The request could not be completed.", dados.campos, r.status);
  return dados;
}

export const api = {
  listar: (busca = "") => pedir(busca ? `?busca=${encodeURIComponent(busca)}` : ""),
  criar: (u) => pedir("", { method: "POST", body: JSON.stringify(u) }),
  atualizar: (id, u) => pedir(`/${id}`, { method: "PUT", body: JSON.stringify(u) }),
  apagar: (id) => pedir(`/${id}`, { method: "DELETE" }),
};
