/* Adaptis widget — embed with:
   <script src="https://API/static/widget/agent.js" data-agent-key="ag_…" async></script>
   Zero dependencies. Renders inside a Shadow DOM so host CSS never leaks in or out. */
(function () {
  "use strict";
  var script = document.currentScript || (function () { var s = document.getElementsByTagName("script"); return s[s.length - 1]; })();
  var KEY = script.getAttribute("data-agent-key");
  if (!KEY) return console.warn("[adaptis] data-agent-key missing");
  var API = script.getAttribute("data-api") || new URL(script.src).origin;
  var BASE = API + "/w/" + KEY;
  var LS = "adaptis_" + KEY;

  /* ---------- state ---------- */
  var state = load();
  function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }
  if (!state.visitor) { state.visitor = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36); save(); }

  /* ---------- fetch config, then mount ---------- */
  fetch(BASE + "/config/").then(function (r) { if (!r.ok) throw r; return r.json(); }).then(mount)
    .catch(function (e) { console.warn("[adaptis] could not load widget config", e); });

  function mount(cfg) {
    var host = document.createElement("div");
    host.id = "adaptis-widget-root";
    host.style.cssText = "all:initial;position:fixed;z-index:2147483000;bottom:0;" + (cfg.position === "bottom-left" ? "left:0" : "right:0");
    document.body.appendChild(host);
    var root = host.attachShadow({ mode: "open" });
    var left = cfg.position === "bottom-left";
    var color = cfg.primary_color || "#2F5597";

    root.innerHTML =
      "<style>" + css(color, left) + "</style>" +
      '<div class="panel" id="panel">' +
        '<div class="head">' +
          (cfg.avatar ? '<img class="avatar" src="' + esc(cfg.avatar) + '">' : '<div class="avatar glyph">' + ICON_SPARK.replace('class="i-open" ', '') + '</div>') +
          '<div class="head-t"><div class="title">' + esc(cfg.title) + '</div><div class="sub">' + esc(cfg.agent_name) + "</div></div>" +
          '<button class="icon" id="call" title="Voice call (soon)" disabled>' + ICON_PHONE + "</button>" +
          '<button class="icon" id="close" title="Close">' + ICON_X + "</button>" +
        "</div>" +
        '<div class="msgs" id="msgs"></div>' +
        '<form class="input" id="form"><textarea id="in" rows="1" placeholder="' + esc(cfg.placeholder) + '"></textarea>' +
          '<button class="send" id="send" type="submit">' + ICON_SEND + "</button></form>" +
        (cfg.show_branding ? '<div class="brand">Powered by <b>Adaptis</b></div>' : "") +
      "</div>" +
      '<button class="launcher" id="launch" aria-label="Open chat">' + ICON_SPARK + ICON_X + "</button>";

    var $ = function (id) { return root.getElementById(id); };
    var panel = $("panel"), msgs = $("msgs"), input = $("in"), form = $("form"), send = $("send"), launch = $("launch");
    var open = false, busy = false;

    function toggle(o) { open = o == null ? !open : o; host.classList.toggle("open", open); panel.classList.toggle("open", open); launch.classList.toggle("open", open); if (open) setTimeout(function () { input.focus(); }, 50); }
    launch.onclick = function () { toggle(); };
    $("close").onclick = function () { toggle(false); };

    function bubble(role, text) {
      var b = document.createElement("div"); b.className = "b " + role; b.textContent = text; msgs.appendChild(b); msgs.scrollTop = msgs.scrollHeight; return b;
    }
    function note(text) { var n = document.createElement("div"); n.className = "note"; n.textContent = text; msgs.appendChild(n); msgs.scrollTop = msgs.scrollHeight; }

    /* restore previous session or greet */
    (state.conversation
      ? fetch(BASE + "/history/?visitor_id=" + state.visitor + "&conversation_id=" + state.conversation).then(function (r) { return r.ok ? r.json() : []; })
      : Promise.resolve([])
    ).then(function (hist) {
      if (!hist.length) bubble("assistant", cfg.greeting);
      hist.forEach(function (m) { bubble(m.role, m.content); });
      if (!cfg.is_ready) note("This assistant is still being set up.");
    });

    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });

    form.onsubmit = function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      input.value = ""; input.style.height = "auto";
      bubble("user", text);
      var out = bubble("assistant", ""); out.classList.add("typing");
      busy = true; send.disabled = true;

      fetch(BASE + "/chat/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_id: state.visitor, conversation_id: state.conversation || undefined, message: text, page_url: location.href, stream: true }),
      }).then(function (r) {
        if (!r.ok) return r.json().then(function (d) { throw new Error(d.detail || r.status); });
        return readSSE(r, function (ev) {
          if (ev.conversation_id) { state.conversation = ev.conversation_id; save(); }
          if (ev.token) { out.classList.remove("typing"); out.textContent += ev.token; msgs.scrollTop = msgs.scrollHeight; }
        });
      }).catch(function (err) {
        out.classList.remove("typing"); out.textContent = err.message || "Something went wrong.";
        if (/no indexed|not allowed/i.test(err.message)) { state.conversation = null; save(); }
      }).then(function () { busy = false; send.disabled = false; input.focus(); });
    };
  }

  /* ---------- SSE reader over fetch ---------- */
  function readSSE(res, onEvent) {
    var reader = res.body.getReader(), dec = new TextDecoder(), buf = "";
    return reader.read().then(function step(r) {
      if (r.done) return;
      buf += dec.decode(r.value, { stream: true });
      var parts = buf.split("\n\n"); buf = parts.pop();
      parts.forEach(function (p) { var line = p.split("\n").filter(function (l) { return l.indexOf("data:") === 0; })[0]; if (line) { try { onEvent(JSON.parse(line.slice(5))); } catch (e) {} } });
      return reader.read().then(step);
    });
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var ICON_SPARK = '<svg class="i-open" viewBox="0 0 24 24" width="26" height="26" fill="#fff"><circle cx="6" cy="12" r="2.3"/><circle cx="12" cy="12" r="2.3"/><circle cx="18" cy="12" r="2.3"/></svg>';
  var ICON_X = '<svg class="i-x" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 11.5L21 3l-7 18-2.5-7.5z"/></svg>';
  var ICON_PHONE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>';

  function css(color, left) {
    var side = left ? "left" : "right";
    return (
      ":host{all:initial}*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif}" +
      ".launcher{position:fixed;bottom:20px;" + side + ":20px;width:60px;height:60px;border-radius:58% 42% 55% 45%/50% 60% 40% 50%;animation:adaptis-morph 7s ease-in-out infinite;border:0;background:" + color + ";color:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.22);transition:transform .15s}" +
      ".launcher:hover{transform:scale(1.06)}.launcher svg{grid-area:1/1;transition:opacity .15s,transform .2s}.launcher .i-x{opacity:0;transform:rotate(-90deg)}.launcher.open .i-x{opacity:1;transform:none}.launcher.open .i-open{opacity:0;transform:rotate(90deg)}" +
      ".panel{position:fixed;bottom:92px;" + side + ":20px;width:370px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 112px);background:#fff;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;opacity:0;pointer-events:none;transform:translateY(12px) scale(.98);transition:opacity .18s,transform .18s}" +
      ".panel.open{opacity:1;pointer-events:auto;transform:none}" +
      ".head{display:flex;align-items:center;gap:10px;padding:14px 14px 14px 16px;background:" + color + ";color:#fff}.avatar{width:36px;height:36px;border-radius:58% 42% 55% 45%/50% 60% 40% 50%;object-fit:cover;background:rgba(255,255,255,.2);display:grid;place-items:center}.avatar svg{width:20px;height:20px}.head-t{flex:1;min-width:0}.title{font-weight:700;font-size:15px}.sub{font-size:12px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".icon{background:rgba(255,255,255,.14);border:0;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;display:grid;place-items:center}.icon:hover{background:rgba(255,255,255,.24)}.icon:disabled{opacity:.4;cursor:default}" +
      ".msgs{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:8px;background:#f6f8fb}" +
      ".b{max-width:82%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}.b.user{align-self:flex-end;background:" + color + ";color:#fff;border-bottom-right-radius:5px}.b.assistant{align-self:flex-start;background:#fff;color:#16212e;border:1px solid #e6eaf0;border-bottom-left-radius:5px}" +
      ".b.typing{min-width:56px}.b.typing::after{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:#9aa6b8;box-shadow:12px 0 #9aa6b8,24px 0 #9aa6b8;animation:dots 1s infinite}@keyframes adaptis-morph{0%,100%{border-radius:58% 42% 55% 45%/50% 60% 40% 50%}33%{border-radius:45% 55% 40% 60%/60% 45% 55% 40%}66%{border-radius:52% 48% 60% 40%/42% 52% 48% 58%}}@keyframes dots{0%,100%{opacity:.3}50%{opacity:1}}" +
      ".note{align-self:center;font-size:12px;color:#8a94a6;background:#eef1f5;padding:4px 10px;border-radius:999px}" +
      ".input{display:flex;align-items:flex-end;gap:8px;padding:10px 12px;border-top:1px solid #e6eaf0;background:#fff}textarea{flex:1;resize:none;border:1px solid #e6eaf0;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.4;max-height:120px;outline:none;color:#16212e}textarea:focus{border-color:" + color + "}" +
      ".send{width:40px;height:40px;border-radius:50%;border:0;background:" + color + ";color:#fff;cursor:pointer;display:grid;place-items:center;flex-shrink:0}.send:disabled{opacity:.5}" +
      ".brand{text-align:center;font-size:11px;color:#9aa6b8;padding:6px;background:#fff}.brand b{color:#6b7686}" +
      "@media (max-width:480px){.panel{" + side + ":0;bottom:0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0}.launcher{bottom:16px;" + side + ":16px}.panel.open~.launcher{display:none}}"
    );
  }
})();
