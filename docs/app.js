// SeisDFE project page — static build (Preact + htm).
import { h, render, Component } from "./vendor/preact.module.js";
import htm from "./vendor/htm.module.js";
const html = htm.bind(h);

const view = (V) => html`<div style="position:relative;min-height:100vh;background:#08090b">

  <div data-progress="1" style="position:fixed;top:0;left:0;height:2px;width:0%;background:linear-gradient(90deg,rgba(235,162,74,.25),#eba24a);z-index:60;transition:width .12s linear"></div>

  <nav style="position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px clamp(18px,4vw,56px);background:rgba(8,9,11,.72);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.07)">
    <a href="#top" style="display:flex;align-items:center;gap:10px;color:#e9eaec">
      <span style="width:9px;height:9px;border-radius:50%;background:#eba24a;animation:pulseDot 2.8s ease-in-out infinite"></span>
      <span style="font-family:'Roboto Mono',monospace;font-size:14px;letter-spacing:.14em;font-weight:500">SeisDFE</span>
    </a>
    <div style="display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px clamp(14px,2.4vw,30px)">
      <a href="#overview" style="font-size:13px;color:#9a9da2;letter-spacing:.02em" class="hv1">${V.t.navOverview}</a>
      <a href="#method" style="font-size:13px;color:#9a9da2;letter-spacing:.02em" class="hv1">${V.t.navMethod}</a>
      <a href="#results" style="font-size:13px;color:#9a9da2;letter-spacing:.02em" class="hv1">${V.t.navResults}</a>
      <a href="#applications" style="font-size:13px;color:#9a9da2;letter-spacing:.02em" class="hv1">${V.t.navApps}</a>
      <a href="#citation" style="font-size:13px;color:#9a9da2;letter-spacing:.02em" class="hv1">${V.t.navCite}</a>
      <div style="display:flex;align-items:center;padding:3px;gap:2px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.03)">
        <button type="button" onclick=${(V.setEn)} style=${(V.enBtn)}>EN</button>
        <button type="button" onclick=${(V.setZh)} style=${(V.zhBtn)}>中文</button>
      </div>
    </div>
  </nav>

  <header id="top" style="position:relative;overflow:hidden;padding:clamp(120px,17vh,190px) clamp(18px,4vw,56px) clamp(60px,9vh,110px)">
    <canvas data-hero="1" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;opacity:.85;mask-image:linear-gradient(180deg,rgba(0,0,0,.15),#000 35%,rgba(0,0,0,.05));-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.15),#000 35%,rgba(0,0,0,.05))"></canvas>
    <div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 12% 0%,rgba(235,162,74,.10),transparent 60%)"></div>
    <div style="position:relative;max-width:1180px;margin:0 auto">
      <div style="display:inline-flex;align-items:center;gap:10px;padding:7px 14px;border:1px solid rgba(235,162,74,.35);border-radius:999px;background:rgba(235,162,74,.07);animation:fadeIn .9s ease both">
        <span style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.18em;color:#eba24a;text-transform:uppercase">${V.t.badge}</span>
      </div>
      <h1 style="margin:28px 0 0;font-size:clamp(58px,11vw,150px);line-height:.9;font-weight:600;letter-spacing:-.04em;animation:floatIn 1s cubic-bezier(.2,.7,.2,1) .05s both">SeisDFE</h1>
      <p style="margin:22px 0 0;max-width:900px;font-size:clamp(19px,2.4vw,30px);line-height:1.34;font-weight:300;color:#d6d8db;letter-spacing:-.01em;animation:floatIn 1s cubic-bezier(.2,.7,.2,1) .16s both">${V.t.tagline}</p>
      <p style="margin:26px 0 0;max-width:900px;display:flex;flex-wrap:wrap;gap:4px 16px;font-size:15px;line-height:1.7;color:#c3c6ca;animation:floatIn 1s cubic-bezier(.2,.7,.2,1) .26s both">
        ${(V.t.authors || []).map((au, $index) => html`
          <span style="white-space:nowrap">${au.n}<sup style="margin-left:2px;font-family:'Roboto Mono',monospace;font-size:10px;color:#eba24a">${au.s}</sup></span>
        `)}
      </p>
      <ol style="margin:14px 0 0;padding:0;list-style:none;max-width:900px;display:grid;gap:5px;animation:floatIn 1s cubic-bezier(.2,.7,.2,1) .32s both">
        ${(V.t.affil || []).map((af, $index) => html`
          <li style="display:flex;gap:10px;font-family:'Roboto Mono',monospace;font-size:12px;line-height:1.6;color:#8b8e94"><span style="flex:none;width:12px;color:#eba24a">${af.n}</span><span>${af.t}</span></li>
        `)}
        <li style="display:flex;gap:10px;font-family:'Roboto Mono',monospace;font-size:12px;line-height:1.6;color:#8b8e94"><span style="flex:none;width:12px;color:#eba24a">*</span><span>${V.t.corr} <a href="mailto:xinmwu@ustc.edu.cn">xinmwu@ustc.edu.cn</a></span></li>
      </ol>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:38px;animation:floatIn 1s cubic-bezier(.2,.7,.2,1) .4s both">
        <a href=${(V.paperHref)} target=${(V.paperTarget)} rel="noopener noreferrer" onclick=${(V.onLink)} data-link="paper" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:999px;background:#eba24a;color:#120d06;font-size:14px;font-weight:600;letter-spacing:.01em;transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s" class="hv2">
          <span style="font-family:'Roboto Mono',monospace;font-size:11px;opacity:.6">01</span>${V.t.btnPaper}
        </a>
        <a href=${(V.codeHref)} target=${(V.codeTarget)} rel="noopener noreferrer" onclick=${(V.onLink)} data-link="code" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:999px;border:1px solid rgba(255,255,255,.16);color:#e9eaec;font-size:14px;font-weight:500;background:rgba(255,255,255,.02);transition:transform .25s cubic-bezier(.2,.7,.2,1),border-color .25s,background .25s" class="hv3">
          <span style="font-family:'Roboto Mono',monospace;font-size:11px;opacity:.5">02</span>${V.t.btnCode}
        </a>
        <a href=${(V.weightsHref)} target=${(V.weightsTarget)} rel="noopener noreferrer" onclick=${(V.onLink)} data-link="weights" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:999px;border:1px solid rgba(255,255,255,.16);color:#e9eaec;font-size:14px;font-weight:500;background:rgba(255,255,255,.02);transition:transform .25s cubic-bezier(.2,.7,.2,1),border-color .25s,background .25s" class="hv3">
          <span style="font-family:'Roboto Mono',monospace;font-size:11px;opacity:.5">03</span>${V.t.btnWeights}
        </a>
      </div>
    </div>
  </header>

  <section style="padding:0 clamp(18px,4vw,56px)">
    <div data-reveal="1" style="max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:1px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;opacity:0">
      <div style="padding:26px 24px;background:#0b0c0f">
        <div style="font-family:'Roboto Mono',monospace;font-size:clamp(26px,3.4vw,38px);color:#eba24a;letter-spacing:-.02em">7B</div>
        <div style="margin-top:8px;font-size:12.5px;color:#8b8e94;line-height:1.5">${V.t.statParams}</div>
      </div>
      <div style="padding:26px 24px;background:#0b0c0f">
        <div style="font-family:'Roboto Mono',monospace;font-size:clamp(26px,3.4vw,38px);color:#e9eaec;letter-spacing:-.02em">5.34M</div>
        <div style="margin-top:8px;font-size:12.5px;color:#8b8e94;line-height:1.5">${V.t.statImages}</div>
      </div>
      <div style="padding:26px 24px;background:#0b0c0f">
        <div style="font-family:'Roboto Mono',monospace;font-size:clamp(26px,3.4vw,38px);color:#e9eaec;letter-spacing:-.02em">500+</div>
        <div style="margin-top:8px;font-size:12.5px;color:#8b8e94;line-height:1.5">${V.t.statVolumes}</div>
      </div>
      <div style="padding:26px 24px;background:#0b0c0f">
        <div style="font-family:'Roboto Mono',monospace;font-size:clamp(26px,3.4vw,38px);color:#e9eaec;letter-spacing:-.02em">200,000</div>
        <div style="margin-top:8px;font-size:12.5px;color:#8b8e94;line-height:1.5">${V.t.statArea}</div>
      </div>
      <div style="padding:26px 24px;background:#0b0c0f">
        <div style="font-family:'Roboto Mono',monospace;font-size:clamp(26px,3.4vw,38px);color:#e9eaec;letter-spacing:-.02em">902</div>
        <div style="margin-top:8px;font-size:12.5px;color:#8b8e94;line-height:1.5">${V.t.statGpu}</div>
      </div>
    </div>
  </section>

  <section id="overview" style="padding:clamp(80px,12vh,150px) clamp(18px,4vw,56px) 0">
    <div style="max-width:1180px;margin:0 auto">
      <div data-reveal="1" style="opacity:0">
        <div style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.2em;color:#eba24a;text-transform:uppercase">${V.t.kAbstract}</div>
        <h2 style="margin:16px 0 0;font-size:clamp(30px,4.4vw,56px);line-height:1.04;font-weight:500;letter-spacing:-.03em">${V.t.absTitle}</h2>
      </div>
      <div style="margin-top:44px;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:clamp(28px,4vw,56px);align-items:start">
      <div data-reveal="1" style="opacity:0">
        <div style="border:1px solid rgba(255,255,255,.09);border-radius:16px;overflow:hidden;background:#0b0c0f">
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.08)">
            <div>
              <div style="font-size:15px;font-weight:500">${V.t.wTitle}</div>
              <div style="margin-top:6px;font-family:'Roboto Mono',monospace;font-size:11px;color:#7a7d84;letter-spacing:.1em">${V.t.wSub}</div>
            </div>
            <div style="font-family:'Roboto Mono',monospace;font-size:12px;letter-spacing:.08em"><span style="color:#7a7d84">${V.t.wLayer} </span><span style="color:#eba24a">${V.layer}</span><span style="color:#7a7d84"> / 40</span></div>
          </div>
          <div style="padding:16px 20px 20px">
            <div data-cmp="1" style="position:relative;aspect-ratio:643 / 552;border-radius:10px;overflow:hidden;background:#15171b">
              <img src=${(V.layerSrc)} alt=${(V.layerAlt)} style=${String("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:opacity .45s ease,filter .45s ease;opacity:" + "" + (V.featOpacity) + "" + ";filter:" + "" + (V.featFilter))} />
              <div style="position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--split, 100%)) 0 0)">
                <img src="assets/seismic.webp" alt=${(V.t.wSeisAlt)} style="width:100%;height:100%;object-fit:cover;display:block" />
              </div>
              <span data-tag="l" style="position:absolute;left:10px;top:10px;padding:5px 9px;border-radius:999px;background:rgba(8,9,11,.78);font-family:'Roboto Mono',monospace;font-size:10px;letter-spacing:.14em;color:#e9eaec;transition:opacity .25s;pointer-events:none">${V.t.wTagSeis}</span>
              <span data-tag="r" style="position:absolute;right:10px;top:10px;padding:5px 9px;border-radius:999px;background:rgba(8,9,11,.78);font-family:'Roboto Mono',monospace;font-size:10px;letter-spacing:.14em;color:#eba24a;transition:opacity .25s;pointer-events:none">${V.featTag}</span>
              <div aria-hidden="true" style="position:absolute;top:0;bottom:0;left:var(--split, 100%);width:1px;background:rgba(246,246,244,.9);pointer-events:none">
                <span style="position:absolute;left:0;top:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#eba24a;color:#120d06;font-family:'Roboto Mono',monospace;font-size:14px;font-weight:600;box-shadow:0 6px 22px rgba(0,0,0,.45)">‹›</span>
              </div>
              <label for="pca-reveal" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap">${V.t.wRangeLabel}</label>
              <input id="pca-reveal" type="range" min="0" max="100" step="1" oninput=${(V.onScrub)} onpointerdown=${(V.pauseTour)} style="position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize;touch-action:pan-y" />
            </div>

            <div style="margin-top:14px;display:flex;flex-wrap:wrap;align-items:center;gap:12px">
              <div role="group" aria-label=${(V.t.wLayers)} style="display:flex;gap:6px">
                ${(V.layers || []).map((l, $index) => html`
                  <button type="button" onclick=${(l.pick)} aria-pressed=${(l.pressed)} style=${(l.style)}>${l.n}</button>
                `)}
              </div>
              <div style="flex:1 1 150px;display:flex;align-items:center;gap:10px;min-width:150px">
                <span style=${(V.tourDot)}></span>
                <span style="font-family:'Roboto Mono',monospace;font-size:10.5px;letter-spacing:.1em;color:#9a9da2;white-space:nowrap">${V.tourState}</span>
                <span style="flex:1;height:2px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden"><span data-tour-fill="1" style="display:block;height:100%;width:100%;background:#eba24a;transform:scaleX(0);transform-origin:left"></span></span>
              </div>
              <button type="button" onclick=${(V.toggleTour)} aria-pressed=${(V.tourPressed)} style="height:40px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.03);color:#d6d8db;font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.08em;cursor:pointer;transition:border-color .25s,background .25s" class="hv4">${V.tourBtn}</button>
            </div>

            <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#d6d8db"><span style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.12em;color:#eba24a;margin-right:8px">L${V.layer}</span>${V.layerDesc}</p>
            <p style="margin:8px 0 0;font-size:12.5px;line-height:1.65;color:#7a7d84">${V.t.wNote}</p>
          </div>
        </div>
      </div>
      <div data-reveal="1" style="opacity:0">
        <p style="margin:0;font-size:clamp(15px,1.3vw,16.5px);line-height:1.85;color:#c3c6ca;text-wrap:pretty">${V.t.abstract1}</p>
        <p style="margin:20px 0 0;font-size:clamp(15px,1.3vw,16.5px);line-height:1.85;color:#c3c6ca;text-wrap:pretty">${V.t.abstract2}</p>
        <p style="margin:20px 0 0;font-size:clamp(15px,1.3vw,16.5px);line-height:1.85;color:#c3c6ca;text-wrap:pretty">${V.t.abstract3}</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:28px">
          ${(V.t.keywords || []).map((kw, $index) => html`
            <span style="padding:6px 12px;border:1px solid rgba(255,255,255,.12);border-radius:999px;font-family:'Roboto Mono',monospace;font-size:11px;color:#9a9da2">${kw}</span>
          `)}
        </div>
      </div>
      </div>
    </div>
  </section>

  <section id="method" style="padding:clamp(80px,12vh,150px) clamp(18px,4vw,56px) 0">
    <div style="max-width:1180px;margin:0 auto">
      <div data-reveal="1" style="opacity:0">
        <div style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.2em;color:#eba24a;text-transform:uppercase">${V.t.kMethod}</div>
        <h2 style="margin:16px 0 0;font-size:clamp(30px,4.4vw,56px);line-height:1.04;font-weight:500;letter-spacing:-.03em">${V.t.methodTitle}</h2>
        <p style="margin:20px 0 0;font-size:16px;line-height:1.8;color:#9a9da2;text-wrap:pretty">${V.t.methodLede}</p>
      </div>

      <div data-reveal="1" style="opacity:0;margin-top:44px">
        <button type="button" onclick=${(V.openFig)} aria-label=${(V.t.enlarge)} style="display:block;width:100%;padding:14px;border-radius:16px;background:#f6f6f4;border:1px solid rgba(255,255,255,.1);cursor:zoom-in;transition:transform .4s cubic-bezier(.2,.7,.2,1),box-shadow .4s" class="hv5">
          <img src="assets/fig1.webp" alt=${(V.t.alt.fig1)} style="width:100%;display:block" />
        </button>
        <p style="margin:14px 0 0;font-size:13.5px;line-height:1.7;color:#8b8e94"><span style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.14em;color:#eba24a;margin-right:10px">FIG. 1</span>${V.t.fig1}</p>
      </div>

      <div data-reveal="1" style="opacity:0;margin-top:56px;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px">
        ${(V.stages || []).map((s, $index) => html`
          <div style=${String("position:relative;padding:26px 24px 24px;border:1px solid " + "" + (s.border) + "" + ";border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01));transition:border-color .35s,transform .35s cubic-bezier(.2,.7,.2,1)")} class="hv6">
            <div style=${String("font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.18em;color:" + "" + (s.numColor))}>${s.num}</div>
            <h3 style="margin:14px 0 0;font-size:20px;font-weight:500;letter-spacing:-.01em">${s.title}</h3>
            <p style="margin:12px 0 0;font-size:14px;line-height:1.75;color:#9a9da2">${s.body}</p>
            <div style="margin-top:20px;display:grid;gap:1px;background:rgba(255,255,255,.07);border-radius:9px;overflow:hidden">
              ${(s.specs || []).map((sp, $index) => html`
                <div style="display:flex;justify-content:space-between;gap:12px;padding:9px 12px;background:#0b0c0f;font-family:'Roboto Mono',monospace;font-size:11.5px">
                  <span style="color:#7a7d84">${sp.k}</span>
                  <span style="color:#d6d8db;text-align:right">${sp.v}</span>
                </div>
              `)}
            </div>
          </div>
        `)}
      </div>

      <div data-reveal="1" style="opacity:0;margin-top:56px">
        <button type="button" onclick=${(V.openFig)} aria-label=${(V.t.enlarge)} style="display:block;width:100%;padding:14px;border-radius:16px;background:#f6f6f4;border:1px solid rgba(255,255,255,.1);cursor:zoom-in;transition:transform .4s cubic-bezier(.2,.7,.2,1),box-shadow .4s" class="hv5">
          <img src="assets/fig2.webp" alt=${(V.t.alt.figArch)} loading="lazy" style="width:100%;display:block" />
        </button>
        <p style="margin:14px 0 0;font-size:13.5px;line-height:1.7;color:#8b8e94"><span style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.14em;color:#eba24a;margin-right:10px">FIG. 2</span>${V.t.figArch}</p>
      </div>

      <div data-reveal="1" style="opacity:0;margin-top:56px;border:1px solid rgba(255,255,255,.09);border-radius:16px;overflow:hidden;background:#0b0c0f">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.08)">
          <div style="font-size:15px;font-weight:500">${V.t.tableStageTitle}</div>
          <div style="font-family:'Roboto Mono',monospace;font-size:11px;color:#7a7d84;letter-spacing:.1em">SEAM · FROZEN ENCODER · LINEAR HEAD</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;background:rgba(255,255,255,.07)">
          ${(V.stageTable || []).map((r, $index) => html`
            <div style="padding:22px 24px;background:#0b0c0f">
              <div style=${String("font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.12em;color:" + "" + (r.labelColor))}>${r.name}</div>
              <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:12px 32px">
                <div>
                  <div style="font-family:'Roboto Mono',monospace;font-size:10.5px;letter-spacing:.12em;color:#7a7d84">mIoU</div>
                  <div style=${String("margin-top:4px;font-family:'Roboto Mono',monospace;font-size:clamp(24px,2.6vw,30px);letter-spacing:-.02em;color:" + "" + (r.color))}>${r.miou}</div>
                  <div style="margin-top:2px;min-height:18px;font-family:'Roboto Mono',monospace;font-size:12px;color:#eba24a">${r.dMiou}</div>
                </div>
                <div>
                  <div style="font-family:'Roboto Mono',monospace;font-size:10.5px;letter-spacing:.12em;color:#7a7d84">mPA</div>
                  <div style=${String("margin-top:4px;font-family:'Roboto Mono',monospace;font-size:clamp(24px,2.6vw,30px);letter-spacing:-.02em;color:" + "" + (r.color))}>${r.mpa}</div>
                  <div style="margin-top:2px;min-height:18px;font-family:'Roboto Mono',monospace;font-size:12px;color:#eba24a">${r.dMpa}</div>
                </div>
              </div>
            </div>
          `)}
        </div>
        <p style="margin:0;padding:14px 24px 20px;font-size:12.5px;line-height:1.7;color:#7a7d84">${V.t.tableStageNote}</p>
      </div>

      <div data-reveal="1" style="opacity:0;margin-top:56px">
        <button type="button" onclick=${(V.openFig)} aria-label=${(V.t.enlarge)} style="display:block;width:100%;padding:14px;border-radius:16px;background:#f6f6f4;border:1px solid rgba(255,255,255,.1);cursor:zoom-in;transition:transform .4s cubic-bezier(.2,.7,.2,1),box-shadow .4s" class="hv5">
          <img src="assets/fig3.webp" alt=${(V.t.alt.fig2)} loading="lazy" style="width:100%;display:block" />
        </button>
        <p style="margin:14px 0 0;font-size:13.5px;line-height:1.7;color:#8b8e94"><span style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.14em;color:#eba24a;margin-right:10px">FIG. 3</span>${V.t.fig2}</p>
      </div>
    </div>
  </section>

  <section id="results" style="padding:clamp(80px,12vh,150px) clamp(18px,4vw,56px) 0">
    <div style="max-width:1180px;margin:0 auto">
      <div data-reveal="1" style="opacity:0">
        <div style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.2em;color:#eba24a;text-transform:uppercase">${V.t.kResults}</div>
        <h2 style="margin:16px 0 0;font-size:clamp(30px,4.4vw,56px);line-height:1.04;font-weight:500;letter-spacing:-.03em">${V.t.resTitle}</h2>
        <p style="margin:20px 0 0;font-size:16px;line-height:1.8;color:#9a9da2;text-wrap:pretty">${V.t.resLede}</p>
      </div>

      <div data-reveal="1" style="opacity:0;margin-top:44px;border:1px solid rgba(255,255,255,.09);border-radius:16px;overflow:hidden;background:#0b0c0f">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.08)">
          <div style="font-size:15px;font-weight:500">${V.t.tableFewTitle}</div>
          <div style="font-family:'Roboto Mono',monospace;font-size:11px;color:#7a7d84;letter-spacing:.1em">FROZEN ENCODER · LINEAR HEAD</div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:760px">
            <thead>
              <tr>
                <th style="text-align:left;padding:13px 24px;font-family:'Roboto Mono',monospace;font-size:11px;font-weight:400;letter-spacing:.12em;color:#7a7d84;border-bottom:1px solid rgba(255,255,255,.07)">${V.t.thTask}</th>
                <th style="text-align:right;padding:13px 16px;font-family:'Roboto Mono',monospace;font-size:11px;font-weight:400;letter-spacing:.12em;color:#eba24a;border-bottom:1px solid rgba(255,255,255,.07)">SeisDFE</th>
                <th style="text-align:right;padding:13px 16px;font-family:'Roboto Mono',monospace;font-size:11px;font-weight:400;letter-spacing:.12em;color:#d9b88c;border-bottom:1px solid rgba(255,255,255,.07)">SeisDFE-Large</th>
                <th style="text-align:right;padding:13px 16px;font-family:'Roboto Mono',monospace;font-size:11px;font-weight:400;letter-spacing:.12em;color:#7a7d84;border-bottom:1px solid rgba(255,255,255,.07)">DINOv3-7B</th>
                <th style="text-align:right;padding:13px 16px;font-family:'Roboto Mono',monospace;font-size:11px;font-weight:400;letter-spacing:.12em;color:#7a7d84;border-bottom:1px solid rgba(255,255,255,.07)">NCS-2D</th>
                <th style="text-align:right;padding:13px 24px;font-family:'Roboto Mono',monospace;font-size:11px;font-weight:400;letter-spacing:.12em;color:#7a7d84;border-bottom:1px solid rgba(255,255,255,.07)">SFM-Large</th>
              </tr>
            </thead>
            <tbody>
              ${(V.fewShot || []).map((r, $index) => html`
                <tr style="transition:background .25s" class="hv7">
                  <td style="padding:15px 24px;border-bottom:1px solid rgba(255,255,255,.05)">
                    <div style="font-size:14.5px;color:#e9eaec">${r.task}</div>
                    <div style="margin-top:4px;font-family:'Roboto Mono',monospace;font-size:11px;color:#7a7d84">${r.setting}</div>
                  </td>
                  <td style="padding:15px 16px;text-align:right;border-bottom:1px solid rgba(255,255,255,.05);font-family:'Roboto Mono',monospace;font-size:15px;color:#eba24a">${r.a}</td>
                  <td style="padding:15px 16px;text-align:right;border-bottom:1px solid rgba(255,255,255,.05);font-family:'Roboto Mono',monospace;font-size:15px;color:#d9b88c">${r.e}</td>
                  <td style="padding:15px 16px;text-align:right;border-bottom:1px solid rgba(255,255,255,.05);font-family:'Roboto Mono',monospace;font-size:15px;color:#9a9da2">${r.b}</td>
                  <td style="padding:15px 16px;text-align:right;border-bottom:1px solid rgba(255,255,255,.05);font-family:'Roboto Mono',monospace;font-size:15px;color:#9a9da2">${r.c}</td>
                  <td style="padding:15px 24px;text-align:right;border-bottom:1px solid rgba(255,255,255,.05);font-family:'Roboto Mono',monospace;font-size:15px;color:#9a9da2">${r.d}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <div style="padding:14px 24px;font-size:12px;line-height:1.6;color:#7a7d84">${V.t.tableFewNote}</div>
      </div>

      <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:20px;align-items:stretch">
        <div data-reveal="1" style="opacity:0;flex:3 1 560px;min-width:0">
          <button type="button" onclick=${(V.openFig)} aria-label=${(V.t.enlarge)} style="display:block;width:100%;padding:14px;border-radius:16px;background:#f6f6f4;border:1px solid rgba(255,255,255,.1);cursor:zoom-in;transition:transform .4s cubic-bezier(.2,.7,.2,1),box-shadow .4s" class="hv8">
            <img src="assets/fig4.webp" alt=${(V.t.alt.fig3)} loading="lazy" style="width:100%;display:block" />
          </button>
          <p style="margin:14px 0 0;font-size:13.5px;line-height:1.7;color:#8b8e94"><span style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.14em;color:#eba24a;margin-right:10px">FIG. 4</span>${V.t.fig3}</p>
        </div>
        <div data-reveal="1" style="opacity:0;flex:2 1 300px;min-width:0;display:flex;flex-direction:column;gap:16px">
          ${(V.highlights || []).map((h, $index) => html`
            <div style="flex:1 1 auto;padding:22px 24px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01))">
              <div style="font-family:'Roboto Mono',monospace;font-size:clamp(28px,3.2vw,36px);color:#eba24a;letter-spacing:-.02em">${h.v}</div>
              <div style="margin-top:8px;font-size:14px;font-weight:500">${h.k}</div>
              <p style="margin:6px 0 0;font-size:13px;line-height:1.65;color:#8b8e94">${h.d}</p>
            </div>
          `)}
        </div>
      </div>

      <div data-reveal="1" data-bench="1" style="opacity:0;margin-top:56px;border:1px solid rgba(255,255,255,.09);border-radius:16px;overflow:hidden;background:#0b0c0f">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px">
          <div>
            <div style="font-size:15px;font-weight:500">${V.t.tableDownTitle}</div>
            <div style="margin-top:6px;font-family:'Roboto Mono',monospace;font-size:11px;color:#7a7d84;letter-spacing:.1em">${V.t.benchSub}</div>
          </div>
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
            <div role="tablist" aria-label=${(V.t.tableDownTitle)} style="display:flex;flex-wrap:wrap;gap:6px;padding:4px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.02)">
              ${(V.benchTabs || []).map((bt, $index) => html`
                <button type="button" role="tab" aria-selected=${(bt.selected)} onclick=${(bt.pick)} style=${(bt.style)}>${bt.label}</button>
              `)}
            </div>
            <button type="button" onclick=${(V.toggleBench)} aria-pressed=${(V.benchPressed)} style="height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.03);color:#d6d8db;font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.08em;cursor:pointer;display:flex;align-items:center;gap:8px;transition:border-color .25s,background .25s" class="hv4"><span style=${(V.benchDot)}></span>${V.benchBtn}</button>
          </div>
        </div>
        <div aria-hidden="true" style="height:2px;background:rgba(255,255,255,.06)"><div data-bench-fill="1" style="height:100%;width:100%;background:#eba24a;transform:scaleX(0);transform-origin:left"></div></div>

        <div role="tabpanel" style="display:flex;flex-wrap:wrap;gap:32px;padding:24px">
          <div style="flex:1 1 400px;min-width:0">
            <div style="display:grid;grid-template-columns:minmax(120px,1.15fr) minmax(0,1fr) minmax(0,1fr);gap:16px;padding:0 0 10px;border-bottom:1px solid rgba(255,255,255,.07);font-family:'Roboto Mono',monospace;font-size:10.5px;letter-spacing:.12em;color:#7a7d84">
              <span>${V.t.thModel}</span><span>mIoU</span><span>mPA</span>
            </div>
            ${(V.bench.rows || []).map((r, $index) => html`
              <div style="display:grid;grid-template-columns:minmax(120px,1.15fr) minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:center;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.05)">
                <div style="min-width:0">
                  <div style=${String("font-size:14px;color:" + "" + (r.nameColor) + "" + ";font-weight:" + "" + (r.weight))}>${r.m}</div>
                  <div style="margin-top:3px;font-family:'Roboto Mono',monospace;font-size:10px;letter-spacing:.1em;color:#7a7d84">${r.enc}</div>
                </div>
                <div style="min-width:0">
                  <div style=${String("font-family:'Roboto Mono',monospace;font-size:14px;color:" + "" + (r.iouColor))}>${r.miou}</div>
                  <div style="margin-top:6px;height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden"><div style=${String("height:100%;width:" + "" + (r.iouW) + "" + ";background:" + "" + (r.bar) + "" + ";border-radius:3px;transition:width .7s cubic-bezier(.2,.7,.2,1)")}></div></div>
                </div>
                <div style="min-width:0">
                  <div style=${String("font-family:'Roboto Mono',monospace;font-size:14px;color:" + "" + (r.paColor))}>${r.mpa}</div>
                  <div style="margin-top:6px;height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden"><div style=${String("height:100%;width:" + "" + (r.paW) + "" + ";background:" + "" + (r.bar) + "" + ";border-radius:3px;transition:width .7s cubic-bezier(.2,.7,.2,1)")}></div></div>
                </div>
              </div>
            `)}
            <p style="margin:12px 0 0;font-size:11.5px;line-height:1.6;color:#7a7d84">${V.t.benchAxis}</p>
          </div>

          <div style="flex:1.3 1 460px;min-width:0">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;background:rgba(255,255,255,.07);border-radius:9px;overflow:hidden">
              ${(V.bench.meta || []).map((mt, $index) => html`
                <div style="padding:10px 12px;background:#0b0c0f">
                  <div style="font-family:'Roboto Mono',monospace;font-size:10px;letter-spacing:.12em;color:#7a7d84">${mt.k}</div>
                  <div style="margin-top:4px;font-family:'Roboto Mono',monospace;font-size:12.5px;color:#d6d8db">${mt.v}</div>
                </div>
              `)}
            </div>
            <button type="button" onclick=${(V.openFig)} aria-label=${(V.t.enlarge)} style="margin-top:16px;display:block;width:100%;padding:10px;border-radius:12px;background:#f6f6f4;border:1px solid rgba(255,255,255,.1);cursor:zoom-in;transition:transform .4s cubic-bezier(.2,.7,.2,1),box-shadow .4s" class="hv9">
              <img src=${(V.bench.img)} alt=${(V.bench.alt)} style="width:100%;display:block" />
            </button>
            <p style="margin:10px 0 0;font-size:12.5px;line-height:1.6;color:#8b8e94"><span style="font-family:'Roboto Mono',monospace;font-size:10.5px;letter-spacing:.14em;color:#eba24a;margin-right:8px">FIG. 5</span>${V.t.benchCap}</p>
            <div style="margin-top:16px;padding:16px 18px;border-radius:12px;border:1px solid rgba(235,162,74,.22);background:rgba(235,162,74,.05)">
              <p style="margin:0;font-size:13.5px;line-height:1.7;color:#c3c6ca">${V.bench.insight}</p>
            </div>
          </div>
        </div>
        <div style="padding:0 24px 20px;font-size:12px;line-height:1.65;color:#7a7d84">${V.t.tableDownNote}</div>
      </div>
    </div>
  </section>

  <section id="applications" style="padding:clamp(80px,12vh,150px) clamp(18px,4vw,56px) 0">
    <div style="max-width:1180px;margin:0 auto">
      <div data-reveal="1" style="opacity:0">
        <div style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.2em;color:#eba24a;text-transform:uppercase">${V.t.kApps}</div>
        <h2 style="margin:16px 0 0;font-size:clamp(30px,4.4vw,56px);line-height:1.04;font-weight:500;letter-spacing:-.03em">${V.t.appsTitle}</h2>
        <p style="margin:20px 0 0;font-size:16px;line-height:1.8;color:#9a9da2;text-wrap:pretty">${V.t.appsLede}</p>
      </div>
      <div style="margin-top:44px;display:flex;flex-direction:column;gap:56px">
        ${(V.apps || []).map((f, $index) => html`
          <div data-reveal="1" style="opacity:0;display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start">
            <div style="flex:3 1 560px;min-width:0">
              <button type="button" onclick=${(V.openFig)} aria-label=${(V.t.enlarge)} style="display:block;width:100%;padding:12px;border-radius:14px;background:#f6f6f4;border:1px solid rgba(255,255,255,.1);cursor:zoom-in;transition:transform .4s cubic-bezier(.2,.7,.2,1),box-shadow .4s" class="hv8">
                <img src=${(f.src)} alt=${(f.alt)} loading="lazy" style="width:100%;display:block" />
              </button>
              <p style="margin:12px 0 0;font-size:13.5px;line-height:1.75;color:#8b8e94"><span style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.14em;color:#eba24a;margin-right:10px">${f.label}</span>${f.cap}</p>
            </div>
            <div style="flex:2 1 320px;min-width:0;padding:26px 24px 24px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01))">
              <div style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.18em;color:#eba24a">${f.num}</div>
              <h3 style="margin:14px 0 0;font-size:22px;font-weight:500;letter-spacing:-.01em">${f.title}</h3>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.75;color:#9a9da2">${f.body}</p>
              <div style="margin-top:20px;display:grid;gap:1px;background:rgba(255,255,255,.07);border-radius:9px;overflow:hidden">
                ${(f.specs || []).map((sp, $index) => html`
                  <div style="display:flex;justify-content:space-between;gap:12px;padding:9px 12px;background:#0b0c0f;font-family:'Roboto Mono',monospace;font-size:11.5px">
                    <span style="color:#7a7d84">${sp.k}</span>
                    <span style="color:#d6d8db;text-align:right">${sp.v}</span>
                  </div>
                `)}
              </div>
              <p style="margin:16px 0 0;font-size:12.5px;line-height:1.65;color:#7a7d84">${f.note}</p>
            </div>
          </div>
        `)}
      </div>
    </div>
  </section>

  <section id="citation" style="padding:clamp(80px,12vh,150px) clamp(18px,4vw,56px) 0">
    <div style="max-width:1180px;margin:0 auto">
      <div data-reveal="1" style="opacity:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(28px,5vw,80px);align-items:start">
        <div>
          <div style="font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.2em;color:#eba24a;text-transform:uppercase">${V.t.kCite}</div>
          <h2 style="margin:16px 0 0;font-size:clamp(28px,3.6vw,44px);line-height:1.06;font-weight:500;letter-spacing:-.03em">${V.t.citeTitle}</h2>
          <p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:#9a9da2">${V.t.citeLede}</p>
          <p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:#9a9da2">${V.t.repo} <a href="https://github.com/ProgrammerZXG/SeisDFE" target="_blank" rel="noopener noreferrer">github.com/ProgrammerZXG/SeisDFE</a></p>
          <p style="margin:6px 0 0;font-size:15px;line-height:1.8;color:#9a9da2">${V.t.contact} <a href="mailto:xinmwu@ustc.edu.cn">xinmwu@ustc.edu.cn</a></p>
        </div>
        <div style="position:relative;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:#0b0c0f;overflow:hidden">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.07)">
            <span style="font-family:'Roboto Mono',monospace;font-size:11px;color:#7a7d84;letter-spacing:.12em">BIBTEX</span>
            <button type="button" onclick=${(V.copyBib)} style="padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.03);color:#d6d8db;font-family:'Roboto Mono',monospace;font-size:11px;cursor:pointer;transition:border-color .25s,background .25s" class="hv4">${V.copyLabel}</button>
          </div>
          <pre style="margin:0;padding:18px;overflow-x:auto;font-family:'Roboto Mono',monospace;font-size:12px;line-height:1.85;color:#a9acb2">${V.bibtex}</pre>
        </div>
      </div>
    </div>
  </section>

  <footer style="margin-top:clamp(80px,12vh,140px);padding:36px clamp(18px,4vw,56px);border-top:1px solid rgba(255,255,255,.07)">
    <div style="max-width:1180px;margin:0 auto;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
      <div style="font-family:'Roboto Mono',monospace;font-size:11.5px;color:#7a7d84;letter-spacing:.06em">SeisDFE · USTC · Computational Interpretation Group</div>
      <div style="font-size:12.5px;color:#7a7d84">${V.t.footer}</div>
    </div>
  </footer>

  ${V.lightbox ? html`
    <div data-lightbox="1" tabindex="-1" role="dialog" aria-modal="true" aria-label=${(V.t.enlarge)} onclick=${(V.closeLightbox)} onkeydown=${(V.lightboxKey)} style="position:fixed;inset:0;z-index:80;background:rgba(6,7,9,.92);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:clamp(16px,4vw,56px);cursor:zoom-out;animation:fadeIn .3s ease both;outline:none">
      <img src=${(V.lightbox)} alt=${(V.t.enlarge)} style="max-width:100%;max-height:100%;border-radius:10px;background:#fff;box-shadow:0 30px 90px rgba(0,0,0,.6);animation:floatIn .45s cubic-bezier(.2,.7,.2,1) both" />
      <div style="position:absolute;top:22px;right:26px;font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.14em;color:#9a9da2">ESC / CLICK TO CLOSE</div>
    </div>
  ` : null}

  ${V.toast ? html`
    <div role="status" style="position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:90;padding:12px 20px;border-radius:999px;background:rgba(20,21,24,.96);border:1px solid rgba(235,162,74,.4);color:#e9eaec;font-size:13.5px;box-shadow:0 18px 44px rgba(0,0,0,.5);animation:floatIn .35s cubic-bezier(.2,.7,.2,1) both">${V.toast}</div>
  ` : null}

</div>`;

const GH = "https://github.com/ProgrammerZXG/SeisDFE";

const IMG = {
  fig4: "assets/fig6.webp",
  fig5: "assets/fig7.webp",
  seismic: "assets/seismic.webp",
  layers: {
    "10": "assets/layer10.webp",
    "20": "assets/layer20.webp",
    "30": "assets/layer30.webp",
    "40": "assets/layer40.webp"
  }
};
const LAYERS = ["10", "20", "30", "40"];
const TOUR_MS = 6200;
const BENCH_MS = 6500;
const PRED = [
  "assets/pred_facies.webp",
  "assets/pred_salt.webp",
  "assets/pred_fault.webp"
];

const DICT = {
  en: {
    navOverview: "Overview", navMethod: "Method", navResults: "Results", navApps: "Applications", navCite: "Citation",
    badge: "Seismic Foundation Model",
    tagline: "A 7B-parameter seismic foundation model for dense feature extraction",
    authors: [
      { n: "Zhixiang Guo", s: "1,2,3" }, { n: "Xinming Wu", s: "1,2,3,*" }, { n: "Yimin Dou", s: "1,2,3" }, { n: "Hui Gao", s: "4" },
      { n: "Siyao Zhao", s: "1,2,3" }, { n: "He Huang", s: "1,2,3" }, { n: "Wei Liu", s: "1,2,3" }
    ],
    affil: [
      { n: "1", t: "Laboratory of Seismology and Physics of the Earth's Interior, School of Earth and Space Sciences, University of Science and Technology of China, Hefei, China" },
      { n: "2", t: "State Key Laboratory of Precision Geodesy, University of Science and Technology of China, Hefei, China" },
      { n: "3", t: "Mengcheng National Geophysical Observatory, University of Science and Technology of China, Hefei, China" },
      { n: "4", t: "School of Artificial Intelligence, Anhui University of Science and Technology, Hefei, China" }
    ],
    corr: "Corresponding author:",
    btnPaper: "arXiv", btnCode: "GitHub", btnWeights: "Model weights",
    statParams: "Parameters, ViT-7B encoder",
    statImages: "Unlabeled 2D seismic images",
    statVolumes: "Public 3D seismic volumes",
    statArea: "km² of survey coverage",
    statGpu: "GPU-hours, NVIDIA H20 96GB",
    kAbstract: "Abstract",
    absTitle: "Dense features that stay reusable with the encoder frozen.",
    keywords: ["seismic foundation model", "self-supervised learning", "dense features", "seismic interpretation", "few-shot learning", "Gram anchoring"],
    abstract1: "Deep-learning-based seismic interpretation is constrained by scarce high-quality annotations, and most existing models are trained separately for individual tasks.",
    abstract2: "We present SeisDFE, a 7B-parameter seismic foundation model for dense feature extraction, pretrained on 5.34 million 2D images derived from more than 500 seismic volumes. A three-stage pretraining strategy — discriminative self-supervised learning, Gram feature anchoring, and multi-resolution adaptation — improves feature discriminability while preserving spatial coherence.",
    abstract3: "With its encoder frozen, SeisDFE supports seismic facies classification, salt detection, fault detection, and relative geologic time estimation. It outperforms existing seismic foundation models on all four tasks and a natural-image-pretrained model on all but fault detection, with the largest gains under scarce supervision: using only two annotated sections of the F3 dataset, it improves whole-volume mIoU by 12–19 percentage points over the baselines. The learned features remain effective with task-specific decoders and extend to synthetic-to-field transfer and sparse 3D geobody interpretation. These results show that large-scale seismic pretraining organizes geological information into dense representations that are directly reusable across interpretation tasks.",
    kMethod: "Method",
    methodTitle: "Three-stage progressive continual pretraining",
    methodLede: "SeisDFE uses a ViT-7B encoder with 40 Transformer blocks, initialized from DINOv3; the patch embedding is changed from three channels to one and initialized by averaging the RGB weights. Three stages successively perform discriminative seismic pretraining, dense-relation anchoring, and input-scale adaptation, and the final 7B model is distilled into a lighter SeisDFE-Large encoder. The pretraining corpus combines the 3D volumes used by SFM with public surveys from USGS, SEG, NZPAM, NLOG, and other platforms.",
    enlarge: "Enlarge figure",
    figArch: "The discriminative self-supervised pretraining framework. Each seismic image yields two global views and eight local views for the teacher and student encoders, and the teacher is updated as an exponential moving average of the student. The objective combines the DINO loss, the iBOT loss, KoLeo regularization, and, from Stage II onward, Gram anchoring.",
    fig1: "Overall framework of SeisDFE. Left: the three-stage pretraining pipeline — large-scale self-supervised learning, Gram feature anchoring, and multi-resolution adaptation. Middle: the frozen ViT-7B seismic foundation model and its patch-level dense features. Right: task-specific decoders for seismic facies classification, fault detection, salt detection, RGT estimation, and other interpretation tasks.",
    fig2: "Evolution and organization of dense seismic representations. (a) Patch-feature similarity during Stage I at 50k, 80k, and 100k steps. (b) PCA of dense features after the three pretraining stages. (c) Frozen linear probing of the three stages on SEAM facies classification. (d) PCA of features from different depths of the final SeisDFE encoder.",
    fig3: "Extreme few-shot linear probing with frozen encoders: (a) salt detection, (b) F3 facies classification, (c) RGT estimation, and (d) fault detection. Only a linear prediction head is trained; points show four random draws of the training samples.",
    figs2: "Representative predictions with task-specific decoders on SEAM facies classification, TGS salt detection, and fault detection. Columns: seismic data, DINOv3-7B, SFM-Large, NCS-2D, SeisDFE, and the label.",
    alt: {
      fig1: "SeisDFE framework: three-stage pretraining, frozen ViT-7B encoder, and downstream task decoders.",
      figArch: "Teacher–student pretraining architecture with DINO, iBOT, KoLeo, and Gram anchoring objectives.",
      fig2: "Patch-feature similarity across Stage I steps, PCA of features after each stage, SEAM linear-probing curve, and PCA across encoder layers.",
      fig3: "Bar charts of few-shot linear probing for salt, F3 facies, RGT and fault across five encoders.",
      figs2: "Prediction comparison grid for facies, salt and fault detection across four encoders and the label.",
      fig4: "Field-data fault detection, karst detection and RGT estimation by SeisDFE and U-Net.",
      fig5: "3D geobody detection framework and channel, salt dome and karst results from sparse slice labels."
    },
    stages: [
      { num: "STAGE I", title: "Large-scale self-supervised learning", body: "Initialized from DINOv3 ViT-7B and trained on 5.34 million 256×256 seismic images. Global, local, and partially masked views pass through a teacher–student network; DINO and iBOT constrain image- and patch-level features, and the KoLeo regularizer promotes feature diversity." },
      { num: "STAGE II", title: "Gram feature anchoring", body: "Prolonged Stage I training fragments patch-feature similarity. A frozen Gram teacher from the 50k-step EMA checkpoint, fed the same crops at twice the student resolution, anchors the pairwise relations among dense features." },
      { num: "STAGE III", title: "Multi-resolution adaptation", body: "Inputs alternate between full 512² images and random 384² or 256² crops at the same physical sampling, so features stay stable as the field of view and token grid change. SSL and Gram constraints are retained." },
      { num: "DISTILLATION", title: "SeisDFE-Large", body: "The final SeisDFE-7B teaches a DINOv3-Large student to match its image-level DINO and patch-level iBOT outputs on the same unlabeled data, retaining much of the reusable representation at a lower cost." }
    ],
    specKeys: { init: "Init", data: "Data", steps: "Steps", batch: "Global batch", gpu: "GPU-hours", gram: "Gram weight", sizes: "Input sizes", gramT: "Gram teacher", teacher: "Teacher" },
    specVals: { s1final: "Stage I final", s2: "Stage II", s1ema: "Stage I EMA @50k" },
    wTitle: "Inside the representation",
    wSub: "SEISMIC ↔ PCA FEATURES · FIG. 3D",
    wLayer: "LAYER",
    wLayers: "Encoder layer",
    wTagSeis: "SEISMIC INPUT",
    wTagFeat: "PCA",
    wSeisAlt: "Grayscale seismic reflection section from Fig. 3d.",
    wFeatAlt: "PCA visualization of layer {n} dense features for the same seismic section.",
    wRangeLabel: "Drag to compare the seismic input with the dense features",
    wAuto: "AUTO TOUR", wManual: "DRAG TO COMPARE",
    wPause: "Pause", wPlay: "Auto play",
    wNote: "PCA projects patch features onto their first three principal components, mapped to RGB — colors show how features are organized, not class labels.",
    layerDesc: {
      "10": "Shallow layers emphasize local amplitude variations, reflection textures, and structural edges.",
      "20": "Intermediate layers begin to organize features along reflection systems.",
      "30": "Intermediate layers follow broader stratigraphic variations.",
      "40": "Deep layers form larger, coherent regions while retaining major structural boundaries."
    },
    tableStageTitle: "What the three stages add",
    tableStageNote: "Linear probing on SEAM seismic facies classification. All checkpoints keep the encoder frozen and share the same linear head, training samples, and protocol, so differences come from the encoder features alone. Gains are absolute, over Stage I.",
    stageTable: ["Stage I · large-scale SSL", "Stage II · Gram anchoring", "Stage III · multi-resolution"],
    thCkpt: "Checkpoint",
    kResults: "Evaluation",
    resTitle: "Frozen encoder, from extreme few-shot probing to task decoders",
    resLede: "Encoders stay frozen so that differences originate from the pretrained features themselves. Extreme few-shot linear probing isolates how accessible task-relevant information is; task-specific decoders with larger training sets test whether the advantage persists under conventional settings.",
    tableFewTitle: "Extreme few-shot linear probing at the smallest sample size",
    tableFewNote: "All encoders stay frozen and share an identical linear head, training samples, and splits; each setting is repeated over four random draws. Values marked ≈ are read from Fig. 4 or stated approximately in the text.",
    thTask: "Task / setting", thModel: "Model", thEncoder: "Encoder",
    fewShot: [
      { task: "Salt detection", setting: "TGS · 5 images · mIoU", a: "0.72", e: "≈0.68", b: "0.60", c: "0.58", d: "0.57" },
      { task: "F3 seismic facies", setting: "2 inline sections · whole-volume mIoU", a: "0.82", e: "≈0.81", b: "0.70", c: "0.66", d: "0.63" },
      { task: "RGT estimation", setting: "5 samples · SSIM", a: "≈0.84", e: "≈0.85", b: "≈0.79", c: "≈0.49", d: "≈0.75" },
      { task: "Fault detection", setting: "Field · 5 samples · mIoU", a: "≈0.58", e: "≈0.54", b: "≈0.58", c: "≈0.48", d: "≈0.53" }
    ],
    highlights: [
      { v: "+12–19 pp", k: "F3 whole-volume mIoU from 2 sections", d: "SeisDFE reaches 0.82, against 0.70 / 0.66 / 0.63 for DINOv3-7B, NCS-2D, and SFM-Large." },
      { v: "0.8845", k: "SEAM facies mIoU, encoder frozen", d: "With a PUP decoder — 0.0471 above the equally frozen DINOv3-7B; the distilled SeisDFE-Large reaches 0.8768." },
      { v: "0.8819", k: "TGS salt mIoU with only a linear head", d: "Against 0.8116 for DINOv3-7B and about 0.80 for LoRA-adapted SFM-Large and NCS-2D." }
    ],
    tableDownTitle: "Task-specific decoders on three downstream tasks",
    tableDownNote: "SeisDFE, SeisDFE-Large, and DINOv3-7B stay frozen on all three tasks; for SFM-Large and NCS-2D the better of frozen or LoRA adaptation on validation is reported — a protocol that favors the baselines, since SeisDFE is evaluated only with a frozen encoder.",
    benchSub: "TABLE 1 · LARGER TRAINING SETS · TASK-SPECIFIC DECODERS",
    benchAuto: "Auto", benchPause: "Pause",
    benchAxis: "Bars start at 0 (full track = 1.0). Best value in each column is shown in amber.",
    benchCap: "Predictions for this task: seismic input, DINOv3-7B, SFM-Large, NCS-2D, SeisDFE, and the label.",
    benchDeltaLabel: "SeisDFE − BEST NON-SEISDFE BASELINE ({m}), mIoU",
    bench: [
      { tab: "Facies", meta: [["Dataset", "SEAM"], ["Input", "768 × 768"], ["Split", "94 train · 23 val"], ["Decoder", "PUP"]],
        insight: "With a frozen encoder and a PUP decoder, SeisDFE reaches 0.8845 mIoU and 0.9324 mPA — 0.0471 above the equally frozen DINOv3-7B. The distilled SeisDFE-Large retains most of it at 0.8768." },
      { tab: "Salt", meta: [["Dataset", "TGS"], ["Input", "224 × 224"], ["Split", "3,000 train · 1,000 val"], ["Decoder", "Linear head"]],
        insight: "With only a linear head, SeisDFE reaches 0.8819, against 0.8116 for DINOv3-7B and 0.8044 / 0.8046 for LoRA-adapted SFM-Large / NCS-2D — the few-shot advantage persists with more supervision." },
      { tab: "Fault", meta: [["Dataset", "Field (Guo et al.)"], ["Input", "896 × 896"], ["Split", "1,081 train · 269 val"], ["Decoder", "MLA"]],
        insight: "SeisDFE reaches 0.7374 mIoU, about 9–10 points above SFM-Large and NCS-2D but slightly below DINOv3-7B (0.7564). With multi-level fusion and the full training set, fault mIoU rises from below 0.60 in the few-shot setting to above 0.73: narrow discontinuities benefit more from multi-level fusion and spatial decoding than regional targets do." }
    ],
    downTasks: ["SEAM facies classification", "TGS salt detection", "Fault detection"],
    downSets: ["768² · 94 train", "224² · 3,000 train", "896² · 1,081 train"],
    frozen: "frozen",
    kApps: "Applications & extensions",
    appsTitle: "From synthetic training to field surveys and 3D volumes",
    appsLede: "Task models trained only on synthetic data are transferred to unseen field surveys, and the frozen 2D representation is extended to volumetric geobody detection from sparse slice annotations.",
    apps: [
      { num: "APP 01", label: "FIG. 6", title: "Synthetic-to-field transfer",
        body: "SeisDFE-based models and a U-Net baseline are trained on the same synthetic data and applied directly to unseen field sections. SeisDFE gives more continuous responses for weak, short, or closely spaced faults, more localized karst-cave detections, and RGT that keeps finer variation around folds, dip changes, and faulted strata.",
        cap: "Synthetic-to-field transfer on field seismic data. Top two rows: fault detection (left) and karst cave detection (right), SeisDFE above U-Net. Bottom row: two RGT estimation examples, each SeisDFE (left) against U-Net (right).",
        note: "Complete field labels are unavailable for these surveys, so the comparison is qualitative and does not imply the synthetic-to-field gap is closed.",
        specs: [["Fault detection", "Frozen · DPT decoder"], ["Karst caves", "Frozen · DPT decoder"], ["RGT estimation", "LoRA (last 30 blocks) · DPT"], ["Baseline", "U-Net · 24.23M params"], ["Synthetic training set", "440,000 sections"]] },
      { num: "APP 02", label: "FIG. 7", title: "Sparse 3D geobody detection",
        body: "Neighboring sections are encoded independently by the frozen 2D encoder, their multi-level features fused and stacked, and a lightweight 3D convolutional decoder models cross-slice relations — a pseudo-3D design trained only on sparsely annotated slices. Against section-wise 2D PUP decoding, it gives more coherent continuity across slices, especially along elongated channels.",
        cap: "Sparse 3D geobody detection. (a) The 3D interpretation framework. (b) Sparse manual interpretations used for supervision. (c) Predictions with a 2D PUP decoder. (d) Predictions with the 3D convolutional decoder. Columns: Parihaka and Romney channels, F3 salt dome, and field karst.",
        note: "Without complete voxel-level labels, these examples assess the spatial coherence of detected geobodies rather than their absolute accuracy.",
        specs: [["Channels", "Parihaka · Romney"], ["Salt dome", "F3"], ["Karst caves", "Field survey"], ["Decoders", "2D PUP vs 3D conv"], ["Loss", "0.5 BCE + 0.5 Dice, labeled slices only"]] }
    ],
    kCite: "Citation",
    citeTitle: "Cite this work",
    citeLede: "If SeisDFE is useful in your research, please cite the arXiv preprint. Code for pretraining, dense feature extraction, distillation, and downstream evaluation, together with the pretrained weights, will be released in the GitHub repository.",
    repo: "Repository:",
    contact: "Corresponding author:",
    footer: "Code and model weights are coming soon.",
    footerLinkSoon: "Model weights are not yet public — the link will appear here once they are released.",
    copy: "Copy", copied: "Copied"
  },
  zh: {
    navOverview: "概览", navMethod: "方法", navResults: "评估", navApps: "应用", navCite: "引用",
    badge: "地震基础模型",
    tagline: "面向密集特征提取的 70 亿参数地震基础模型",
    authors: [
      { n: "虢志祥", s: "1,2,3" }, { n: "伍新明", s: "1,2,3,*" }, { n: "窦一民", s: "1,2,3" }, { n: "高晖", s: "4" },
      { n: "赵偲尧", s: "1,2,3" }, { n: "黄河", s: "1,2,3" }, { n: "刘微", s: "1,2,3" }
    ],
    affil: [
      { n: "1", t: "中国科学技术大学 地球和空间科学学院 地震与地球内部物理实验室，合肥" },
      { n: "2", t: "中国科学技术大学 精密测量国家重点实验室，合肥" },
      { n: "3", t: "中国科学技术大学 蒙城地球物理国家野外科学观测研究站" },
      { n: "4", t: "安徽理工大学 人工智能学院，合肥" }
    ],
    corr: "通讯作者：",
    btnPaper: "arXiv 论文", btnCode: "GitHub", btnWeights: "模型权重",
    statParams: "模型参数，ViT-7B 编码器",
    statImages: "张无标签二维地震图像",
    statVolumes: "个公开三维地震数据体",
    statArea: "平方公里工区覆盖面积",
    statGpu: "GPU 小时，NVIDIA H20 96GB",
    kAbstract: "摘要",
    absTitle: "冻结编码器下依然可跨任务复用的密集特征。",
    keywords: ["地震基础模型", "自监督学习", "密集特征", "地震解释", "小样本学习", "Gram anchoring"],
    abstract1: "基于深度学习的地震解释受限于高质量标注的稀缺，且现有模型大多针对单一任务分别训练。",
    abstract2: "本文提出 SeisDFE——一个面向密集特征提取的 70 亿参数地震基础模型，在源自 500 余个地震数据体的 534 万张二维图像上预训练。判别式自监督学习、Gram 特征锚定与多分辨率适配三阶段预训练策略，在提升特征判别性的同时保持了空间一致性。",
    abstract3: "在冻结编码器的条件下，SeisDFE 可支撑地震相分类、盐体检测、断层检测与相对地质时间估计：在全部四项任务上优于已有地震基础模型，除断层检测外均优于自然图像预训练模型，且在监督稀缺时提升最大——仅用 F3 数据集的两张标注剖面，全体积 mIoU 即比各基线高 12–19 个百分点。所学特征在配置任务解码器后依然有效，并可扩展到合成数据到实际资料的迁移与稀疏三维地质体解释。结果表明，大规模地震预训练能够将地质信息组织为可在不同解释任务间直接复用的密集表征。",
    kMethod: "方法",
    methodTitle: "三阶段渐进式持续预训练",
    methodLede: "SeisDFE 采用含 40 个 Transformer 块的 ViT-7B 编码器，以 DINOv3 初始化，并将 patch embedding 由三通道改为单通道（以 RGB 权重的通道均值初始化）。三个阶段依次完成判别式地震预训练、密集特征关系锚定与输入尺度适配；最终的 7B 模型再蒸馏为更轻量的 SeisDFE-Large 编码器。预训练数据整合了 SFM 所用的三维地震数据，以及来自 USGS、SEG、NZPAM、NLOG 等公开平台的数据体。",
    enlarge: "放大查看图件",
    figArch: "判别式自监督预训练框架。每张地震图像生成 2 个全局视图与 8 个局部视图，分别送入教师与学生编码器，教师参数由学生参数的指数滑动平均更新。训练目标包括 DINO 损失、iBOT 损失、KoLeo 正则，以及自第二阶段起引入的 Gram 锚定损失。",
    fig1: "SeisDFE 整体框架。左：三阶段预训练流程——大规模自监督学习、Gram 特征锚定与多分辨率适配；中：冻结的 ViT-7B 地震基础模型及其 patch 级密集特征；右：面向地震相分类、断层检测、盐体检测、RGT 估计及其他解释任务的任务解码器。",
    fig2: "密集地震表征的演化与组织。(a) 第一阶段 50k、80k、100k 步时的 patch 特征相似性；(b) 三个预训练阶段后密集特征的 PCA 可视化；(c) 三个阶段在 SEAM 地震相分类上的冻结线性探测结果；(d) 最终 SeisDFE 编码器不同深度特征的 PCA 可视化。",
    fig3: "冻结编码器下的极端小样本线性探测：(a) 盐体检测；(b) F3 地震相分类；(c) RGT 估计；(d) 断层检测。每个任务仅训练线性预测头；散点为训练样本的四次随机抽取结果。",
    figs2: "配置任务解码器后在 SEAM 地震相分类、TGS 盐体检测与断层检测上的代表性预测。列依次为地震数据、DINOv3-7B、SFM-Large、NCS-2D、SeisDFE 与标签。",
    alt: {
      fig1: "SeisDFE 框架：三阶段预训练、冻结的 ViT-7B 编码器与下游任务解码器。",
      figArch: "包含 DINO、iBOT、KoLeo 与 Gram 锚定目标的教师–学生预训练架构。",
      fig2: "第一阶段不同步数的 patch 特征相似性、各阶段特征 PCA、SEAM 线性探测曲线及不同层特征 PCA。",
      fig3: "五个编码器在盐体、F3 地震相、RGT 与断层任务上的小样本线性探测柱状图。",
      figs2: "四个编码器与标签在地震相、盐体、断层任务上的预测对比。",
      fig4: "SeisDFE 与 U-Net 在实际资料上的断层检测、溶洞检测与 RGT 估计结果。",
      fig5: "三维地质体检测框架，以及基于稀疏切片标注的河道、盐丘与溶洞检测结果。"
    },
    stages: [
      { num: "第一阶段", title: "大规模自监督学习", body: "以 DINOv3 ViT-7B 初始化，在 534 万张 256×256 地震图像上训练。全局、局部与部分掩码视图送入教师–学生网络；DINO 与 iBOT 分别约束图像级与 patch 级特征，KoLeo 正则促进特征多样性。" },
      { num: "第二阶段", title: "Gram 特征锚定", body: "第一阶段持续训练会使 patch 特征相似性逐渐碎片化。以第一阶段 50k 步的 EMA 检查点作为冻结的 Gram 教师（输入为学生两倍分辨率的同一裁剪），锚定密集特征之间的成对关系。" },
      { num: "第三阶段", title: "多分辨率适配", body: "输入在完整 512² 图像与随机裁剪的 384²、256² 区域之间交替，物理采样间隔保持不变，使特征在观测视野和 token 网格变化时保持稳定；同时保留自监督与 Gram 约束。" },
      { num: "模型蒸馏", title: "SeisDFE-Large", body: "以最终的 SeisDFE-7B 为教师，在同一批无标签数据上训练 DINOv3-Large 学生模型拟合其图像级 DINO 与 patch 级 iBOT 输出，以更低的计算成本保留大部分可复用表征。" }
    ],
    specKeys: { init: "初始化", data: "训练数据", steps: "步数", batch: "全局批量", gpu: "GPU 小时", gram: "Gram 权重", sizes: "输入尺寸", gramT: "Gram 教师", teacher: "教师模型" },
    specVals: { s1final: "第一阶段最终模型", s2: "第二阶段模型", s1ema: "第一阶段 EMA @50k" },
    wTitle: "表征内部",
    wSub: "地震 ↔ PCA 特征 · 图 3D",
    wLayer: "第",
    wLayers: "编码器层",
    wTagSeis: "地震输入",
    wTagFeat: "PCA",
    wSeisAlt: "图 3d 中的灰度地震反射剖面。",
    wFeatAlt: "同一地震剖面第 {n} 层密集特征的 PCA 可视化。",
    wRangeLabel: "拖动以对比地震输入与密集特征",
    wAuto: "自动巡览", wManual: "拖动对比",
    wPause: "暂停", wPlay: "自动播放",
    wNote: "PCA 将 patch 特征投影到前三个主成分并映射为 RGB——颜色表示特征的组织方式，而非类别标签。",
    layerDesc: {
      "10": "浅层特征突出局部振幅变化、反射纹理与构造边缘。",
      "20": "中间层特征开始沿反射系统形成更大范围的组织。",
      "30": "中间层特征跟随更大尺度的地层变化。",
      "40": "深层特征形成更大、更连续的区域，同时保留主要构造边界。"
    },
    tableStageTitle: "三阶段预训练带来的提升",
    tableStageNote: "SEAM 地震相分类上的线性探测结果。三个检查点均冻结编码器，使用相同的线性预测头、训练样本与训练流程，因此差异只来自编码器特征本身；增益为相对第一阶段的绝对值。",
    stageTable: ["第一阶段 · 大规模自监督", "第二阶段 · Gram 锚定", "第三阶段 · 多分辨率适配"],
    thCkpt: "检查点",
    kResults: "评估",
    resTitle: "冻结编码器：从极端小样本探测到任务解码器",
    resLede: "评估中编码器保持冻结，使性能差异来自预训练特征本身：极端小样本线性探测考察任务相关信息的可获取程度；更大训练集与任务解码器则检验这一优势在常规设置下能否保持。",
    tableFewTitle: "极端小样本线性探测（最小样本量）",
    tableFewNote: "所有编码器均冻结，使用结构相同的线性预测头、相同训练样本与数据划分；每个设置重复四次随机抽样。标 ≈ 的数值读自图 4 或为正文给出的近似值。",
    thTask: "任务 / 设置", thModel: "模型", thEncoder: "编码器",
    fewShot: [
      { task: "盐体检测", setting: "TGS · 5 张图像 · mIoU", a: "0.72", e: "≈0.68", b: "0.60", c: "0.58", d: "0.57" },
      { task: "F3 地震相分类", setting: "2 张 inline 剖面 · 全体积 mIoU", a: "0.82", e: "≈0.81", b: "0.70", c: "0.66", d: "0.63" },
      { task: "RGT 估计", setting: "5 个样本 · SSIM", a: "≈0.84", e: "≈0.85", b: "≈0.79", c: "≈0.49", d: "≈0.75" },
      { task: "断层检测", setting: "实际资料 · 5 个样本 · mIoU", a: "≈0.58", e: "≈0.54", b: "≈0.58", c: "≈0.48", d: "≈0.53" }
    ],
    highlights: [
      { v: "+12–19 pp", k: "两张剖面下的 F3 全体积 mIoU 提升", d: "SeisDFE 达到 0.82，DINOv3-7B、NCS-2D、SFM-Large 分别为 0.70 / 0.66 / 0.63。" },
      { v: "0.8845", k: "SEAM 地震相 mIoU（编码器冻结）", d: "配置 PUP 解码器，比同样冻结的 DINOv3-7B 高 0.0471；蒸馏得到的 SeisDFE-Large 达到 0.8768。" },
      { v: "0.8819", k: "仅用线性头的 TGS 盐体 mIoU", d: "DINOv3-7B 为 0.8116，经 LoRA 适配的 SFM-Large 与 NCS-2D 约为 0.80。" }
    ],
    tableDownTitle: "三项下游任务（配置任务解码器）",
    tableDownNote: "三项任务中 SeisDFE、SeisDFE-Large 与 DINOv3-7B 均保持冻结；SFM-Large 与 NCS-2D 报告冻结与 LoRA 适配中验证表现更好的配置——由于 SeisDFE 仅以冻结编码器参评，这一协议对基线更有利。",
    benchSub: "表 1 · 更大训练集 · 任务解码器",
    benchAuto: "自动", benchPause: "暂停",
    benchAxis: "条形从 0 开始（满格 = 1.0），每列最优值以琥珀色标出。",
    benchCap: "该任务的预测结果：地震输入、DINOv3-7B、SFM-Large、NCS-2D、SeisDFE 与标签。",
    benchDeltaLabel: "SeisDFE − 最优非 SeisDFE 基线（{m}），mIoU",
    bench: [
      { tab: "地震相", meta: [["数据集", "SEAM"], ["输入尺寸", "768 × 768"], ["划分", "94 训练 · 23 验证"], ["解码器", "PUP"]],
        insight: "编码器冻结、配置 PUP 解码器时，SeisDFE 达到 0.8845 mIoU / 0.9324 mPA，比同样冻结的 DINOv3-7B 高 0.0471；蒸馏得到的 SeisDFE-Large 以 0.8768 保留了大部分性能。" },
      { tab: "盐体", meta: [["数据集", "TGS"], ["输入尺寸", "224 × 224"], ["划分", "3,000 训练 · 1,000 验证"], ["解码器", "线性预测头"]],
        insight: "仅用线性预测头，SeisDFE 达到 0.8819，DINOv3-7B 为 0.8116，经 LoRA 适配的 SFM-Large 与 NCS-2D 分别为 0.8044 与 0.8046——小样本下的优势在更多监督时依然保持。" },
      { tab: "断层", meta: [["数据集", "实际资料（Guo 等）"], ["输入尺寸", "896 × 896"], ["划分", "1,081 训练 · 269 验证"], ["解码器", "MLA"]],
        insight: "SeisDFE 达到 0.7374 mIoU，比 SFM-Large 与 NCS-2D 高约 9–10 个百分点，但略低于 DINOv3-7B（0.7564）。借助多层特征融合与完整训练集，断层 mIoU 从小样本设置下的不足 0.60 提升到 0.73 以上：与区域性目标相比，窄小的不连续结构更受益于多层融合与空间解码。" }
    ],
    downTasks: ["SEAM 地震相分类", "TGS 盐体检测", "断层检测"],
    downSets: ["768² · 94 训练", "224² · 3,000 训练", "896² · 1,081 训练"],
    frozen: "冻结",
    kApps: "应用与扩展",
    appsTitle: "从合成数据训练到实际工区与三维数据体",
    appsLede: "仅以合成数据训练的任务模型被迁移到未见过的实际工区；冻结的二维表征进一步扩展到基于稀疏切片标注的三维地质体检测。",
    apps: [
      { num: "应用 01", label: "图 6", title: "合成数据到实际资料的迁移",
        body: "基于 SeisDFE 的模型与 U-Net 基线在相同合成数据上训练，并直接应用于未见过的实际剖面。SeisDFE 对弱小、短小或密集断层的响应更连续，溶洞检测更局部化，RGT 估计在褶皱、倾角变化与断裂地层处保留了更精细的变化。",
        cap: "实际地震资料上的合成到实际迁移。上两行：断层检测（左）与溶洞检测（右），上为 SeisDFE、下为 U-Net；下一行：两个 RGT 估计示例，各自左为 SeisDFE、右为 U-Net。",
        note: "这些工区缺少完整标签，因此比较为定性结果，并不意味着合成与实际资料之间的差距已被消除。",
        specs: [["断层检测", "冻结 · DPT 解码器"], ["溶洞检测", "冻结 · DPT 解码器"], ["RGT 估计", "LoRA（后 30 块）· DPT"], ["基线模型", "U-Net · 2423 万参数"], ["合成训练集", "44 万张剖面"]] },
      { num: "应用 02", label: "图 7", title: "稀疏标注下的三维地质体检测",
        body: "冻结的二维编码器分别编码相邻剖面，融合并堆叠其多层特征，再由轻量三维卷积解码器建模剖面间关系——这是一种仅用稀疏标注切片训练的伪三维方案。与逐剖面的二维 PUP 解码相比，它在剖面间的连续性更好，沿狭长河道尤为明显。",
        cap: "稀疏三维地质体检测。(a) 三维解释框架；(b) 用于监督的稀疏人工解释；(c) 二维 PUP 解码器的预测；(d) 三维卷积解码器的预测。各列依次为 Parihaka 与 Romney 河道、F3 盐丘及实际工区溶洞。",
        note: "缺少完整的体素级标签，这些示例评估的是所检测地质体的空间一致性，而非绝对精度。",
        specs: [["河道", "Parihaka · Romney"], ["盐丘", "F3"], ["溶洞", "实际工区"], ["解码器", "二维 PUP 对比三维卷积"], ["损失", "0.5 BCE + 0.5 Dice，仅标注切片"]] }
    ],
    kCite: "引用",
    citeTitle: "引用本工作",
    citeLede: "若 SeisDFE 对您的研究有帮助，请引用 arXiv 预印本。预训练、密集特征提取、模型蒸馏与下游评估代码以及预训练权重将在 GitHub 仓库发布。",
    repo: "代码仓库：",
    contact: "通讯作者：",
    footer: "代码与模型权重即将发布。",
    footerLinkSoon: "模型权重暂未公开，发布后将在此更新链接。",
    copy: "复制", copied: "已复制"
  }
};

const SPECS = [
  [["init", "DINOv3 ViT-7B"], ["data", "5.34M · 256²"], ["steps", "100k"], ["batch", "64"], ["gpu", "428"]],
  [["init", "@s1final"], ["gramT", "@s1ema"], ["data", "600K · 512²"], ["steps", "10k"], ["batch", "24"], ["gram", "1.0"], ["gpu", "39"]],
  [["init", "@s2"], ["sizes", "256² / 384² / 512²"], ["steps", "30k"], ["batch", "56"], ["gram", "1.5"], ["gpu", "435"]],
  [["init", "DINOv3-Large"], ["teacher", "SeisDFE-7B"], ["data", "5.34M · 256²"], ["steps", "100k"]]
];

const DOWN = [
  { decoder: "PUP", rows: [
    { m: "SeisDFE", enc: "frozen", miou: "0.8845", mpa: "0.9324", best: true },
    { m: "SeisDFE-Large", enc: "frozen", miou: "0.8768", mpa: "0.9289", large: true },
    { m: "DINOv3-7B", enc: "frozen", miou: "0.8374", mpa: "0.9221" },
    { m: "NCS-2D", enc: "frozen", miou: "0.8415", mpa: "0.9121" },
    { m: "SFM-Large", enc: "LoRA", miou: "0.8243", mpa: "0.8994" }
  ] },
  { decoder: "LINEAR", rows: [
    { m: "SeisDFE", enc: "frozen", miou: "0.8819", mpa: "0.9297", best: true },
    { m: "SeisDFE-Large", enc: "frozen", miou: "0.8565", mpa: "0.9149", large: true },
    { m: "DINOv3-7B", enc: "frozen", miou: "0.8116", mpa: "0.8815" },
    { m: "NCS-2D", enc: "LoRA", miou: "0.8046", mpa: "0.8767" },
    { m: "SFM-Large", enc: "LoRA", miou: "0.8044", mpa: "0.8773" }
  ] },
  { decoder: "MLA", rows: [
    { m: "SeisDFE", enc: "frozen", miou: "0.7374", mpa: "0.7867" },
    { m: "SeisDFE-Large", enc: "frozen", miou: "0.7090", mpa: "0.7691", large: true },
    { m: "DINOv3-7B", enc: "frozen", miou: "0.7564", mpa: "0.8023", best: true },
    { m: "NCS-2D", enc: "LoRA", miou: "0.6468", mpa: "0.7165" },
    { m: "SFM-Large", enc: "LoRA", miou: "0.6361", mpa: "0.7062" }
  ] }
];

const BIB = `@misc{guo2026seismicfoundationmodeldense,
  title         = {A Seismic Foundation Model for Dense Feature Extraction},
  author        = {Zhixiang Guo and Xinming Wu and Yimin Dou and Hui Gao and Siyao Zhao and He Huang and Wei Liu},
  year          = {2026},
  eprint        = {2611.20745},
  archivePrefix = {arXiv},
  primaryClass  = {cs.CV},
  url           = {https://arxiv.org/abs/2611.20745}
}`;

const reducedMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
};

class App extends Component {
  render() { const V = this.renderVals(); return view(V); }

  state = { lang: "en", lightbox: null, toast: null, copied: false, layer: "10", fading: false, tour: !reducedMotion(), benchTask: 0, benchAuto: !reducedMotion() };

  componentDidMount() {
    try {
      const saved = localStorage.getItem("seisdfe-lang");
      if (saved === "zh" || saved === "en") this.setState({ lang: saved });
    } catch (e) {}
    this.initReveal();
    this.initHero();
    this.initTour();
    this.initBench();
    this.onScroll = () => {
      const bar = document.querySelector("[data-progress]");
      if (!bar) return;
      const h = document.documentElement;
      const p = h.scrollHeight - h.clientHeight;
      bar.style.width = (p > 0 ? (h.scrollTop / p) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", this.onScroll, { passive: true });
  }

  componentDidUpdate(prevProps, prevState) {
    this.scanReveal();
    if (this.state.lightbox && !(prevState && prevState.lightbox)) {
      requestAnimationFrame(() => {
        const box = document.querySelector("[data-lightbox]");
        if (box) box.focus();
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("scroll", this.sweepReveal);
    if (this.onHeroResize) window.removeEventListener("resize", this.onHeroResize);
    if (this.onVis) document.removeEventListener("visibilitychange", this.onVis);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.stopTourFrame();
    this.stopBenchFrame();
    if (this.benchIo) this.benchIo.disconnect();
    if (this.onBenchVis) document.removeEventListener("visibilitychange", this.onBenchVis);
    clearTimeout(this._fadeT);
    clearTimeout(this._toastT);
    clearTimeout(this._cT);
    if (this.io) this.io.disconnect();
    if (this.cmpIo) this.cmpIo.disconnect();
    if (this.figMo) this.figMo.disconnect();
  }

  // ---------- scroll reveal ----------
  initReveal() {
    this.io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        if (el.dataset.shown) { this.io.unobserve(el); return; }
        el.dataset.shown = "1";
        const delay = (Number(el.dataset.i) || 0) * 70;
        el.style.animation = `revealUp .8s cubic-bezier(.2,.7,.2,1) ${delay}ms forwards`;
        this.io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    this.scanReveal();
    this.sweepReveal = () => {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        if (el.dataset.shown) return;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top < window.innerHeight) {
          el.dataset.shown = "1";
          el.style.animation = "revealUp .8s cubic-bezier(.2,.7,.2,1) forwards";
          if (this.io) this.io.unobserve(el);
        }
      });
    };
    window.addEventListener("scroll", this.sweepReveal, { passive: true });
    this.figMo = new MutationObserver(() => this.scanReveal());
    this.figMo.observe(document.body, { childList: true, subtree: true });
  }

  scanReveal() {
    if (!this.io) return;
    document.querySelectorAll("[data-reveal]").forEach((el, i) => {
      if (el.dataset.revwatch) return;
      el.dataset.revwatch = "1";
      el.dataset.i = i % 4;
      this.io.observe(el);
    });
    if (this.sweepReveal) this.sweepReveal();
  }

  // ---------- seismic / PCA comparison tour ----------
  initTour() {
    LAYERS.forEach((l) => { const im = new Image(); im.src = IMG.layers[l]; });
    this.cmpVisible = true;
    this.setSplit(this.state.tour ? 100 : 50);
    const cmp = document.querySelector("[data-cmp]");
    if (cmp && "IntersectionObserver" in window) {
      this.cmpIo = new IntersectionObserver((entries) => {
        this.cmpVisible = entries[0].isIntersecting;
        if (this.cmpVisible) this.startTourFrame(); else this.stopTourFrame();
      }, { threshold: 0.12 });
      this.cmpIo.observe(cmp);
    }
    this.onVis = () => { if (document.hidden) this.stopTourFrame(); else this.startTourFrame(); };
    document.addEventListener("visibilitychange", this.onVis);
    this.startTourFrame();
  }

  setSplit(v) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    this.split = v;
    const cmp = document.querySelector("[data-cmp]");
    if (!cmp) return;
    cmp.style.setProperty("--split", v + "%");
    const input = cmp.querySelector("input[type=range]");
    if (input && String(input.value) !== String(v)) input.value = String(v);
    const tl = cmp.querySelector('[data-tag="l"]');
    const tr = cmp.querySelector('[data-tag="r"]');
    if (tl) tl.style.opacity = v < 14 ? "0" : "1";
    if (tr) tr.style.opacity = v > 86 ? "0" : "1";
  }

  tourSplit(p) {
    const ease = (x) => x * x * (3 - 2 * x);
    if (p <= 0.12) return 100;
    if (p < 0.78) return 100 * (1 - ease((p - 0.12) / 0.66));
    return 0;
  }

  startTourFrame() {
    if (!this.state.tour || !this.cmpVisible || document.hidden || this.tourRaf) return;
    this.tourStart = 0;
    const step = (ts) => {
      if (!this.state.tour || !this.cmpVisible || document.hidden) { this.stopTourFrame(); return; }
      if (!this.tourStart) this.tourStart = ts;
      const p = Math.min((ts - this.tourStart) / TOUR_MS, 1);
      const fill = document.querySelector("[data-tour-fill]");
      if (fill) fill.style.transform = `scaleX(${p})`;
      this.setSplit(this.tourSplit(p));
      if (p >= 1) {
        const next = LAYERS[(LAYERS.indexOf(this.state.layer) + 1) % LAYERS.length];
        this.setSplit(100);
        this.swapLayer(next);
        this.tourStart = ts;
      }
      this.tourRaf = requestAnimationFrame(step);
    };
    this.tourRaf = requestAnimationFrame(step);
  }

  stopTourFrame() {
    if (this.tourRaf) cancelAnimationFrame(this.tourRaf);
    this.tourRaf = 0;
  }

  pauseTour() {
    if (this.state.tour) this.setState({ tour: false });
    this.stopTourFrame();
    const fill = document.querySelector("[data-tour-fill]");
    if (fill) fill.style.transform = "scaleX(0)";
  }

  swapLayer(layer) {
    if (layer === this.state.layer) return;
    clearTimeout(this._fadeT);
    if (reducedMotion()) { this.setState({ layer, fading: false }); return; }
    this.setState({ fading: true });
    this._fadeT = setTimeout(() => this.setState({ layer, fading: false }), 260);
  }

  // ---------- downstream benchmark auto-rotation ----------
  initBench() {
    PRED.forEach((src) => { const im = new Image(); im.src = src; });
    this.benchVisible = false;
    const panel = document.querySelector("[data-bench]");
    if (panel && "IntersectionObserver" in window) {
      this.benchIo = new IntersectionObserver((entries) => {
        this.benchVisible = entries[0].isIntersecting;
        if (this.benchVisible) this.startBenchFrame(); else this.stopBenchFrame();
      }, { threshold: 0.25 });
      this.benchIo.observe(panel);
    } else {
      this.benchVisible = true;
      this.startBenchFrame();
    }
    this.onBenchVis = () => { if (document.hidden) this.stopBenchFrame(); else this.startBenchFrame(); };
    document.addEventListener("visibilitychange", this.onBenchVis);
  }

  startBenchFrame() {
    if (!this.state.benchAuto || !this.benchVisible || document.hidden || this.benchRaf) return;
    this.benchStart = 0;
    const step = (ts) => {
      if (!this.state.benchAuto || !this.benchVisible || document.hidden) { this.stopBenchFrame(); return; }
      if (!this.benchStart) this.benchStart = ts;
      const p = Math.min((ts - this.benchStart) / BENCH_MS, 1);
      const fill = document.querySelector("[data-bench-fill]");
      if (fill) fill.style.transform = `scaleX(${p})`;
      if (p >= 1) {
        this.setState({ benchTask: (this.state.benchTask + 1) % DOWN.length });
        this.benchStart = ts;
      }
      this.benchRaf = requestAnimationFrame(step);
    };
    this.benchRaf = requestAnimationFrame(step);
  }

  stopBenchFrame() {
    if (this.benchRaf) cancelAnimationFrame(this.benchRaf);
    this.benchRaf = 0;
  }

  pauseBench() {
    if (this.state.benchAuto) this.setState({ benchAuto: false });
    this.stopBenchFrame();
    const fill = document.querySelector("[data-bench-fill]");
    if (fill) fill.style.transform = "scaleX(0)";
  }

  // ---------- hero ----------
  initHero() {
    const canvas = document.querySelector("canvas[data-hero]");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._w = r.width; this._h = r.height;
    };
    fit();
    this.onHeroResize = fit;
    window.addEventListener("resize", fit);
    const lines = 52;
    const faults = [
      { fx: 0.19, dip: 0.30, thr: 0.055 },
      { fx: 0.46, dip: -0.22, thr: -0.042 },
      { fx: 0.71, dip: 0.18, thr: 0.036 },
      { fx: 0.89, dip: -0.26, thr: -0.028 }
    ];
    const still = reducedMotion();
    const draw = (t) => {
      const w = this._w, h = this._h;
      ctx.clearRect(0, 0, w, h);
      const drift = t * 0.00016;
      const fold = (x, i) => {
        const k = (2 * Math.PI) / (w * 0.72);
        const depth = 0.35 + 1.25 * (i / lines);
        return depth * (
          h * 0.052 * Math.sin(x * k + drift) +
          h * 0.030 * Math.sin(x * k * 2.15 - drift * 1.7 + 0.9) +
          h * 0.014 * Math.sin(x * k * 3.7 + drift * 0.6 + 2.1)
        );
      };
      const planeX = (f, y) => f.fx * w + f.dip * (y - h * 0.5);
      const meetX = (f, i, base, shift) => {
        let x = f.fx * w;
        for (let k = 0; k < 4; k++) x = planeX(f, base + fold(x, i) + shift);
        return x;
      };
      for (let i = 0; i < lines; i++) {
        const base = (i / lines) * h * 1.3 - h * 0.14;
        const accent = i % 8 === 3;
        ctx.strokeStyle = accent ? "rgba(235,162,74,0.28)" : "rgba(198,213,231,0.07)";
        ctx.lineWidth = accent ? 1.2 : 0.9;
        let shift = 0;
        for (let b = 0; b <= faults.length; b++) {
          const xL = b === 0 ? 0 : meetX(faults[b - 1], i, base, shift);
          const xR = b === faults.length ? w : meetX(faults[b], i, base, shift);
          const a = Math.max(0, xL), z = Math.min(w, xR);
          if (z > a) {
            ctx.beginPath();
            ctx.moveTo(a, base + fold(a, i) + shift);
            for (let x = a + 6; x < z; x += 6) ctx.lineTo(x, base + fold(x, i) + shift);
            ctx.lineTo(z, base + fold(z, i) + shift);
            ctx.stroke();
          }
          if (b < faults.length) shift += faults[b].thr * h;
        }
      }
      for (const f of faults) {
        ctx.beginPath();
        ctx.moveTo(f.fx * w + f.dip * (-h * 0.5), 0);
        ctx.lineTo(f.fx * w + f.dip * (h * 0.5), h);
        ctx.strokeStyle = "rgba(235,162,74,0.10)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (!still) this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
  }

  // ---------- misc ----------
  setLang(lang) {
    this.setState({ lang });
    try { localStorage.setItem("seisdfe-lang", lang); } catch (e) {}
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }

  linkFor(key) {
    const p = this.props || {};
    const map = { paper: p.paperUrl, code: p.githubUrl ?? GH, weights: p.weightsUrl };
    return (map[key] || "").trim();
  }

  showToast(msg) {
    this.setState({ toast: msg });
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.setState({ toast: null }), 2600);
  }

  renderVals() {
    const lang = this.state.lang;
    const t = DICT[lang];
    const pill = (on) => `padding:7px 14px;min-height:32px;border-radius:999px;border:none;cursor:pointer;font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.08em;transition:background .3s,color .3s;background:${on ? "#eba24a" : "transparent"};color:${on ? "#120d06" : "#9a9da2"};font-weight:${on ? 600 : 400}`;
    const layerPill = (on) => `height:40px;min-width:46px;padding:0 12px;border-radius:999px;cursor:pointer;font-family:'Roboto Mono',monospace;font-size:12px;letter-spacing:.06em;transition:background .25s,color .25s,border-color .25s;border:1px solid ${on ? "#eba24a" : "rgba(255,255,255,.14)"};background:${on ? "#eba24a" : "rgba(255,255,255,.02)"};color:${on ? "#120d06" : "#c3c6ca"};font-weight:${on ? 600 : 400}`;
    const target = (k) => (this.linkFor(k) ? "_blank" : "_self");
    const layer = this.state.layer;
    const tour = this.state.tour;

    const stages = t.stages.map((s, i) => ({
      num: s.num, title: s.title, body: s.body,
      border: i === 3 ? "rgba(235,162,74,.22)" : "rgba(255,255,255,.09)",
      numColor: i === 3 ? "#d9b88c" : "#eba24a",
      specs: SPECS[i].map(([k, v]) => ({ k: t.specKeys[k], v: v.charAt(0) === "@" ? t.specVals[v.slice(1)] : v }))
    }));

    return {
      t,
      lang,
      setEn: () => this.setLang("en"),
      setZh: () => this.setLang("zh"),
      enBtn: pill(lang === "en"),
      zhBtn: pill(lang === "zh"),
      paperHref: this.linkFor("paper") || "#citation",
      codeHref: this.linkFor("code") || "#citation",
      weightsHref: this.linkFor("weights") || "#citation",
      paperTarget: target("paper"),
      codeTarget: target("code"),
      weightsTarget: target("weights"),
      onLink: (e) => {
        const key = e.currentTarget.dataset.link;
        if (!this.linkFor(key)) { e.preventDefault(); this.showToast(t.footerLinkSoon); }
      },
      stages,

      layer,
      layerSrc: IMG.layers[layer],
      layerAlt: t.wFeatAlt.replace("{n}", layer),
      featTag: `L${layer} · ${t.wTagFeat}`,
      featOpacity: this.state.fading ? "0.3" : "1",
      featFilter: this.state.fading ? "blur(2px)" : "none",
      layerDesc: t.layerDesc[layer],
      layers: LAYERS.map((n) => ({
        n,
        pressed: n === layer ? "true" : "false",
        style: layerPill(n === layer),
        pick: () => { this.pauseTour(); this.swapLayer(n); if (this.split > 90) this.setSplit(50); }
      })),
      onScrub: (e) => { this.pauseTour(); this.setSplit(Number(e.target.value)); },
      pauseTour: () => this.pauseTour(),
      toggleTour: () => {
        if (this.state.tour) { this.pauseTour(); return; }
        this.setState({ tour: true }, () => { this.setSplit(100); this.startTourFrame(); });
      },
      tourPressed: tour ? "true" : "false",
      tourBtn: tour ? t.wPause : t.wPlay,
      tourState: tour ? t.wAuto : t.wManual,
      tourDot: `width:6px;height:6px;border-radius:50%;flex:none;background:${tour ? "#eba24a" : "#5c5f66"};${tour ? "animation:pulseDot 2.2s ease-in-out infinite" : ""}`,

      bench: (() => {
        const bi = this.state.benchTask;
        const g = DOWN[bi];
        const d = t.bench[bi];
        const maxIoU = Math.max(...g.rows.map((r) => Number(r.miou)));
        const maxPA = Math.max(...g.rows.map((r) => Number(r.mpa)));
        const others = g.rows.filter((r) => r.m.indexOf("SeisDFE") !== 0);
        const bestOther = others.reduce((a, b) => (Number(b.miou) > Number(a.miou) ? b : a));
        const diff = Number(g.rows[0].miou) - Number(bestOther.miou);
        return {
          img: PRED[bi],
          alt: t.alt.figs2,
          meta: d.meta.map(([k, v]) => ({ k, v })),
          insight: d.insight,
          delta: (diff >= 0 ? "+" : "−") + Math.abs(diff).toFixed(4),
          deltaLabel: t.benchDeltaLabel.replace("{m}", bestOther.m),
          rows: g.rows.map((r) => {
            const ours = r.m === "SeisDFE";
            return {
              m: r.m,
              enc: (r.enc === "frozen" ? t.frozen : r.enc).toUpperCase(),
              miou: r.miou, mpa: r.mpa,
              iouW: (Number(r.miou) * 100).toFixed(1) + "%",
              paW: (Number(r.mpa) * 100).toFixed(1) + "%",
              iouColor: Number(r.miou) === maxIoU ? "#eba24a" : "#c3c6ca",
              paColor: Number(r.mpa) === maxPA ? "#eba24a" : "#c3c6ca",
              nameColor: ours ? "#eba24a" : r.large ? "#d9b88c" : "#d6d8db",
              weight: ours ? "500" : "400",
              bar: ours ? "#eba24a" : r.large ? "rgba(217,184,140,.75)" : "rgba(195,198,202,.38)"
            };
          })
        };
      })(),
      benchTabs: t.bench.map((b, i) => ({
        label: b.tab,
        selected: i === this.state.benchTask ? "true" : "false",
        style: `height:36px;padding:0 16px;border-radius:999px;border:none;cursor:pointer;font-size:13px;transition:background .25s,color .25s;background:${i === this.state.benchTask ? "#eba24a" : "transparent"};color:${i === this.state.benchTask ? "#120d06" : "#9a9da2"};font-weight:${i === this.state.benchTask ? 600 : 400}`,
        pick: () => { this.pauseBench(); this.setState({ benchTask: i }); }
      })),
      toggleBench: () => {
        if (this.state.benchAuto) { this.pauseBench(); return; }
        this.setState({ benchAuto: true }, () => this.startBenchFrame());
      },
      benchPressed: this.state.benchAuto ? "true" : "false",
      benchBtn: this.state.benchAuto ? t.benchPause : t.benchAuto,
      benchDot: `width:6px;height:6px;border-radius:50%;flex:none;background:${this.state.benchAuto ? "#eba24a" : "#5c5f66"};${this.state.benchAuto ? "animation:pulseDot 2.2s ease-in-out infinite" : ""}`,
      stageTable: [
        { name: t.stageTable[0], miou: "0.6332", mpa: "0.8143", dMiou: "", dMpa: "", color: "#c3c6ca", labelColor: "#7a7d84" },
        { name: t.stageTable[1], miou: "0.6431", mpa: "0.8247", dMiou: "+0.0099", dMpa: "+0.0104", color: "#d6d8db", labelColor: "#7a7d84" },
        { name: t.stageTable[2], miou: "0.6530", mpa: "0.8297", dMiou: "+0.0198", dMpa: "+0.0154", color: "#eba24a", labelColor: "#eba24a" }
      ],
      apps: t.apps.map((a, i) => ({
        ...a,
        src: i === 0 ? IMG.fig4 : IMG.fig5,
        alt: i === 0 ? t.alt.fig4 : t.alt.fig5,
        specs: a.specs.map(([k, v]) => ({ k, v }))
      })),
      fewShot: t.fewShot,
      highlights: t.highlights,
      bibtex: BIB,
      copyLabel: this.state.copied ? t.copied : t.copy,
      copyBib: () => {
        const done = () => { this.setState({ copied: true }); clearTimeout(this._cT); this._cT = setTimeout(() => this.setState({ copied: false }), 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(BIB).then(done, done); else done();
      },
      openFig: (e) => {
        const img = e.currentTarget.querySelector("img");
        if (img) this.setState({ lightbox: img.getAttribute("src") });
      },
      lightbox: this.state.lightbox,
      closeLightbox: () => this.setState({ lightbox: null }),
      lightboxKey: (e) => { if (e.key === "Escape") this.setState({ lightbox: null }); },
      toast: this.state.toast
    };
  }
}

render(h(App, {"paperUrl": "https://arxiv.org/abs/2611.20745", "githubUrl": "https://github.com/ProgrammerZXG/SeisDFE", "weightsUrl": ""}), document.getElementById("app"));
