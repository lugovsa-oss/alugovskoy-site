
(function () {
  "use strict";

  const DEFAULT_FREQ = { fmin: 1e-2, fmax: 1e5, points: 160 };

  const PRESETS = {
    two_semicircles: {
      label: "Two semicircles",
      circuit: "R0-(R1||C1)-(R2||C2)",
      params: {
        R0: 12,
        R1: 180,
        C1: 8e-4,
        R2: 60,
        C2: 6e-6
      }
    },
    depressed_arc: {
      label: "Depressed arc",
      circuit: "R0-(R1||Q1)-(R2||Q2)",
      params: {
        R0: 10,
        R1: 110,
        Q1_Y0: 8e-5,
        Q1_n: 0.82,
        R2: 90,
        Q2_Y0: 1.2e-4,
        Q2_n: 0.78
      }
    },
    warburg_tail: {
      label: "Warburg tail",
      circuit: "R0-(R1||C1)-W1",
      params: {
        R0: 10,
        R1: 120,
        C1: 2e-5,
        W1: 40
      }
    },
    capacitive_limit: {
      label: "Capacitive limit",
      circuit: "R0-(R1||C1)",
      params: {
        R0: 8,
        R1: 1e6,
        C1: 1.5e-5
      }
    },
    inductive_loop: {
      label: "Inductive loop",
      circuit: "R0-(R1||C1)-L1",
      params: {
        R0: 10,
        R1: 100,
        C1: 1e-4,
        L1: 2e-3
      }
    }
  };

  const state = {
    circuit: PRESETS.two_semicircles.circuit,
    params: Object.assign({}, PRESETS.two_semicircles.params),
    defaults: Object.assign({}, PRESETS.two_semicircles.params),
    elements: [],
    lastResult: null
  };

  function $(id) { return document.getElementById(id); }

  // ---------- complex arithmetic ----------
  function C(re, im) { return { re, im }; }
  function cAdd(a, b) { return C(a.re + b.re, a.im + b.im); }
  function cSub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function cMul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function cScale(a, s) { return C(a.re * s, a.im * s); }
  function cDiv(a, b) {
    const den = b.re * b.re + b.im * b.im;
    if (!isFinite(den) || den === 0) return C(NaN, NaN);
    return C((a.re * b.re + a.im * b.im) / den, (a.im * b.re - a.re * b.im) / den);
  }
  function cInv(a) {
    const den = a.re * a.re + a.im * a.im;
    if (!isFinite(den) || den === 0) return C(NaN, NaN);
    return C(a.re / den, -a.im / den);
  }
  function cAbs(a) { return Math.hypot(a.re, a.im); }
  function cPowJW(w, alpha) {
    const mag = Math.pow(w, alpha);
    const ang = alpha * Math.PI / 2;
    return C(mag * Math.cos(ang), mag * Math.sin(ang));
  }

  // ---------- parser ----------
  function tokenize(s) {
    const tokens = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (s.startsWith("||", i)) { tokens.push({ type: "PAR" }); i += 2; continue; }
      if (ch === "-") { tokens.push({ type: "SER" }); i++; continue; }
      if (ch === "(") { tokens.push({ type: "LP" }); i++; continue; }
      if (ch === ")") { tokens.push({ type: "RP" }); i++; continue; }
      const m = s.slice(i).match(/^[A-Za-z][A-Za-z0-9_]*/);
      if (m) {
        tokens.push({ type: "ID", value: m[0] });
        i += m[0].length;
        continue;
      }
      throw new Error("Unexpected character at position " + (i + 1) + ": " + ch);
    }
    return tokens;
  }

  function parseCircuit(s) {
    const tokens = tokenize(s);
    let pos = 0;

    function peek() { return tokens[pos] || null; }
    function consume(type) {
      const t = peek();
      if (!t || t.type !== type) {
        throw new Error("Expected " + type + " near token " + (pos + 1));
      }
      pos++;
      return t;
    }

    function parsePrimary() {
      const t = peek();
      if (!t) throw new Error("Unexpected end of expression");
      if (t.type === "ID") {
        pos++;
        return { type: "element", name: t.value };
      }
      if (t.type === "LP") {
        consume("LP");
        const expr = parseSeries();
        consume("RP");
        return expr;
      }
      throw new Error("Unexpected token near position " + (pos + 1));
    }

    function parseParallel() {
      let node = parsePrimary();
      while (peek() && peek().type === "PAR") {
        consume("PAR");
        const right = parsePrimary();
        if (node.type === "parallel") node.items.push(right);
        else node = { type: "parallel", items: [node, right] };
      }
      return node;
    }

    function parseSeries() {
      let node = parseParallel();
      while (peek() && peek().type === "SER") {
        consume("SER");
        const right = parseParallel();
        if (node.type === "series") node.items.push(right);
        else node = { type: "series", items: [node, right] };
      }
      return node;
    }

    const ast = parseSeries();
    if (pos !== tokens.length) throw new Error("Unexpected trailing tokens");
    return ast;
  }

  function collectElements(ast, out) {
    if (ast.type === "element") {
      out.push(ast.name);
      return;
    }
    (ast.items || []).forEach(item => collectElements(item, out));
  }

  // ---------- defaults ----------
  function defaultParamsForElement(name) {
    const t = name[0].toUpperCase();
    if (t === "R") return { [name]: 100 };
    if (t === "C") return { [name]: 1e-5 };
    if (t === "L") return { [name]: 1e-3 };
    if (t === "Q") return { [name + "_Y0"]: 1e-4, [name + "_n"]: 0.85 };
    if (t === "W") return { [name]: 20 };
    if (t === "G") return { [name + "_Y0"]: 0.01, [name + "_k"]: 10 };
    throw new Error("Unsupported element: " + name);
  }

  function ensureParamsForCircuit(circuit, incomingParams) {
    const ast = parseCircuit(circuit);
    const names = [];
    collectElements(ast, names);
    const unique = Array.from(new Set(names));
    const merged = {};
    unique.forEach(name => {
      Object.assign(merged, defaultParamsForElement(name));
    });
    Object.keys(incomingParams || {}).forEach(k => { merged[k] = incomingParams[k]; });
    return { ast, elementNames: unique, params: merged };
  }

  // ---------- impedance builders ----------
  function buildElement(name, params) {
    const t = name[0].toUpperCase();
    if (t === "R") {
      const R = positive(params[name], 1e-12);
      return function () { return C(R, 0); };
    }
    if (t === "C") {
      const cap = positive(params[name], 1e-15);
      return function (w) { return C(0, -1 / (w * cap)); };
    }
    if (t === "L") {
      const L = positive(params[name], 1e-15);
      return function (w) { return C(0, w * L); };
    }
    if (t === "Q") {
      const Y0 = positive(params[name + "_Y0"], 1e-15);
      const n = clampNumber(params[name + "_n"], 0.05, 1.0, 0.85);
      return function (w) {
        const y = cScale(cPowJW(w, n), Y0);
        return cInv(y);
      };
    }
    if (t === "W") {
      const sigma = positive(params[name], 1e-12);
      return function (w) {
        const root = Math.sqrt(w);
        return C(sigma / root, -sigma / root);
      };
    }
    if (t === "G") {
      const Y0 = positive(params[name + "_Y0"], 1e-12);
      const k = positive(params[name + "_k"], 1e-12);
      return function (w) {
        const denom = cPowFromRealPlusJW(k, w, 0.5);
        const y = cScale(cInv(denom), Y0);
        return cInv(y);
      };
    }
    throw new Error("Unsupported element: " + name);
  }

  function cPowFromRealPlusJW(a, w, p) {
    const r = Math.hypot(a, w);
    const theta = Math.atan2(w, a);
    const mag = Math.pow(r, p);
    return C(mag * Math.cos(p * theta), mag * Math.sin(p * theta));
  }

  function positive(v, minv) {
    const x = Number(v);
    if (!isFinite(x) || x <= minv) return minv;
    return x;
  }

  function clampNumber(v, lo, hi, fallback) {
    const x = Number(v);
    if (!isFinite(x)) return fallback;
    return Math.max(lo, Math.min(hi, x));
  }

  function buildFromAst(ast, params) {
    if (ast.type === "element") return buildElement(ast.name, params);
    if (ast.type === "series") {
      const items = ast.items.map(item => buildFromAst(item, params));
      return function (w) {
        return items.reduce((acc, fn) => cAdd(acc, fn(w)), C(0, 0));
      };
    }
    if (ast.type === "parallel") {
      const items = ast.items.map(item => buildFromAst(item, params));
      return function (w) {
        let y = C(0, 0);
        for (const fn of items) {
          y = cAdd(y, cInv(fn(w)));
        }
        return cInv(y);
      };
    }
    throw new Error("Bad AST");
  }

  // ---------- UI ----------
  function createParamInputs(params, elementNames) {
    const box = $("ais-params");
    box.innerHTML = "";
    const keys = [];
    elementNames.forEach(name => {
      const t = name[0].toUpperCase();
      if (t === "Q") keys.push(name + "_Y0", name + "_n");
      else if (t === "G") keys.push(name + "_Y0", name + "_k");
      else keys.push(name);
    });
    keys.forEach(key => {
      const row = document.createElement("div");
      row.className = "ais-param-row";
      const label = document.createElement("label");
      label.textContent = key;
      label.htmlFor = "param_" + key;
      const input = document.createElement("input");
      input.id = "param_" + key;
      input.dataset.key = key;
      input.value = formatNumber(params[key]);
      input.addEventListener("change", onParamChange);
      input.addEventListener("keydown", function(evt){
        if (evt.key === "Enter") {
          onParamChange({ target: input });
        }
      });
      row.appendChild(label);
      row.appendChild(input);
      box.appendChild(row);
    });

    const applyRow = document.createElement("div");
    applyRow.className = "ais-apply-row";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.textContent = "Apply parameters";
    applyBtn.addEventListener("click", applyAllParamsFromInputs);
    applyRow.appendChild(applyBtn);
    box.appendChild(applyRow);
  }

  function formatNumber(x) {
    if (!isFinite(x)) return "";
    if (Math.abs(x) >= 1e4 || (Math.abs(x) > 0 && Math.abs(x) < 1e-3)) return x.toExponential(3);
    return String(Number(x.toPrecision(6)));
  }


function parseUserNumber(str) {
  if (typeof str !== "string") return NaN;
  const s = str.trim().replace(",", ".");
  if (!s) return NaN;
  return Number(s);
}

function applyAllParamsFromInputs() {
  const inputs = document.querySelectorAll("#ais-params input[data-key]");
  let changed = 0;
  inputs.forEach(input => {
    const key = input.dataset.key;
    const value = parseUserNumber(input.value);
    if (isFinite(value)) {
      state.params[key] = value;
      changed += 1;
    }
  });
  if (changed > 0) runSimulation();
}

function onParamChange(evt) {
  const key = evt.target.dataset.key;
  const value = parseUserNumber(evt.target.value);
  if (isFinite(value)) {
    state.params[key] = value;
    runSimulation();
  }
}

function setStatus(msg, isError) {
    const el = $("ais-status");
    el.textContent = msg;
    el.className = isError ? "ais-status error" : "ais-status";
  }

  function updateModelSummary(elementNames) {
    $("ais-model-summary").innerHTML =
      "<div><strong>Circuit:</strong> " + escapeHtml(state.circuit) + "</div>" +
      "<div><strong>Elements:</strong> " + elementNames.map(escapeHtml).join(", ") + "</div>" +
      "<div><strong>Frequency range:</strong> " + DEFAULT_FREQ.fmin + " Hz to " + DEFAULT_FREQ.fmax + " Hz</div>";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m];
    });
  }

  // ---------- plotting ----------
  function clearCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawPlot(canvas, series, options) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);

    const pad = { left: 60, right: 18, top: 24, bottom: 42 };
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    series.forEach(p => {
      if (!isFinite(p.x) || !isFinite(p.y)) return;
      xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x);
      ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y);
    });
    if (!isFinite(xmin) || !isFinite(ymin)) {
      ctx.fillStyle = "#a00";
      ctx.fillText("No finite data", 20, 30);
      return;
    }
    if (options.equalAspect) {
      const xr = xmax - xmin || 1;
      const yr = ymax - ymin || 1;
      const dataRatio = xr / yr;
      const plotRatio = (w - pad.left - pad.right) / (h - pad.top - pad.bottom);
      if (dataRatio > plotRatio) {
        const newYr = xr / plotRatio;
        const mid = 0.5 * (ymin + ymax);
        ymin = mid - newYr / 2;
        ymax = mid + newYr / 2;
      } else {
        const newXr = yr * plotRatio;
        const mid = 0.5 * (xmin + xmax);
        xmin = mid - newXr / 2;
        xmax = mid + newXr / 2;
      }
    }
    if (xmin === xmax) { xmin -= 1; xmax += 1; }
    if (ymin === ymax) { ymin -= 1; ymax += 1; }

    function sx(x) { return pad.left + (x - xmin) / (xmax - xmin) * (w - pad.left - pad.right); }
    function sy(y) { return h - pad.bottom - (y - ymin) / (ymax - ymin) * (h - pad.top - pad.bottom); }

    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.stroke();

    // physical zero axes when visible in the current window
    ctx.save();
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    if (options.showZeroX && xmin <= 0 && xmax >= 0) {
      const x0 = sx(0);
      ctx.beginPath();
      ctx.moveTo(x0, pad.top);
      ctx.lineTo(x0, h - pad.bottom);
      ctx.stroke();
    }
    if (options.showZeroY && ymin <= 0 && ymax >= 0) {
      const y0 = sy(0);
      ctx.beginPath();
      ctx.moveTo(pad.left, y0);
      ctx.lineTo(w - pad.right, y0);
      ctx.stroke();
    }
    ctx.restore();

    // ticks
    ctx.fillStyle = "#444";
    ctx.font = "12px sans-serif";
    for (let i = 0; i <= 5; i++) {
      const xv = xmin + (xmax - xmin) * i / 5;
      const px = sx(xv);
      ctx.beginPath();
      ctx.moveTo(px, h - pad.bottom);
      ctx.lineTo(px, h - pad.bottom + 5);
      ctx.stroke();
      ctx.fillText(formatTick(xv), px - 12, h - pad.bottom + 18);
    }
    for (let i = 0; i <= 5; i++) {
      const yv = ymin + (ymax - ymin) * i / 5;
      const py = sy(yv);
      ctx.beginPath();
      ctx.moveTo(pad.left - 5, py);
      ctx.lineTo(pad.left, py);
      ctx.stroke();
      ctx.fillText(formatTick(yv), 6, py + 4);
    }

    ctx.fillStyle = "#111";
    ctx.font = "14px sans-serif";
    ctx.fillText(options.title, pad.left, 16);
    if (options.showZeroY && ymin <= 0 && ymax >= 0) {
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#666";
      ctx.fillText("y = 0", w - pad.right - 36, sy(0) - 6);
      ctx.fillStyle = "#111";
      ctx.font = "14px sans-serif";
    }

    // axis labels
    ctx.font = "13px sans-serif";
    ctx.fillText(options.xlabel, w / 2 - 40, h - 10);
    ctx.save();
    ctx.translate(15, h / 2 + 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(options.ylabel, 0, 0);
    ctx.restore();

    ctx.strokeStyle = options.color || "#174";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    series.forEach(p => {
      if (!isFinite(p.x) || !isFinite(p.y)) return;
      const x = sx(p.x), y = sy(p.y);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    if (options.markEnds && series.length >= 2) {
      const first = series[0];
      const last = series[series.length - 1];
      ctx.fillStyle = "#a00";
      ctx.font = "11px sans-serif";
      ctx.fillText("HF", sx(first.x) + 4, sy(first.y) - 6);
      ctx.fillText("LF", sx(last.x) + 4, sy(last.y) - 6);
    }
  }

  function formatTick(x) {
    if (!isFinite(x)) return "";
    if (Math.abs(x) >= 1e4 || (Math.abs(x) > 0 && Math.abs(x) < 1e-3)) return x.toExponential(1);
    return String(Number(x.toPrecision(3)));
  }

  function drawAllPlots(result) {
    drawPlot($("ais-nyquist"), result.nyquist, {
      title: "Nyquist plot",
      xlabel: "Z' (Ohm)",
      ylabel: "-Z'' (Ohm)",
      equalAspect: true,
      color: "#196f3d",
      showZeroX: true,
      showZeroY: true,
      markEnds: true
    });
    drawPlot($("ais-bode-mag"), result.bodeMag, {
      title: "Bode magnitude",
      xlabel: "log10(f / Hz)",
      ylabel: "|Z| (Ohm)",
      color: "#1f4e79",
      showZeroX: false,
      showZeroY: false
    });
    drawPlot($("ais-bode-phase"), result.bodePhase, {
      title: "Bode phase",
      xlabel: "log10(f / Hz)",
      ylabel: "-Phase (deg)",
      color: "#7d3c98",
      showZeroX: false,
      showZeroY: false
    });
  }

  function exportPNG() {
    if (!state.lastResult) {
      setStatus("Nothing to export yet.", true);
      return;
    }
    const ny = $("ais-nyquist"), bm = $("ais-bode-mag"), bp = $("ais-bode-phase");
    const out = document.createElement("canvas");
    out.width = 900;
    out.height = 980;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.fillStyle = "#111";
    ctx.font = "20px sans-serif";
    ctx.fillText("Impedance Simulator", 24, 30);
    ctx.font = "14px sans-serif";
    ctx.fillText("Circuit: " + state.circuit, 24, 56);
    let y = 84;
    ctx.drawImage(ny, 24, y, 852, 300); y += 320;
    ctx.drawImage(bm, 24, y, 852, 230); y += 250;
    ctx.drawImage(bp, 24, y, 852, 230); y += 250;
    ctx.fillStyle = "#222";
    ctx.font = "12px sans-serif";
    let line = "Parameters: ";
    const keys = Object.keys(state.params).sort();
    for (let i = 0; i < keys.length; i++) {
      const frag = keys[i] + "=" + formatNumber(state.params[keys[i]]) + (i < keys.length - 1 ? ", " : "");
      if ((line + frag).length > 110) {
        ctx.fillText(line, 24, y);
        y += 16;
        line = frag;
      } else {
        line += frag;
      }
    }
    ctx.fillText(line, 24, y);

    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = "impedance-simulator.png";
    a.click();
  }

  // ---------- simulation ----------
  function generateFrequencies() {
    const arr = [];
    const lmin = Math.log10(DEFAULT_FREQ.fmin);
    const lmax = Math.log10(DEFAULT_FREQ.fmax);
    for (let i = 0; i < DEFAULT_FREQ.points; i++) {
      const lf = lmax - (lmax - lmin) * i / (DEFAULT_FREQ.points - 1);
      arr.push(Math.pow(10, lf));
    }
    arr.sort(function (a, b) { return b - a; });
    return arr;
  }

  function simulate(ast, params) {
    const Z = buildFromAst(ast, params);
    const freqs = generateFrequencies();
    const nyquist = [], bodeMag = [], bodePhase = [];
    freqs.forEach(f => {
      const w = 2 * Math.PI * f;
      const z = Z(w);
      if (!isFinite(z.re) || !isFinite(z.im)) return;
      nyquist.push({ x: z.re, y: -z.im });
      bodeMag.push({ x: Math.log10(f), y: cAbs(z) });
      bodePhase.push({ x: Math.log10(f), y: -Math.atan2(z.im, z.re) * 180 / Math.PI });
    });
    if (!nyquist.length) throw new Error("The model produced no finite points.");
    return { nyquist, bodeMag, bodePhase };
  }

  function syncCircuitInput() {
    $("ais-circuit").value = state.circuit;
  }

  function loadPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    state.circuit = p.circuit;
    state.params = Object.assign({}, p.params);
    state.defaults = Object.assign({}, p.params);
    syncCircuitInput();
    runSimulation();
  }

  function runSimulation() {
    try {
      state.circuit = $("ais-circuit").value.trim();
      const info = ensureParamsForCircuit(state.circuit, state.params);
      state.params = info.params;
      state.elements = info.elementNames;
      createParamInputs(state.params, state.elements);
      updateModelSummary(state.elements);
      const result = simulate(info.ast, state.params);
      state.lastResult = result;
      drawAllPlots(result);
      const hasNegativeNyquist = result.nyquist.some(function (p) { return p.y < 0; });
      setStatus(
        "Rendered " + result.nyquist.length + " frequency points. HF and LF are marked on Nyquist." +
        (hasNegativeNyquist ? " Nyquist curve enters the region below y = 0." : ""),
        false
      );
    } catch (err) {
      setStatus(err.message || String(err), true);
    }
  }

  function resetDefaults() {
    state.params = Object.assign({}, state.defaults);
    createParamInputs(state.params, state.elements || []);
    runSimulation();
  }

  function init() {
    $("ais-run").addEventListener("click", runSimulation);
    $("ais-reset").addEventListener("click", resetDefaults);
    $("ais-export").addEventListener("click", exportPNG);
    $("ais-load-preset").addEventListener("click", function () {
      loadPreset($("ais-preset").value);
    });
    $("ais-circuit").addEventListener("change", runSimulation);
    syncCircuitInput();
    runSimulation();
  }

  window.aisImpedanceRun = runSimulation;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();