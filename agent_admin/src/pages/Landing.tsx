import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../api/client";
import { Mark, Wordmark } from "../components/Layout";
import { LangSwitch } from "../i18n";
import { useT } from "../i18n";

const BUSINESSES = [
  { name: "Bakery", color: "#8a4b22", title: "Safia yordamchisi", q: "Do you deliver to Chilanzar?", a: "Yes — same-day delivery to Chilanzar for orders before 15:00, 15 000 so'm. Cakes need a day's notice." },
  { name: "Pharmacy", color: "#1f6b8e", title: "Dori-darmon maslahatchisi", q: "Is ibuprofen 400 in stock at Yunusabad?", a: "Yunusabad branch has it: 12 packs, 18 500 so'm. Open until 23:00. Want me to reserve one?" },
  { name: "Travel agency", color: "#0b6b63", title: "Sayohat bo'yicha yordamchi", q: "Tour to Bukhara this weekend for two?", a: "There's a 2-day Bukhara tour leaving Saturday 07:00 — 1 450 000 so'm for two, hotel and guide included. 4 seats left." },
  { name: "Bank", color: "#2f3e63", title: "Mijozlar xizmati", q: "What documents for a car loan?", a: "Passport, income statement for the last 6 months, and the car's purchase agreement. Decision within 2 working days." },
];

export default function Landing() {
  const { t } = useT();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState(0); // 0 greeting, 1 question, 2 answer
  const b = BUSINESSES[i];

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [i]);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % BUSINESSES.length), 5200);
    return () => clearInterval(t);
  }, []);

  const app = auth.isLoggedIn() ? "/agents" : "/register";

  return (
    <div className="land">
      <div className="wrap">
        <nav>
          <Wordmark />
          <div className="links">
            <LangSwitch />
            <Link to="/login" className="btn ghost">{t("signIn")}</Link>
            <Link to={app} className="btn">{t("createAgent")}</Link>
          </div>
        </nav>

        <section className="hero">
          <div className="bg" />
          <div>
            <h1>{t("heroTitle")}</h1>
            <p className="lede">{t("heroLede")}</p>
            <div className="cta">
              <Link to={app} className="btn lg">{t("createAgent")}</Link>
              <a href="#how" className="btn secondary lg">{t("seeHow")}</a>
            </div>
            <p className="note">{t("heroNote")}</p>
          </div>

          <div className="demo" aria-label="Live demo">
            <div className="chips">
              {BUSINESSES.map((x, k) => <button key={x.name} className={`chip ${k === i ? "active" : ""}`} onClick={() => setI(k)}>{x.name}</button>)}
            </div>
            <div className="demo-site">
              <div className="fake w1" /><div className="fake w2" /><div className="fake w3" /><div className="fake w2" />
              <div className="demo-panel">
                <div className="head" style={{ background: b.color }}><Mark />{b.title}</div>
                <div className="body">
                  <div className="bubble assistant">Assalomu alaykum! How can I help?</div>
                  {phase >= 1 && <div className="bubble user" style={{ background: b.color }}>{b.q}</div>}
                  {phase >= 2 && <div className="bubble assistant">{b.a}</div>}
                </div>
              </div>
              <div className="demo-launch blob lg" style={{ background: b.color }}><i /></div>
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <h2>{t("stepsTitle")}</h2>
          <p className="sub">{t("stepsSub")}</p>
          <div className="steps">
            <div className="step"><div className="n">1</div><h3>{t("s1t")}</h3><p>{t("s1")}</p></div>
            <div className="step"><div className="n">2</div><h3>{t("s2t")}</h3><p>{t("s2")}</p></div>
            <div className="step"><div className="n">3</div><h3>{t("s3t")}</h3><p>{t("s3")}</p></div>
          </div>
        </section>

        <section className="section">
          <h2>{t("channelsLandTitle")}</h2>
          <p className="sub">{t("channelsLandSub")}</p>
          <div className="channels">
            <div className="channel"><span className="dot" />{t("websiteWidget")}</div>
            <div className="channel soon"><span className="dot" />Telegram</div>
            <div className="channel soon"><span className="dot" />Instagram</div>
            <div className="channel soon"><span className="dot" />Facebook</div>
            <div className="channel soon"><span className="dot" />{t("voiceSoon")}</div>
          </div>
        </section>

        <section className="section">
          <div className="snippet-demo">
            <div>
              <h2>{t("wholeIntegration")}</h2>
              <code>&lt;script src="https://app.adaptis.uz/static/widget/agent.js" data-agent-key="ag_…" async&gt;&lt;/script&gt;</code>
            </div>
            <Link to={app} className="btn lg">{t("createAgent")}</Link>
          </div>
        </section>

        <footer><span>adaptis</span><span>{t("madeIn")}</span></footer>
      </div>
    </div>
  );
}
