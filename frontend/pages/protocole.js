import { useState, useEffect } from "react";
import Head from "next/head";

const CONTENT = {
  en: {
    title: "How It Really Works",
    subtitle: "Not a company. Not a platform. A protocol running on a blockchain.",
    ticket: "The Ticket",
    ticketDesc: "1 ticket = 2 USDT. Each ticket is a transaction on BNB Smart Chain. The moment you pay, the funds are automatically distributed:",
    distribution: [
      ["Hourly prize pool","88%","gold"],
      ["Daily jackpot","3%","gold"],
      ["Weekly jackpot","2%","gold"],
      ["Monthly jackpot","1%","gold"],
      ["Referral (if any)","3%","purple"],
      ["Protocol","3–6%","muted"],
    ],
    draw: "The Draw",
    drawDesc: "Every hour, if at least 50 tickets have been purchased, Chainlink Automation triggers the draw. Chainlink VRF generates a verifiable random number to select the winner. The prize is sent instantly and automatically.",
    drawSub: "If the minimum is not reached, the prize pool accumulates to the next draw, making the next jackpot even larger.",
    jackpots: "4 Jackpots",
    jackpotsDesc: "Each ticket enters you into all 4 jackpots simultaneously. Losing the hourly draw doesn't remove you from the daily, weekly, or monthly draws.",
    referral: "Referral",
    referralDesc: "Share your wallet address as a referral link. Every time someone buys a ticket using your link, you earn 3%  automatically, on-chain, forever. Withdraw when your balance reaches 3 USDT.",
    immutable: "Immutability",
    immutableDesc: "The rules encoded in this contract cannot be changed. Not by us. Not by anyone. The ticket price, distribution percentages, minimum participants are all immutables. What you see today is what will run forever.",
    back: "Back to home",
    footer: ["Transparency", "Anonymity", "Protocol"],
  },
  fr: {
    title: "Comment ça marche vraiment",
    subtitle: "Pas une entreprise. Pas une plateforme. Un protocole qui tourne sur une blockchain.",
    ticket: "Le Ticket",
    ticketDesc: "1 ticket = 2 USDT. Chaque ticket est une transaction sur BNB Smart Chain. Au moment où tu paies, les fonds sont automatiquement distribués :",
    distribution: [
      ["Cagnotte horaire","88%","gold"],
      ["Jackpot journalier","3%","gold"],
      ["Jackpot hebdomadaire","2%","gold"],
      ["Jackpot mensuel","1%","gold"],
      ["Parrainage (si existant)","3%","purple"],
      ["Protocole","3–6%","muted"],
    ],
    draw: "Le Tirage",
    drawDesc: "Chaque heure, si au moins 50 tickets ont été achetés, Chainlink Automation déclenche le tirage. Chainlink VRF génère un nombre aléatoire vérifiable pour désigner le gagnant. Le prix est envoyé instantanément et automatiquement.",
    drawSub: "Si le minimum n'est pas atteint, la cagnotte s'accumule au tirage suivant, rendant le prochain jackpot encore plus attractif.",
    jackpots: "4 Jackpots",
    jackpotsDesc: "Chaque ticket t'inscrit simultanément dans les 4 jackpots. Perdre le tirage horaire ne te retire pas des tirages journalier, hebdomadaire ou mensuel.",
    referral: "Parrainage",
    referralDesc: "Partage ton adresse wallet comme lien de parrainage. Chaque fois que quelqu'un achète un ticket via ton lien, tu gagnes 3% automatiquement, on-chain, pour toujours. Retire quand ton solde atteint 3 USDT.",
    immutable: "Immuabilité",
    immutableDesc: "Les règles encodées dans ce contrat ne peuvent pas être modifiées. Ni par nous. Ni par personne. Le prix du ticket, les pourcentages de distribution, le nombre minimum de participants sont  tous immuables. Ce que tu vois aujourd'hui fonctionnera pour toujours.",
    back: "Retour à l'accueil",
    footer: ["Transparence", "Anonymat", "Protocole"],
  }
};

export default function Protocole() {
  const [lang, setLang] = useState("en");
  useEffect(() => { const s = localStorage.getItem("looka_lang"); if (s) setLang(s); }, []);
  const toggleLang = () => { const n = lang==="en"?"fr":"en"; setLang(n); localStorage.setItem("looka_lang",n); };
  const c = CONTENT[lang];

  const colors = { gold: "var(--gold)", purple: "var(--purple)", muted: "var(--muted)" };

  return (
    <>
      <Head>
        <title>{lang==="fr" ? "Comment Fonctionne LookaWin — Protocole Loterie USDT BSC | 4 Jackpots" : "How LookaWin Works — USDT BSC Lottery Protocol | 4 Jackpots"}</title>
        <meta name="description" content={lang==="fr"
          ? "Découvrez le fonctionnement complet de LookaWin : ticket à 2 USDT, 4 jackpots simultanés (horaire, journalier, hebdo, mensuel), parrainage 3%, tirage automatique Chainlink. Zéro intermédiaire."
          : "Discover how LookaWin works: 2 USDT ticket, 4 simultaneous jackpots (hourly, daily, weekly, monthly), 3% referral, automatic Chainlink draw. Zero middleman."
        } />
        <meta name="keywords" content={lang==="fr"
          ? "comment fonctionne loterie crypto, jackpot USDT BSC, parrainage loterie blockchain, loterie 4 jackpots, smart contract loterie explication, tirage automatique chainlink, loterie horaire USDT"
          : "how crypto lottery works, USDT BSC jackpot, blockchain lottery referral, 4 jackpot lottery, smart contract lottery explained, automatic chainlink draw, hourly USDT lottery"
        } />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://looka.win/protocole/" />
        <meta property="og:title" content={lang==="fr" ? "Comment Fonctionne LookaWin — 4 Jackpots · Parrainage 3% · Automatique" : "How LookaWin Works — 4 Jackpots · 3% Referral · Automatic"} />
        <meta property="og:description" content={lang==="fr"
          ? "2 USDT par ticket. 88% aux gagnants. 4 jackpots simultanés. Parrainage 3% on-chain. Tirage automatique toutes les heures."
          : "2 USDT per ticket. 88% to winners. 4 simultaneous jackpots. 3% on-chain referral. Automatic draw every hour."
        } />
        <meta property="og:image" content="https://looka.win/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={lang==="fr" ? "Comment Fonctionne LookaWin" : "How LookaWin Works"} />
        <meta name="twitter:description" content={lang==="fr"
          ? "2 USDT · 88% gagnants · 4 jackpots · Parrainage 3% · Tirage horaire automatique"
          : "2 USDT · 88% to winners · 4 jackpots · 3% referral · Automatic hourly draw"
        } />
        <link rel="canonical" href="https://looka.win/protocole/" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": lang==="fr" ? "Quel est le prix d'un ticket LookaWin ?" : "What is the price of a LookaWin ticket?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": lang==="fr"
                  ? "Un ticket LookaWin coûte 2 USDT (stablecoin), payable sur BNB Smart Chain. Ce prix est fixé dans le contrat immuable et ne peut jamais changer."
                  : "A LookaWin ticket costs 2 USDT (stablecoin), payable on BNB Smart Chain. This price is fixed in the immutable contract and can never change."
              }
            },
            {
              "@type": "Question",
              "name": lang==="fr" ? "À quelle fréquence ont lieu les tirages ?" : "How often do draws take place?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": lang==="fr"
                  ? "LookaWin organise des tirages toutes les heures, automatiquement via Chainlink Automation, si le minimum de 50 participants est atteint."
                  : "LookaWin runs draws every hour, automatically via Chainlink Automation, if the minimum of 50 participants is reached."
              }
            },
            {
              "@type": "Question",
              "name": lang==="fr" ? "Comment fonctionne le parrainage LookaWin ?" : "How does the LookaWin referral program work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": lang==="fr"
                  ? "Partagez votre adresse wallet comme lien de parrainage. Vous gagnez 3% de chaque ticket acheté via votre lien, automatiquement sur la blockchain, à vie. Retrait automatique dès 3 USDT."
                  : "Share your wallet address as a referral link. You earn 3% of every ticket bought through your link, automatically on-chain, forever. Automatic withdrawal from 3 USDT."
              }
            },
            {
              "@type": "Question",
              "name": lang==="fr" ? "Qu'arrive-t-il si le minimum de 50 participants n'est pas atteint ?" : "What happens if the minimum of 50 participants is not reached?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": lang==="fr"
                  ? "Si le minimum de 50 participants n'est pas atteint, la cagnotte s'accumule au tirage suivant, rendant le prochain jackpot encore plus important."
                  : "If the minimum of 50 participants is not reached, the prize pool accumulates to the next draw, making the next jackpot even larger."
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
            <p className="card-label">{c.ticket}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7,marginBottom:12}}>{c.ticketDesc}</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {c.distribution.map(([label,val,color],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"var(--surface2)",borderRadius:10}}>
                  <span style={{color:"var(--muted)",fontSize:"0.82rem"}}>{label}</span>
                  <span style={{color:colors[color],fontWeight:700}}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="card-label">{c.draw}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7}}>{c.drawDesc}</p>
            <p style={{color:"var(--muted)",fontSize:"0.82rem",marginTop:8}}>{c.drawSub}</p>
          </div>

          <div className="card">
            <p className="card-label">{c.jackpots}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7}}>{c.jackpotsDesc}</p>
          </div>

          <div className="card">
            <p className="card-label">{c.referral}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7}}>{c.referralDesc}</p>
          </div>

          <div className="card">
            <p className="card-label">{c.immutable}</p>
            <p style={{color:"var(--text)",fontSize:"0.85rem",lineHeight:1.7}}>{c.immutableDesc}</p>
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
