import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import fr from "../locales/fr.json";
import en from "../locales/en.json";

const LANGS = { fr, en };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.looka.win";

export default function Home() {
  const [lang, setLang]               = useState("en");
  const [state, setState]             = useState(null);
  const [winners, setWinners]         = useState([]);
  const [footerPages, setFooterPages] = useState([]);
  const [quantity, setQuantity]       = useState(1);
  const [copied, setCopied]           = useState(false);
  const [countdown, setCountdown]     = useState({ m: "00", s: "00" });
  const [activeTab, setActiveTab]     = useState("hourly");

  useEffect(() => {
    const saved = localStorage.getItem("looka_lang");
    if (saved) setLang(saved);
  }, []);

  const t = (key) => {
    const dict = LANGS[lang] || LANGS["en"];
    return key.split(".").reduce((obj, k) => obj?.[k], dict) || key;
  };

  const fetchState = useCallback(async () => {
    try { const r = await fetch(`${API_URL}/api/state?lang=${lang}`); setState(await r.json()); } catch {}
  }, [lang]);

  const fetchWinners = useCallback(async () => {
    try { const r = await fetch(`${API_URL}/api/winners?lang=${lang}`); const d = await r.json(); setWinners(d.winners || []); } catch {}
  }, [lang]);

  const fetchFooterPages = useCallback(async () => {
    try { const r = await fetch(`${API_URL}/api/pages?lang=${lang}`); const d = await r.json(); setFooterPages(d.pages || []); } catch {}
  }, [lang]);

  useEffect(() => { fetchState(); }, [fetchState]);
  useEffect(() => { fetchWinners(); }, [fetchWinners]);
  useEffect(() => { fetchFooterPages(); }, [fetchFooterPages]);
  useEffect(() => { const i = setInterval(fetchState, 30000); return () => clearInterval(i); }, [fetchState]);

  useEffect(() => {
    const tick = () => {
      const now = new Date(); const next = new Date();
      next.setHours(next.getHours() + 1, 0, 0, 0);
      const diff = next - now;
      setCountdown({ m: Math.floor((diff/60000)%60).toString().padStart(2,"0"), s: Math.floor((diff/1000)%60).toString().padStart(2,"0") });
    };
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, []);

  const toggleLang = () => { const n = lang==="en"?"fr":"en"; setLang(n); localStorage.setItem("looka_lang",n); };
  const copyReferral = () => { navigator.clipboard.writeText(`${window.location.origin}?ref=YOUR_ADDRESS`); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const tabs = [
    { key:"hourly",  label:lang==="fr"?"Horaire":"Hourly",   value:state?.data?.prize },
    { key:"daily",   label:lang==="fr"?"Journalier":"Daily", value:state?.data?.jackpot_daily },
    { key:"weekly",  label:lang==="fr"?"Hebdo":"Weekly",     value:state?.data?.jackpot_weekly },
    { key:"monthly", label:lang==="fr"?"Mensuel":"Monthly",  value:state?.data?.jackpot_monthly },
  ];
  const active = tabs.find(t=>t.key===activeTab)||tabs[0];
  const pct = Math.min(100,((state?.data?.tickets||0)/(state?.data?.min_participants||50))*100);

  return (
    <>
      <Head>
        <title>{t("title")}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
        <meta name="theme-color" content="#F3BA2F" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        .prize-hero {
          background: var(--bg);
          border: 1px solid var(--bg);
          border-radius: var(--radius); padding: 24px 18px 18px;
          margin-bottom: 12px; text-align: center;
          position: relative; overflow: hidden;
        }
        .prize-hero::before {
          content:''; position:absolute; top:-50px; left:50%; transform:translateX(-50%);
          width:220px; height:220px;
          background:radial-gradient(circle,rgba(245,197,24,0.13) 0%,transparent 60%);
          pointer-events:none;
        }
        .prize-amount {
          font-family:var(--font); font-weight:800;
          font-size:clamp(2.2rem,9vw,3.4rem);
          color:var(--gold); line-height:1;
          letter-spacing:-1px; word-break:break-all; position:relative; z-index:1;
        }
        .prize-currency { font-size:0.82rem; color:var(--muted); margin-top:3px; font-weight:600; }
        .countdown { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:18px; }
        .cd-label { color:var(--muted); font-size:0.76rem; }
        .cd-box { background:#b48eef; border:1px solid rgba(180,142,239,0.3); border-radius:10px; padding:6px 12px; text-align:center; min-width:50px; }
        .cd-num { font-family:var(--font); font-weight:800; font-size:1.25rem; color:#ffffff; line-height:1; }
        .cd-unit { font-size:0.56rem; color:#ffffff; margin-top:1px; letter-spacing:1px; }
        .cd-sep { font-family:var(--font); font-weight:800; font-size:1.25rem; color:#ffffff; }
        .progress-row { display:flex; justify-content:space-between; margin-top:16px; margin-bottom:5px; font-size:0.73rem; color:var(--muted); }
        .progress-row strong { color:var(--purple); font-weight:700; }
        .progress-track { height:4px; background:var(--surface3); border-radius:22px; overflow:hidden; }
        .progress-fill { height:100%; background:linear-gradient(90deg,var(--purple),var(--purple2)); border-radius:22px; transition:width 0.6s ease; }

        .tabs { display:flex; gap:5px; background:var(--surface2); border-radius:22px; padding:4px; margin-bottom:14px; }
        .tab { flex:1; padding:7px 4px; border:none; border-radius:22px; font-family:var(--font); font-size:0.76rem; font-weight:700; cursor:pointer; transition:all 0.18s; white-space:nowrap; }
        .tab-on  { background:var(--purple); color:#fff; }
        .tab-off { background:transparent; color:var(--muted); }
        .tab-off:hover { color:var(--text); }
        .jackpot-val { text-align:center; padding:6px 0 2px; }
        .jackpot-num { font-family:var(--font); font-weight:800; font-size:2rem; color:var(--gold); }
        .jackpot-unit { font-size:0.8rem; color:var(--muted); }

        .qty-row { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
        .qty-btn { width:42px; height:42px; background:var(--surface2); border:1px solid var(--border); border-radius:22px; color:var(--purple); font-size:1.3rem; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .qty-btn:hover { border-color:var(--purple); background:var(--purple-dim); }
        .qty-display { flex:1; text-align:center; font-family:var(--font); font-weight:800; font-size:2.4rem; color:var(--text); line-height:1; }
        .quick-btns { display:flex; gap:6px; margin-bottom:14px; }
        .quick-btn { flex:1; padding:7px 0; background:var(--surface2); border:1px solid var(--border); border-radius:22px; color:var(--muted); font-family:var(--font); font-weight:700; font-size:0.82rem; cursor:pointer; transition:all 0.15s; }
        .quick-btn:hover,.quick-btn.active { background:var(--purple-dim); border-color:rgba(180,142,239,0.3); color:var(--purple); }
        .cost-row { display:flex; justify-content:space-between; align-items:center; padding:11px 14px; background:var(--surface2); border:1px solid var(--border); border-radius:22px; margin-bottom:13px; }
        .cost-label { font-size:0.85rem; color:var(--muted); }
        .cost-val { font-family:var(--font); font-weight:800; font-size:1.1rem; color:var(--gold); }
        .btn-buy { width:100%; padding:14px; background:var(--gold); border:none; border-radius:22px; color:#000; font-family:var(--font); font-weight:800; font-size:1rem; cursor:pointer; transition:all 0.18s; }
        .btn-buy:hover { background:var(--gold2); transform:translateY(-1px); box-shadow:0 6px 22px var(--gold-glow); }

        .ref-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .ref-badge { background:var(--purple-dim); border:1px solid rgba(180,142,239,0.2); border-radius:8px; padding:3px 10px; font-size:0.7rem; font-weight:700; color:var(--purple); }
        .ref-row { display:flex; gap:7px; }
        .ref-input { flex:1; padding:10px 13px; background:var(--surface2); border:1px solid var(--border); border-radius:22px; color:var(--muted); font-family:var(--font); font-size:0.78rem; outline:none; }
        .btn-copy { padding:10px 15px; background:var(--purple); border:none; border-radius:22px; color:#fff; font-family:var(--font); font-weight:700; font-size:0.8rem; cursor:pointer; white-space:nowrap; transition:background 0.15s; }
        .btn-copy:hover { background:var(--purple2); }

        .winner-item { display:flex; justify-content:space-between; align-items:center; padding:10px 13px; background:var(--surface2); border:1px solid var(--border); border-radius:22px; margin-bottom:6px; transition:border-color 0.15s; }
        .winner-item:hover { border-color:var(--border2); }
        .winner-round { font-size:0.7rem; color:var(--muted); margin-bottom:2px; }
        .winner-addr { font-family:var(--font); font-weight:700; font-size:0.88rem; color:var(--purple); }
        .winner-amt { font-family:var(--font); font-weight:800; color:var(--gold); font-size:0.92rem; text-align:right; }
        .winner-unit { font-size:0.68rem; color:var(--muted); text-align:right; }

        .btn-connect-header { height:33px; padding:0 15px; background:var(--gold); border:none; border-radius:22px; color:#000; font-family:var(--font); font-weight:700; font-size:0.8rem; cursor:pointer; transition:background 0.15s; }
        .btn-connect-header:hover { background:var(--gold2); }
      `}</style>

      <header className="app-header">
        <div className="logo">
          <div className="logo-icon"><i className="fa-solid fa-ticket" style={{color:"#b48eef",fontSize:"0.9rem"}}></i></div>
          <span className="logo-text">lookaWin</span>
        </div>
        <div className="header-actions">
          <button className="btn-lang" onClick={toggleLang}>{t("lang_switch")}</button>
          <button className="btn-connect-header">{t("connect_wallet")}</button>
        </div>
      </header>

      <main style={{ maxWidth:480, margin:"0 auto", padding:"18px 14px 60px" }}>

        <div className="prize-hero a1">
          <p className="card-label">{t("current_prize")}</p>
          <div className="prize-amount">${state?.data?.prize||"0.00"}</div>
          <p className="prize-currency">USDT</p>
          <div className="countdown">
            <span className="cd-label">{t("next_draw")} →</span>
            <div className="cd-box"><div className="cd-num">{countdown.m}</div><div className="cd-unit">MIN</div></div>
            <span className="cd-sep">:</span>
            <div className="cd-box"><div className="cd-num">{countdown.s}</div><div className="cd-unit">SEC</div></div>
          </div>
          <div className="progress-row">
            <span>{t("participants")}</span>
            <span><strong>{state?.data?.tickets||0}</strong> / {state?.data?.min_participants||50}</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
        </div>

        <div className="card a2">
          <div className="tabs">
            {tabs.map(tab=>(
              <button key={tab.key} className={`tab ${activeTab===tab.key?"tab-on":"tab-off"}`} onClick={()=>setActiveTab(tab.key)}>{tab.label}</button>
            ))}
          </div>
          <div className="jackpot-val">
            <div className="jackpot-num">${active.value||"0.00"}</div>
            <div className="jackpot-unit">USDT</div>
          </div>
        </div>

        <div className="card a3">
          <p className="card-label">{t("tickets_label")}</p>
          <div className="qty-row">
            <button className="qty-btn" onClick={()=>setQuantity(Math.max(1,quantity-1))}>−</button>
            <div className="qty-display">{quantity}</div>
            <button className="qty-btn" onClick={()=>setQuantity(Math.min(500,quantity+1))}>+</button>
          </div>
          <div className="quick-btns">
            {[1,5,10,50,100].map(n=>(
              <button key={n} onClick={()=>setQuantity(n)} className={`quick-btn ${quantity===n?"active":""}`}>{n}</button>
            ))}
          </div>
          <div className="cost-row">
            <span className="cost-label">{t("total_cost")}</span>
            <span className="cost-val">{quantity} USDT</span>
          </div>
          <button className="btn-buy">
            {quantity===1?t("buy_ticket"):t("buy_tickets").replace("{{n}}",quantity)}
          </button>
        </div>

        <div className="card a4">
          <div className="ref-header">
            <p className="card-label" style={{marginBottom:0}}>{t("referral_link")}</p>
            <span className="ref-badge">0.5% / ticket</span>
          </div>
          <div className="ref-row">
            <input readOnly className="ref-input" value={`${typeof window!=="undefined"?window.location.origin:"https://looka.win"}?ref=YOUR_ADDRESS`}/>
            <button className="btn-copy" onClick={copyReferral}>{copied?"✓":t("referral_copy")}</button>
          </div>
        </div>

        <div className="card a5">
          <p className="card-label">{t("winners")}</p>
          {winners.length===0?(
            <div style={{textAlign:"center",padding:"28px 0"}}>
             <i className="fa-solid fa-ticket" style={{color:"#b48eef",fontSize:"1.9rem"}}></i>
              <p style={{color:"var(--muted)",fontSize:"0.85rem"}}>{t("no_winners")}</p>
            </div>
          ):(
            winners.map((w,i)=>(
              <div key={i} className="winner-item">
                <div>
                  <p className="winner-round">{t("round")} #{w.round}</p>
                  <p className="winner-addr">{w.address.slice(0,6)}...{w.address.slice(-4)}</p>
                </div>
                <div>
                  <p className="winner-amt">+${w.amount}</p>
                  <p className="winner-unit">USDT</p>
                </div>
              </div>
            ))
          )}
        </div>

      </main>

      <footer className="footer">
        <div className="footer-links">
          {footerPages.map(p=>(<a key={p.slug} href={`/${p.slug}`} className="footer-link">{p.title}</a>))}
        </div>
        <p className="footer-copy">© 2026 lookaWin — Provably Fair Crypto Lottery</p>
      </footer>
    </>
  );
}
