import { useState, useEffect } from "react";
import Head from "next/head";

const CONTENT = {
  en: {
    title: "The Code is the Law",
    subtitle: "Every rule, every payout, every draw are verifiable on-chain by anyone, forever.",
    contract: "Smart Contract",
    contractDesc: "Deployed on BNB Smart Chain · Ownership renounced · No admin functions",
    params: "Immutable Parameters",
    ticket: "Ticket Price", ticketVal: "2 USDT (BEP-20)",
    min: "Min. Participants", minVal: "50",
    hourly: "Hourly Prize Pool", hourlyVal: "88%",
    referral: "Referral", referralVal: "3%",
    vrf: "Provably Fair — Chainlink VRF",
    vrfDesc: "Every draw uses Chainlink VRF, a cryptographic proof that the random number was generated fairly and cannot be manipulated by anyone, including Looka.",
    automation: "Autonomous — Chainlink Automation",
    automationDesc: "Draws are triggered automatically every hour by Chainlink Automation. No human can stop, delay, or manipulate the draw schedule.",
    treasury: "Protocol fundss",
    treasuryDesc: "Protocol funds are automatically transferred to the treasury every day at 03:13 GMT without any human action. The treasury address is immutable.",
    github: "View Source Code on GitHub →",
    back: "Back to home",
    footer: ["Transparency", "Anonymity", "Protocol"],
  },
  fr: {
    title: "Le Code est la Loi",
    subtitle: "Chaque règle, chaque paiement, chaque tirage sont vérifiables on-chain par n'importe qui, pour toujours.",
    contract: "Smart Contract",
    contractDesc: "Déployé sur BNB Smart Chain · Ownership renoncé · Aucune fonction admin",
    params: "Paramètres Immuables",
    ticket: "Prix du ticket", ticketVal: "2 USDT (BEP-20)",
    min: "Min. Participants", minVal: "50",
    hourly: "Cagnotte horaire", hourlyVal: "88%",
    referral: "Parrainage", referralVal: "3%",
    vrf: "Transparence prouvée — Chainlink VRF",
    vrfDesc: "Chaque tirage utilise Chainlink VRF, une preuve cryptographique que le nombre aléatoire a été généré équitablement et ne peut être manipulé par personne, pas même Looka.",
    automation: "Autonome — Chainlink Automation",
    automationDesc: "Les tirages sont déclenchés automatiquement toutes les heures par Chainlink Automation. Aucun humain ne peut arrêter, retarder ou manipuler le calendrier des tirages.",
    treasury: "Fonds protocole",
    treasuryDesc: "Les fonds du ptotocole  sont automatiquement transférés vers le treasury chaque jour à 03:13 GMT, sans aucune action humaine. L'adresse treasury est immuable.",
    github: "Voir le code source sur GitHub →",
    back: "Retour à l'accueil",
    footer: ["Transparence", "Anonymat", "Protocole"],
  }
};

export default function Transparence() {
  const [lang, setLang] = useState("en");
  useEffect(() => { const s = localStorage.getItem("looka_lang"); if (s) setLang(s); }, []);
  const toggleLang = () => { const n = lang==="en"?"fr":"en"; setLang(n); localStorage.setItem("looka_lang",n); };
  const c = CONTENT[lang];

  return (
    <>
      <Head>
        <title>{lang==="fr" ? "Transparence Prouvée — LookaWin | Loterie Blockchain Vérifiable" : "Provably Fair — LookaWin | Verifiable Blockchain Lottery"}</title>
        <meta name="description" content={lang==="fr"
          ? "Vérifiez chaque tirage LookaWin sur la blockchain. Chainlink VRF garantit un hasard inviolable. Contrat immuable, zéro admin, zéro manipulation possible. Le code est la loi."
          : "Verify every LookaWin draw on the blockchain. Chainlink VRF guarantees tamper-proof randomness. Immutable contract, zero admin, zero manipulation possible. The code is the law."
        } />
        <meta name="keywords" content={lang==="fr"
          ? "loterie provably fair, loterie blockchain vérifiable, Chainlink VRF loterie, loterie immuable, smart contract loterie, loterie transparente BSC"
          : "provably fair lottery, verifiable blockchain lottery, Chainlink VRF lottery, immutable lottery, smart contract lottery, transparent BSC lottery"
        } />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://looka.win/transparence/" />
        <meta property="og:title" content={lang==="fr" ? "Transparence Prouvée — LookaWin" : "Provably Fair — LookaWin"} />
        <meta property="og:description" content={lang==="fr"
          ? "Chaque tirage est vérifiable sur la blockchain. Chainlink VRF, Chainlink Automation, contrat immuable."
          : "Every draw is verifiable on the blockchain. Chainlink VRF, Chainlink Automation, immutable contract."
        } />
        <meta property="og:image" content="https://looka.win/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={lang==="fr" ? "Transparence Prouvée — LookaWin" : "Provably Fair — LookaWin"} />
        <meta name="twitter:description" content={lang==="fr" ? "Chaque tirage vérifiable sur la blockchain. Chainlink VRF. Zéro manipulation." : "Every draw verifiable on the blockchain. Chainlink VRF. Zero manipulation."} />
        <link rel="canonical" href="https://looka.win/transparence/" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": lang==="fr" ? "Comment LookaWin garantit-il l'équité des tirages ?" : "How does LookaWin guarantee fair draws?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": lang==="fr"
                  ? "LookaWin utilise Chainlink VRF (Verifiable Random Function), une solution cryptographique qui génère des nombres aléatoires vérifiables et inviolables sur la blockchain."
                  : "LookaWin uses Chainlink VRF (Verifiable Random Function), a cryptographic solution that generates verifiable, tamper-proof random numbers on the blockchain."
              }
            },
            {
              "@type": "Question",
              "name": lang==="fr" ? "Peut-on modifier les règles du contrat LookaWin ?" : "Can LookaWin's contract rules be changed?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": lang==="fr"
                  ? "Non. Le contrat LookaWin est immuable. Aucun admin, aucun owner, aucune fonction de modification. Les règles encodées dans le contrat sont permanentes."
                  : "No. The LookaWin contract is immutable. No admin, no owner, no modification functions. The rules encoded in the contract are permanent."
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
            <p className="card-label">{c.contract}</p>
            <a href="https://bscscan.com/address/0xF46a04EaDDaC99fe9eD79E76aFeCdb4d04EF591C#code" target="_blank" style={{fontFamily:"var(--font)",fontWeight:800,color:"var(--gold)",fontSize:"0.78rem",wordBreak:"break-all",textDecoration:"none"}}>0xF46a04EaDDaC99fe9eD79E76aFeCdb4d04EF591C</a>
            <p style={{color:"var(--muted)",fontSize:"0.75rem",marginTop:6}}>{c.contractDesc}</p>
          </div>

          <div className="card">
            <p className="card-label">{c.params}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[[c.ticket,c.ticketVal],[c.min,c.minVal],[c.hourly,c.hourlyVal],[c.referral,c.referralVal]].map(([label,val],i)=>(
                <div key={i} style={{background:"var(--surface2)",borderRadius:10,padding:10}}>
                  <p style={{color:"var(--muted)",fontSize:"0.68rem"}}>{label}</p>
                  <p style={{fontFamily:"var(--font)",fontWeight:800,color:"var(--text)"}}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="card-label">{c.vrf}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7}}>{c.vrfDesc}</p>
          </div>

          <div className="card">
            <p className="card-label">{c.automation}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7}}>{c.automationDesc}</p>
          </div>

          <div className="card">
            <p className="card-label">{c.treasury}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7}}>{c.treasuryDesc}</p>
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
