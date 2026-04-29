import { useState, useEffect } from "react";
import Head from "next/head";

const CONTENT = {
  en: {
    title: "Play Without Existing",
    subtitle: "No account. No email. No identity. Just a wallet.",
    notcollect: "What lookaWin does NOT collect",
    items: ["Name or identity","Email address","Phone number","KYC or ID verification","IP address or location"],
    address: "You are an address. Nothing more.",
    addressDesc: "To lookaWin, you are a wallet address, a string of characters on a blockchain. No one knows who you are. Not even us. Your winnings go directly to your wallet, automatically, without any human intermediary.",
    wallets: "Compatible Wallets",
    walletsDesc: "MetaMask, Trust Wallet, Coinbase Wallet, or any wallet that supports BNB Smart Chain. Use a fresh wallet for maximum privacy.",
    tagline: "Buy a ticket. Win. Disappear.",
    taglineSub: "That's how it should work.",
    back: "Back to home",
    footer: ["Transparency", "Anonymity", "Protocol"],
  },
  fr: {
    title: "Jouer Sans Exister",
    subtitle: "Pas de compte. Pas d'email. Pas d'identité. Juste un wallet.",
    notcollect: "Ce que lookaWin ne collecte PAS",
    items: ["Nom ou identité","Adresse email","Numéro de téléphone","KYC ou vérification d'identité","Adresse IP ou localisation"],
    address: "Tu es une adresse. Rien de plus.",
    addressDesc: "Pour lookaWin, tu es une adresse wallet,  une chaîne de caractères sur une blockchain. Personne ne sait qui tu es. Pas même nous. Tes gains arrivent directement dans ton wallet, automatiquement, sans aucun intermédiaire humain.",
    wallets: "Wallets compatibles",
    walletsDesc: "MetaMask, Trust Wallet, Coinbase Wallet, ou tout wallet supportant BNB Smart Chain. Utilise un wallet vierge pour un anonymat maximal.",
    tagline: "Achète un ticket. Gagne. Disparais.",
    taglineSub: "C'est comme ça que ça devrait fonctionner.",
    back: "Retour à l'accueil",
    footer: ["Transparence", "Anonymat", "Protocole"],
  }
};

export default function Anonymat() {
  const [lang, setLang] = useState("en");
  useEffect(() => { const s = localStorage.getItem("looka_lang"); if (s) setLang(s); }, []);
  const toggleLang = () => { const n = lang==="en"?"fr":"en"; setLang(n); localStorage.setItem("looka_lang",n); };
  const c = CONTENT[lang];

  return (
    <>
      <Head>
        <title>{lang==="fr" ? "Loterie Anonyme Sans KYC — LookaWin | Jouer Sans S'identifier" : "Anonymous Lottery No KYC — LookaWin | Play Without Identity"}</title>
        <meta name="description" content={lang==="fr"
          ? "Jouez à la loterie crypto sans compte, sans email, sans KYC. LookaWin ne collecte aucune donnée personnelle. Juste un wallet suffit. Anonymat total garanti par la blockchain."
          : "Play the crypto lottery with no account, no email, no KYC. LookaWin collects zero personal data. Just a wallet. Total anonymity guaranteed by the blockchain."
        } />
        <meta name="keywords" content={lang==="fr"
          ? "loterie anonyme, loterie sans KYC, loterie crypto sans inscription, loterie blockchain anonyme, jouer loterie sans compte, loterie USDT anonyme, crypto gambling anonyme"
          : "anonymous lottery, no KYC lottery, crypto lottery no signup, anonymous blockchain lottery, play lottery no account, anonymous USDT lottery, anonymous crypto gambling"
        } />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://looka.win/anonymat/" />
        <meta property="og:title" content={lang==="fr" ? "Loterie Anonyme Sans KYC — LookaWin" : "Anonymous Lottery No KYC — LookaWin"} />
        <meta property="og:description" content={lang==="fr"
          ? "Pas de compte, pas d'email, pas de KYC. Juste un wallet. Anonymat total."
          : "No account, no email, no KYC. Just a wallet. Total anonymity."
        } />
        <meta property="og:image" content="https://looka.win/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={lang==="fr" ? "Loterie Anonyme Sans KYC — LookaWin" : "Anonymous Lottery No KYC — LookaWin"} />
        <meta name="twitter:description" content={lang==="fr" ? "Pas de compte. Pas de KYC. Juste un wallet. Joue et disparais." : "No account. No KYC. Just a wallet. Play and disappear."} />
        <link rel="canonical" href="https://looka.win/anonymat/" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": lang==="fr" ? "Faut-il créer un compte pour jouer sur LookaWin ?" : "Do I need to create an account to play on LookaWin?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": lang==="fr"
                  ? "Non. LookaWin ne nécessite aucun compte, aucun email, aucune vérification d'identité. Il suffit d'un wallet compatible BNB Smart Chain."
                  : "No. LookaWin requires no account, no email, no identity verification. You only need a wallet compatible with BNB Smart Chain."
              }
            },
            {
              "@type": "Question",
              "name": lang==="fr" ? "LookaWin collecte-t-il des données personnelles ?" : "Does LookaWin collect personal data?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": lang==="fr"
                  ? "LookaWin ne collecte aucune donnée personnelle. Pas de nom, pas d'email, pas d'adresse IP, pas de KYC. Pour LookaWin, vous êtes une adresse wallet, rien de plus."
                  : "LookaWin collects zero personal data. No name, no email, no IP address, no KYC. To LookaWin, you are a wallet address, nothing more."
              }
            }
          ]
        }) }} />
        <link rel="icon" href="/favicon.svg" />
        <meta name="theme-color" content="#F3BA2F" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <header className="app-header">
        <a href="/" className="logo"><div className="logo-icon"><i className="fa-solid fa-ticket" style={{color:"#b48eef",fontSize:"0.9rem"}}></i></div><span className="logo-text">lookaWin</span></a>
        <div className="header-actions">
          <button className="btn-lang" onClick={toggleLang}>{lang==="en"?"FR":"EN"}</button>
        </div>
      </header>
      <main style={{maxWidth:480,margin:"0 auto",padding:"28px 14px 60px"}}>
        <div className="a1">
          <h1 style={{fontFamily:"var(--font)",fontWeight:800,fontSize:"1.6rem",color:"var(--gold)",marginBottom:8,textAlign:"center"}}>{c.title}</h1>
          <p style={{color:"var(--muted)",marginBottom:24,textAlign:"center",fontSize:"0.88rem"}}>{c.subtitle}</p>

          <div className="card">
            <p className="card-label">{c.notcollect}</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {c.items.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{color:"#ff6b6b",fontSize:"1.1rem"}}>✕</span>
                  <span style={{color:"var(--text)",fontSize:"0.88rem"}}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="card-label">{c.address}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7}}>{c.addressDesc}</p>
          </div>

          <div className="card">
            <p className="card-label">{c.wallets}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7}}>{c.walletsDesc}</p>
          </div>

          <div style={{background:"linear-gradient(135deg,rgba(180,142,239,0.1),rgba(243,186,47,0.1))",border:"1px solid rgba(180,142,239,0.2)",borderRadius:16,padding:20,marginBottom:14,textAlign:"center"}}>
            <p style={{fontFamily:"var(--font)",fontWeight:800,fontSize:"1.1rem",color:"var(--text)",marginBottom:6}}>{c.tagline}</p>
            <p style={{color:"var(--muted)",fontSize:"0.82rem"}}>{c.taglineSub}</p>
          </div>

          <div style={{textAlign:"center",marginTop:16}}>
            <a href="/" style={{display:"inline-block",padding:"11px 24px",background:"var(--gold)",borderRadius:22,color:"#000",fontWeight:800,fontSize:"0.88rem",textDecoration:"none",fontFamily:"var(--font)"}}>← {c.back}</a>
          </div>
        </div>
      </main>
      <footer className="footer">
        <div className="footer-links">
          <a href="/transparence/" className="footer-link">{c.footer[0]}</a>
          <a href="/anonymat/" className="footer-link">{c.footer[1]}</a>
          <a href="/protocole/" className="footer-link">{c.footer[2]}</a>
        </div>
        <p className="footer-copy">© 2026 LookaWin — Provably Fair · Anonymous · Immutable</p>
      </footer>
    </>
  );
}
