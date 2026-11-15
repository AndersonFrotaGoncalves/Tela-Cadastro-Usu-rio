// API tests with in-memory storage: `npm test`
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const memoria = new Map();
globalThis.__STORE_TESTE__ = {
  get: async (k) => (memoria.has(k) ? JSON.parse(memoria.get(k)) : null),
  setJSON: async (k, v) => { memoria.set(k, JSON.stringify(v)); },
};
const { default: api } = await import("../netlify/functions/usuarios.mjs");
const { LIMITE, DEMO } = await import("../netlify/lib/usuarios.mjs");

const pedir = async (metodo, caminho, corpo) => {
  const r = await api(new Request(`http://localhost${caminho}`, { method: metodo, body: corpo ? JSON.stringify(corpo) : undefined, headers: { "content-type": "application/json" } }));
  return { status: r.status, dados: r.status === 204 ? null : await r.json() };
};

beforeEach(() => memoria.clear());

test("the first list returns the demo data", async () => {
  const r = await pedir("GET", "/api/usuarios");
  assert.equal(r.status, 200);
  assert.equal(r.dados.length, DEMO.length);
});

test("creates a valid user and normalizes the data", async () => {
  const r = await pedir("POST", "/api/usuarios", { nome: "  Ana   Silva ", email: "ANA@Email.com", idade: "30" });
  assert.equal(r.status, 201);
  assert.deepEqual([r.dados.nome, r.dados.email, r.dados.idade], ["Ana Silva", "ana@email.com", 30]);
  const l = await pedir("GET", "/api/usuarios");
  assert.equal(l.dados[0].email, "ana@email.com"); // newest first
});

test("rejects invalid data with per-field messages", async () => {
  const r = await pedir("POST", "/api/usuarios", { nome: "A", email: "x@", idade: "200" });
  assert.equal(r.status, 400);
  assert.deepEqual(Object.keys(r.dados.campos).sort(), ["email", "idade", "nome"]);
});

test("rejects a duplicate email, case-insensitive", async () => {
  await pedir("POST", "/api/usuarios", { nome: "Ana", email: "ana@email.com", idade: 30 });
  const r = await pedir("POST", "/api/usuarios", { nome: "Outra Ana", email: "Ana@Email.com", idade: 31 });
  assert.equal(r.status, 409);
  assert.ok(r.dados.campos.email);
});

test("updates, allowing the user to keep their own email", async () => {
  const c = await pedir("POST", "/api/usuarios", { nome: "Ana", email: "ana@email.com", idade: 30 });
  const r = await pedir("PUT", `/api/usuarios/${c.dados.id}`, { nome: "Ana Paula", email: "ana@email.com", idade: 31 });
  assert.equal(r.status, 200);
  assert.equal(r.dados.nome, "Ana Paula");
  assert.ok(r.dados.atualizadoEm);
});

test("deletes and returns 404 for an unknown id", async () => {
  const c = await pedir("POST", "/api/usuarios", { nome: "Ana", email: "ana@email.com", idade: 30 });
  assert.equal((await pedir("DELETE", `/api/usuarios/${c.dados.id}`)).status, 204);
  assert.equal((await pedir("DELETE", `/api/usuarios/${c.dados.id}`)).status, 404);
});

test("searches by name or email", async () => {
  const r = await pedir("GET", "/api/usuarios?busca=lucas");
  assert.equal(r.dados.length, 1);
});

test("respects the demo user limit", async () => {
  memoria.set("lista", JSON.stringify(Array.from({ length: LIMITE }, (_, i) => ({ id: String(i), nome: "X", email: `u${i}@x.pt`, idade: 20, criadoEm: new Date().toISOString() }))));
  const r = await pedir("POST", "/api/usuarios", { nome: "Ana", email: "ana@email.com", idade: 30 });
  assert.equal(r.status, 409);
});
