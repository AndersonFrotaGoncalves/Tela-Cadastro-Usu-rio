// Scheduled function: resets the demo data every day at 04:00 (UTC),
// so the public site always stays clean.
import { obterStore } from "./usuarios.mjs";
import { criarRepositorio } from "../lib/usuarios.mjs";

export default async () => {
  await criarRepositorio(obterStore()).repor();
  console.log("Demo data reset.");
};

export const config = { schedule: "0 4 * * *" };
