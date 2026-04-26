import { useState, useEffect } from "react";
import Head from "next/head";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.looka.win";

export default function SlugPage() {
  const [page, setPage] = useState(null);
  const [error, setError] = useState(false);
  const [lang, setLang] = useState("fr");
  const [footerPages, setFooterPages] = useState([]);

  useEffect(() => {
    const s = localStorage.getItem("looka_lang"); if (s) setLang(s);
    const slug = window.location.pathname.replace("/","");
    fetch(`${API_URL}/api/pages/${slug}?lang=${lang}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(d => setPage(d))
      .catch(() => setError(true));
    fetch(`${API_URL}/api/pages?lang=${lang}`)
      .then(res => res.json())
      .then(data => setFooterPages(data.pages || []))
      .catch(() => {});
  }, [lang]);

  if (error) return (
    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font)"}}>
      <div style={{textAlign:"center"}}>
        <p style={{fontSize:"3rem",fontWeight:800,color:"var(--gold)",marginBottom:8}}>404</p>
        <p style={{color:"var(--muted)",marginBottom:16}}>Page introuvable</p>
        <a href="/" style={{color:"var(--gold)"}}>← Retour</a>
      </div>
    </div>
  );

  if (!page) return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"var(--muted)",fontFamily:"var(--font)"}}>Chargement...</p>
    </div>
  );

  return (
    <>
      <Head>
        <title>{page.title} — LookaWin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>
      <header className="app-header">
        <a href="/" className="logo">
          <div className="logo-icon"><i className="fa-solid fa-ticket" style={{color:"#b48eef",fontSize:"0.9rem"}}></i></div>
          <span className="logo-text">lookaWin</span>
        </a>
        <button className="btn-lang" onClick={() => { const n = lang==="fr"?"en":"fr"; setLang(n); localStorage.setItem("looka_lang",n); }}>
          {lang==="fr"?"EN":"FR"}
        </button>
      </header>
      <main style={{maxWidth:680,margin:"0 auto",padding:"24px 16px 60px"}}>
        <div className="card">
          <h1 style={{fontFamily:"var(--font)",fontWeight:800,fontSize:"1.5rem",color:"var(--gold)",marginBottom:20}}>{page.title}</h1>
          <div style={{color:"var(--text)",lineHeight:1.8,fontSize:"0.9rem"}} dangerouslySetInnerHTML={{__html: page.content}} />
        </div>
      </main>
      <footer className="footer">
        <div className="footer-links">
          {footerPages.map(p=>(<a key={p.slug} href={"/" + p.slug} className="footer-link">{p.title}</a>))}
        </div>
        <p className="footer-copy">© 2026 lookaWin — Provably Fair Crypto Lottery</p>
      </footer>
    </>
  );
}
