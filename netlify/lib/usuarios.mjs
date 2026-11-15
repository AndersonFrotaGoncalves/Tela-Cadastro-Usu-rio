// Regras de negócio do cadastro de utilizadores.
// Não depende do Netlify: recebe um "store" com get/setJSON, o que permite
// testar com um armazenamento em memória (ver tests/api.test.mjs).
import { randomUUID } from "node:crypto";

export const LIMITE = 200; // máximo de registos na demonstração pública
const CHAVE = "lista";

export const DEMO = [
  { nome: "Mariana Costa", email: "mariana.costa@exemplo.pt", idade: 29 },
  { nome: "João Pereira", email: "joao.pereira@exemplo.pt", idade: 41 },
  { nome: "Beatriz Almeida", email: "beatriz.almeida@exemplo.pt", idade: 34 },
  { nome: "Rafael Lima", email: "rafael.lima@exemplo.com.br", idade: 23 },
  { nome: "Sofia Martins", email: "sofia.martins@exemplo.pt", idade: 52 },
];

export class ErroValidacao extends Error {
  constructor(mensagem, campos = {}, status = 400) {
    super(mensagem);
    this.campos = campos;
    this.status = status;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Valida e normaliza os dados recebidos. Devolve o objeto limpo ou lança ErroValidacao.
export function validar(dados = {}) {
  const nome = String(dados.nome ?? "").trim().replace(/\s+/g, " ");
  const email = String(dados.email ?? "").trim().toLowerCase();
  const idadeTxt = String(dados.idade ?? "").trim();
  const idade = Number(idadeTxt);
  const campos = {};
  if (nome.length < 2) campos.nome = "Escreva o nome (pelo menos 2 letras).";
  else if (nome.length > 60) campos.nome = "O nome pode ter no máximo 60 caracteres.";
  if (!EMAIL.test(email)) campos.email = "Escreva um e-mail válido, por exemplo nome@email.com.";
  else if (email.length > 100) campos.email = "O e-mail é demasiado longo.";
  if (!idadeTxt || !Number.isInteger(idade) || idade < 1 || idade > 120) campos.idade = "A idade tem de ser um número inteiro entre 1 e 120.";
  if (Object.keys(campos).length) throw new ErroValidacao("Corrija os campos assinalados.", campos);
  return { nome, email, idade };
}

export const criarRepositorio = (store) => {
  const ler = async () => (await store.get(CHAVE, { type: "json" })) ?? null;
  const gravar = (lista) => store.setJSON(CHAVE, lista);

  // Na primeira utilização a lista ainda não existe: preenche com a demonstração.
  const lista = async () => {
    const atual = await ler();
    if (atual) return atual;
    return repor();
  };

  const repor = async () => {
    const agora = Date.now();
    const l = DEMO.map((u, i) => ({ id: randomUUID(), ...u, criadoEm: new Date(agora - (DEMO.length - i) * 864e5).toISOString() }));
    await gravar(l);
    return l;
  };

  const emailEmUso = (l, email, ignorarId) => l.some((u) => u.email === email && u.id !== ignorarId);

  return {
    repor,
    async listar(busca = "") {
      const q = busca.trim().toLowerCase();
      const l = await lista();
      return l
        .filter((u) => !q || u.nome.toLowerCase().includes(q) || u.email.includes(q))
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    },
    async criar(dados) {
      const novo = validar(dados);
      const l = await lista();
      if (l.length >= LIMITE) throw new ErroValidacao(`A demonstração aceita no máximo ${LIMITE} registos. Apague alguns para continuar.`, {}, 409);
      if (emailEmUso(l, novo.email)) throw new ErroValidacao("Já existe um utilizador com este e-mail.", { email: "Este e-mail já está registado." }, 409);
      const u = { id: randomUUID(), ...novo, criadoEm: new Date().toISOString() };
      await gravar([...l, u]);
      return u;
    },
    async atualizar(id, dados) {
      const l = await lista();
      const i = l.findIndex((u) => u.id === id);
      if (i < 0) throw new ErroValidacao("Utilizador não encontrado.", {}, 404);
      const novo = validar(dados);
      if (emailEmUso(l, novo.email, id)) throw new ErroValidacao("Já existe um utilizador com este e-mail.", { email: "Este e-mail já está registado." }, 409);
      l[i] = { ...l[i], ...novo, atualizadoEm: new Date().toISOString() };
      await gravar(l);
      return l[i];
    },
    async apagar(id) {
      const l = await lista();
      if (!l.some((u) => u.id === id)) throw new ErroValidacao("Utilizador não encontrado.", {}, 404);
      await gravar(l.filter((u) => u.id !== id));
    },
  };
};
