// Business rules for the user registry.
// It doesn't depend on Netlify: it receives a "store" with get/setJSON,
// so it can be tested with in-memory storage (see tests/api.test.mjs).
import { randomUUID } from "node:crypto";

export const LIMITE = 200; // maximum number of users in the public demo
const CHAVE = "lista";

export const DEMO = [
  { nome: "Emma Schneider", email: "emma.schneider@example.com", idade: 29 },
  { nome: "João Pereira", email: "joao.pereira@example.com", idade: 41 },
  { nome: "Lucas Martin", email: "lucas.martin@example.com", idade: 34 },
  { nome: "Sofia Rossi", email: "sofia.rossi@example.com", idade: 23 },
  { nome: "Daniel García", email: "daniel.garcia@example.com", idade: 52 },
];

export class ErroValidacao extends Error {
  constructor(mensagem, campos = {}, status = 400) {
    super(mensagem);
    this.campos = campos;
    this.status = status;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Validates and normalizes the input. Returns the clean object or throws ErroValidacao.
export function validar(dados = {}) {
  const nome = String(dados.nome ?? "").trim().replace(/\s+/g, " ");
  const email = String(dados.email ?? "").trim().toLowerCase();
  const idadeTxt = String(dados.idade ?? "").trim();
  const idade = Number(idadeTxt);
  const campos = {};
  if (nome.length < 2) campos.nome = "Enter a name (at least 2 letters).";
  else if (nome.length > 60) campos.nome = "The name can have up to 60 characters.";
  if (!EMAIL.test(email)) campos.email = "Enter a valid email, for example name@email.com.";
  else if (email.length > 100) campos.email = "The email is too long.";
  if (!idadeTxt || !Number.isInteger(idade) || idade < 1 || idade > 120) campos.idade = "Age must be a whole number between 1 and 120.";
  if (Object.keys(campos).length) throw new ErroValidacao("Please fix the highlighted fields.", campos);
  return { nome, email, idade };
}

export const criarRepositorio = (store) => {
  const ler = async () => (await store.get(CHAVE, { type: "json" })) ?? null;
  const gravar = (lista) => store.setJSON(CHAVE, lista);

  // On first use the list doesn't exist yet: fill it with demo data.
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
      if (l.length >= LIMITE) throw new ErroValidacao(`The demo accepts up to ${LIMITE} users. Delete some to continue.`, {}, 409);
      if (emailEmUso(l, novo.email)) throw new ErroValidacao("A user with this email already exists.", { email: "This email is already registered." }, 409);
      const u = { id: randomUUID(), ...novo, criadoEm: new Date().toISOString() };
      await gravar([...l, u]);
      return u;
    },
    async atualizar(id, dados) {
      const l = await lista();
      const i = l.findIndex((u) => u.id === id);
      if (i < 0) throw new ErroValidacao("User not found.", {}, 404);
      const novo = validar(dados);
      if (emailEmUso(l, novo.email, id)) throw new ErroValidacao("A user with this email already exists.", { email: "This email is already registered." }, 409);
      l[i] = { ...l[i], ...novo, atualizadoEm: new Date().toISOString() };
      await gravar(l);
      return l[i];
    },
    async apagar(id) {
      const l = await lista();
      if (!l.some((u) => u.id === id)) throw new ErroValidacao("User not found.", {}, 404);
      await gravar(l.filter((u) => u.id !== id));
    },
  };
};
