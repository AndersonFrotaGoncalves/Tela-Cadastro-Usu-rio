import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import Formulario from "./Formulario.jsx";

const iniciais = (nome) => nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const dataCurta = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
// Avatar color derived from the email, so each person always gets the same one.
const TONS = ["#2F5BEA", "#0E8A6A", "#B5541B", "#7A4CC2", "#B8306A", "#2E7C9E"];
const tom = (txt) => TONS[[...txt].reduce((s, c) => s + c.charCodeAt(0), 0) % TONS.length];

export default function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [estado, setEstado] = useState("carregar"); // carregar | pronto | erro
  const [erroLista, setErroLista] = useState("");
  const [busca, setBusca] = useState("");
  const [emEdicao, setEmEdicao] = useState(null);
  const [aApagar, setAApagar] = useState(null);
  const [aviso, setAviso] = useState(null);
  const avisoTimer = useRef();
  const dialogo = useRef(null);

  const avisar = (texto, tipo = "ok") => {
    clearTimeout(avisoTimer.current);
    setAviso({ texto, tipo });
    avisoTimer.current = setTimeout(() => setAviso(null), 3500);
  };

  const carregar = useCallback(async (q) => {
    try {
      setUsuarios(await api.listar(q));
      setEstado("pronto");
    } catch (e) {
      setErroLista(e.message);
      setEstado("erro");
    }
  }, []);

  // Search with a short delay so we don't call the server on every key press.
  useEffect(() => {
    const t = setTimeout(() => carregar(busca), busca ? 250 : 0);
    return () => clearTimeout(t);
  }, [busca, carregar]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (aApagar && !d.open) d.showModal();
    if (!aApagar && d.open) d.close();
  }, [aApagar]);

  async function gravar(dados) {
    try {
      if (emEdicao) {
        await api.atualizar(emEdicao.id, dados);
        avisar(`${dados.nome.trim()} was updated.`);
        setEmEdicao(null);
      } else {
        await api.criar(dados);
        avisar(`${dados.nome.trim()} was added.`);
      }
      await carregar(busca);
    } catch (e) {
      avisar(e.message, "erro");
      throw e;
    }
  }

  async function confirmarApagar() {
    const u = aApagar;
    setAApagar(null);
    try {
      await api.apagar(u.id);
      if (emEdicao?.id === u.id) setEmEdicao(null);
      avisar(`${u.nome} was deleted.`);
      await carregar(busca);
    } catch (e) {
      avisar(e.message, "erro");
    }
  }

  return (
    <div className="pagina">
      <header className="topo">
        <div>
          <h1>User registry</h1>
          <p>Add, search, edit and delete users. Data is saved on the server.</p>
        </div>
        <span className="contador" aria-live="polite">
          {estado === "pronto" && (busca ? `${usuarios.length} result${usuarios.length === 1 ? "" : "s"}` : `${usuarios.length} user${usuarios.length === 1 ? "" : "s"}`)}
        </span>
      </header>

      <main className="grelha">
        <Formulario emEdicao={emEdicao} aoGravar={gravar} aoCancelar={() => setEmEdicao(null)} />

        <section className="lista" aria-label="Registered users">
          <div className="pesquisa">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" placeholder="Search by name or email" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Search users" />
          </div>

          {estado === "carregar" && (
            <ul className="tabela" aria-busy="true">
              {[0, 1, 2].map((i) => <li key={i} className="linha esqueleto" />)}
            </ul>
          )}

          {estado === "erro" && (
            <div className="vazio">
              <p>{erroLista}</p>
              <button className="btn btn-secundario" onClick={() => { setEstado("carregar"); carregar(busca); }}>Try again</button>
            </div>
          )}

          {estado === "pronto" && usuarios.length === 0 && (
            <div className="vazio">
              {busca ? <p>No users match “{busca}”.</p> : <p>No users yet. Add the first one with the form.</p>}
              {busca && <button className="btn btn-secundario" onClick={() => setBusca("")}>Clear search</button>}
            </div>
          )}

          {estado === "pronto" && usuarios.length > 0 && (
            <ul className="tabela">
              {usuarios.map((u) => (
                <li key={u.id} className={"linha" + (emEdicao?.id === u.id ? " linha-ativa" : "")}>
                  <span className="avatar" style={{ background: tom(u.email) }} aria-hidden="true">{iniciais(u.nome)}</span>
                  <div className="dados">
                    <strong>{u.nome}</strong>
                    <span>{u.email}</span>
                  </div>
                  <span className="idade">{u.idade} years</span>
                  <span className="data" title={`Added on ${dataCurta(u.criadoEm)}`}>{dataCurta(u.criadoEm)}</span>
                  <div className="acoes">
                    <button className="icone" onClick={() => { setEmEdicao(u); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label={`Edit ${u.nome}`} title="Edit">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
                    </button>
                    <button className="icone icone-perigo" onClick={() => setAApagar(u)} aria-label={`Delete ${u.nome}`} title="Delete">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="rodape">
        Public demo: the sample data is reset every day. Built by{" "}
        <a href="https://andersonfrota.netlify.app" target="_blank" rel="noreferrer">Anderson Frota</a> ·{" "}
        <a href="https://github.com/AndersonFrotaGoncalves/Tela-Cadastro-Usu-rio" target="_blank" rel="noreferrer">source on GitHub</a>
      </footer>

      <dialog ref={dialogo} className="dialogo" onClose={() => setAApagar(null)}>
        {aApagar && (
          <>
            <h2>Delete {aApagar.nome}?</h2>
            <p>The user {aApagar.email} will be removed. This can't be undone.</p>
            <div className="acoes-form">
              <button className="btn btn-perigo" onClick={confirmarApagar} autoFocus>Delete</button>
              <button className="btn btn-secundario" onClick={() => setAApagar(null)}>Cancel</button>
            </div>
          </>
        )}
      </dialog>

      {aviso && <div className={"aviso aviso-" + aviso.tipo} role="status">{aviso.texto}</div>}
    </div>
  );
}
