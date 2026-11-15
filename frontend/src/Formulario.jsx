import { useEffect, useRef, useState } from "react";

const VAZIO = { nome: "", email: "", idade: "" };

// Mesmas regras do servidor, para dar retorno imediato antes de enviar.
export function validar({ nome, email, idade }) {
  const e = {};
  if (nome.trim().length < 2) e.nome = "Escreva o nome (pelo menos 2 letras).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = "Escreva um e-mail válido, por exemplo nome@email.com.";
  const n = Number(idade);
  if (!String(idade).trim() || !Number.isInteger(n) || n < 1 || n > 120) e.idade = "A idade tem de ser um número inteiro entre 1 e 120.";
  return e;
}

export default function Formulario({ emEdicao, aoGravar, aoCancelar }) {
  const [valores, setValores] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [aGravar, setAGravar] = useState(false);
  const primeiro = useRef(null);

  useEffect(() => {
    setValores(emEdicao ? { nome: emEdicao.nome, email: emEdicao.email, idade: String(emEdicao.idade) } : VAZIO);
    setErros({});
    if (emEdicao) primeiro.current?.focus();
  }, [emEdicao]);

  const mudar = (campo) => (ev) => {
    setValores((v) => ({ ...v, [campo]: ev.target.value }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  };

  async function enviar(ev) {
    ev.preventDefault();
    const e = validar(valores);
    setErros(e);
    if (Object.keys(e).length) {
      ev.currentTarget.querySelector(`[name="${Object.keys(e)[0]}"]`)?.focus();
      return;
    }
    setAGravar(true);
    try {
      await aoGravar({ ...valores, idade: Number(valores.idade) });
      if (!emEdicao) {
        setValores(VAZIO);
        primeiro.current?.focus();
      }
    } catch (err) {
      if (err.campos && Object.keys(err.campos).length) setErros(err.campos);
    } finally {
      setAGravar(false);
    }
  }

  const campo = (nome, rotulo, props) => (
    <label className={"campo" + (erros[nome] ? " campo-erro" : "")}>
      <span>{rotulo}</span>
      <input
        name={nome}
        value={valores[nome]}
        onChange={mudar(nome)}
        aria-invalid={!!erros[nome]}
        aria-describedby={erros[nome] ? `erro-${nome}` : undefined}
        {...props}
      />
      {erros[nome] && <small id={`erro-${nome}`}>{erros[nome]}</small>}
    </label>
  );

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>{emEdicao ? "Editar utilizador" : "Novo utilizador"}</h2>
      {campo("nome", "Nome completo", { ref: primeiro, autoComplete: "name", maxLength: 60, placeholder: "Ex.: Ana Silva" })}
      {campo("email", "E-mail", { type: "email", autoComplete: "email", maxLength: 100, placeholder: "nome@email.com" })}
      {campo("idade", "Idade", { type: "number", inputMode: "numeric", min: 1, max: 120, placeholder: "Ex.: 30" })}
      <div className="acoes-form">
        <button className="btn btn-primario" disabled={aGravar}>
          {aGravar ? "A gravar…" : emEdicao ? "Guardar alterações" : "Registar utilizador"}
        </button>
        {emEdicao && (
          <button type="button" className="btn btn-secundario" onClick={aoCancelar} disabled={aGravar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
