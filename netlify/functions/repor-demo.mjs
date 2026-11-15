// Função agendada: repõe os dados de demonstração todos os dias às 04:00 (UTC),
// para o site público estar sempre arrumado.
import { obterStore } from "./usuarios.mjs";
import { criarRepositorio } from "../lib/usuarios.mjs";

export default async () => {
  await criarRepositorio(obterStore()).repor();
  console.log("Dados de demonstração repostos.");
};

export const config = { schedule: "0 4 * * *" };
