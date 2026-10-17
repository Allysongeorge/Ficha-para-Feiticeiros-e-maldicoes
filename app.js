// Atalhos para encontrar elementos na página e escapar texto inserido no HTML.
const $ = (s) => document.querySelector(s),
  esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
// Atributos, perícias e abas exibidos na ficha.
const attrs = [
  "Força",
  "Destreza",
  "Constituição",
  "Inteligência",
  "Sabedoria",
  "Presença",
];
const skills = [
  ["Atletismo", 0],
  ["Acrobacia", 1],
  ["Furtividade", 1],
  ["Prestidigitação", 1],
  ["Feitiçaria", 3],
  ["História", 3],
  ["Investigação", 3],
  ["Ofício 1", 3],
  ["Ofício 2", 3],
  ["Ofício 3", 3],
  ["Tecnologia", 3],
  ["Teologia", 3],
  ["Direção", 4],
  ["Intuição", 4],
  ["Medicina", 4],
  ["Ocultismo", 4],
  ["Percepção", 4],
  ["Sobrevivência", 4],
  ["Enganação", 5],
  ["Intimidação", 5],
  ["Performance", 5],
  ["Persuasão", 5],
];
const tabs = [
  ["◈", "Visão geral", "Seu personagem, pronto para a próxima sessão."],
  ["◎", "Perícias e combate", "Treinamentos, ataques e recursos de combate."],
  ["✧", "Perfil amaldiçoado", "A forma que sua energia assume."],
  ["◇", "Invocações", "Seus aliados além do mundo comum."],
  ["▤", "Registro e inventário", "Cada detalhe faz parte da sua história."],
];
// Cria um personagem com os valores iniciais.
function fresh() {
  return {
    id: crypto.randomUUID(),
    name: "Novo feiticeiro",
    player: "",
    origin: "",
    spec: "",
    grade: "4º grau",
    campaign: "",
    level: 1,
    training: 2,
    xp: 0,
    photo: "",
    attrs: [10, 10, 10, 10, 10, 10],
    hp: 10,
    hpMax: 10,
    hpTemp: 0,
    energy: 0,
    energyMax: 0,
    energyTemp: 0,
    soul: 10,
    soulMax: 10,
    defense: 10,
    speed: 9,
    initiativeExtra: 0,
    attentionExtra: 0,
    skills: {},
    technique: "",
    techniqueDesc: "",
    domain: "",
    domainType: "",
    domainDesc: "",
    maxTechnique: "",
    maxDesc: "",
    mainAttr: "Inteligência",
    cursedCD: 12,
    specCD: 12,
    aptitudes: [0, 0, 0, 0, 0],
    spells: [],
    summons: [],
    items: [],
    abilities: [],
    attacks: [],
    notes: "",
    personality: "",
    ideals: "",
    bonds: "",
    complications: "",
    appearance: "",
    innateDomain: "",
    capacity: 0,
    deathSuccess: 0,
    deathFail: 0,
    resistances: "",
    lifeDice: "",
    resistanceTests: "",
  };
}
// Recupera as fichas deste navegador. A chave precisa ser mantida para ler fichas existentes.
// db guarda os personagens, c representa o personagem ativo e tab indica a aba aberta.
let db;
try {
  db = JSON.parse(localStorage.getItem("arquivo-amaldicoado-v1"));
} catch {}
if (!db || !Array.isArray(db.characters) || !db.characters.length) {
  const c = fresh();
  db = { characters: [c], active: c.id };
}
let c = db.characters.find((x) => x.id === db.active) || db.characters[0],
  tab = 0;
// Salva os personagens no localStorage e avisa quando o armazenamento falha.
function save() {
  try {
    localStorage.setItem("arquivo-amaldicoado-v1", JSON.stringify(db));
    $("#saved").textContent = "Salvo neste navegador";
  } catch {
    $("#saved").textContent = "Falha ao salvar. Exporte sua ficha.";
    toast("Armazenamento cheio ou indisponível. Exporte sua ficha.");
  }
}
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(
    () => ($("#toast").style.display = "none"),
    3500,
  );
}
// Cálculos auxiliares: modificador de atributo, sinal do bônus e limites numéricos.
function mod(n) {
  return Math.floor((Number(n) - 10) / 2);
}
function signed(n) {
  return n >= 0 ? "+" + n : n;
}
function num(v, min = 0, max = 99999) {
  let n = Number(v);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}
// Componentes reutilizáveis da interface.
// As crases delimitam modelos de HTML, e ${...} insere valores nesses modelos.
function field(label, key, type = "text", wide = false) {
  return `<label class="field ${wide ? "wide" : ""}">${label}${type === "textarea" ? `<textarea data-key="${key}">${esc(c[key])}</textarea>` : `<input type="${type}" data-key="${key}" value="${esc(c[key])}" ${type === "number" ? 'min="0"' : ""}>`}</label>`;
}
function card(title, body, meta = "") {
  return `<section class="card"><div class="cardtitle">${title}<small>${meta}</small></div>${body}</section>`;
}
// Desenha o gráfico de atributos em SVG, sem biblioteca externa.
function radar() {
  const p = (i, r) => [
    150 + Math.sin((i * Math.PI) / 3) * r,
    133 - Math.cos((i * Math.PI) / 3) * r,
  ];
  return `<svg class="radar" viewBox="0 0 300 270" role="img" aria-label="Gráfico dos seis atributos, escala de zero a trinta">${[30, 60, 90].map((r) => `<polygon points="${attrs.map((_, i) => p(i, r).join(",")).join(" ")}" fill="none" stroke="#3b3b40"/>`).join("")}${attrs.map((a, i) => `<line x1="150" y1="133" x2="${p(i, 90)[0]}" y2="${p(i, 90)[1]}" stroke="#303036"/><text x="${p(i, 115)[0]}" y="${p(i, 115)[1]}" text-anchor="middle">${a.toUpperCase()}</text>`).join("")}<polygon points="${c.attrs.map((v, i) => p(i, (90 * v) / 30).join(",")).join(" ")}" fill="#eb51492c" stroke="#eb5149" stroke-width="2"/>${c.attrs.map((v, i) => `<circle cx="${p(i, (90 * v) / 30)[0]}" cy="${p(i, (90 * v) / 30)[1]}" r="3" fill="#eb5149"/>`).join("")}</svg>`;
}
function resource(label, key, color) {
  let max = c[key + "Max"];
  return `<section class="card resource" style="--color:${color}"><div class="overline">${label}</div><h3 style="color:${color}">${c[key]} <small>/ ${max}</small></h3><div class="bar"><i style="width:${max ? Math.min(100, (c[key] / max) * 100) : 0}%"></i></div><div class="controls"><button data-adjust="${key}" data-delta="-1" aria-label="Diminuir ${label}">−</button><input aria-label="${label} atual" type="number" data-key="${key}" min="0" max="${max}" value="${c[key]}"><button data-adjust="${key}" data-delta="1" aria-label="Aumentar ${label}">+</button><small>MÁX.</small><input aria-label="${label} máximo" type="number" min="0" data-key="${key}Max" value="${max}"></div></section>`;
}
// Monta a aba Visão geral, com retrato, recursos e atributos.
function general() {
  return `<div class="dashboard"><section class="card profile"><div class="portrait">${c.photo ? `<img src="${esc(c.photo)}" alt="Retrato de ${esc(c.name)}">` : `<svg viewBox="0 0 200 220" aria-hidden="true"><circle cx="100" cy="84" r="37" fill="#141417"/><path d="M28 220Q28 136 100 130Q172 136 172 220" fill="#141417"/><path d="M62 85L58 47 79 51 90 32 102 46 127 36 140 65 136 87" fill="#141417"/></svg>`}<label>＋ Adicionar foto<input id="photo" type="file" accept="image/*" hidden></label></div><div class="profilebody"><span class="tag">${esc(c.grade)}</span><h3>${esc(c.name)}</h3><p>${esc(c.spec || "Especialização a definir")}</p><div class="details">${[
    ["Origem", c.origin || "A definir"],
    ["Nível", String(c.level).padStart(2, "0")],
    ["Jogador", c.player || "A definir"],
    ["Campanha", c.campaign || "A definir"],
  ]
    .map(([a, b]) => `<div><span>${a}</span><b>${esc(b)}</b></div>`)
    .join(
      "",
    )}</div></div></section><div class="right"><div class="resources">${resource("PONTOS DE VIDA", "hp", "#db8276")}${resource(c.spec === "Restringido" ? "ESTAMINA" : "ENERGIA AMALDIÇOADA", "energy", "#b1a4d7")}${resource("INTEGRIDADE DA ALMA", "soul", "#b8c3a2")}</div><div class="statsrow"><div class="stat"><span class="overline">DEFESA</span><input type="number" data-key="defense" value="${c.defense}" aria-label="Defesa"></div><div class="stat"><span class="overline">INICIATIVA</span><b>${signed(mod(c.attrs[1]) + Number(c.initiativeExtra))}</b></div><div class="stat"><span class="overline">ATENÇÃO</span><b>${10 + skillTotal(16) + Number(c.attentionExtra)}</b></div><div class="stat"><span class="overline">DESLOC. / M</span><input type="number" data-key="speed" value="${c.speed}" aria-label="Deslocamento em metros"></div></div>${card("Atributos", `<div class="attributes"><div class="attrlist">${attrs.map((a, i) => `<div class="attr"><label for="attr${i}">${a}</label><input id="attr${i}" type="number" min="0" max="30" data-attr="${i}" value="${c.attrs[i]}"><span class="modifier">${signed(mod(c.attrs[i]))}</span></div>`).join("")}</div>${radar()}</div><p class="hint">Modificadores automáticos • Gráfico na escala 0 a 30 • Limite padrão do sistema: 20, salvo exceções.</p>`, "POTENCIAL DO PERSONAGEM")}<div class="rollbox"><div><b>O destino está nos dados.</b><p>Role um d20 ou clique no bônus de uma perícia.</p></div><span id="rollResult">${lastRoll || ""}</span><button id="d20">Rolar d20 ↗</button></div></div></div><div style="margin-top:20px">${card("Anotações da sessão", field("Registre pistas, objetivos e acontecimentos.", "notes", "textarea"))}</div>`;
}
// Calcula a perícia usando atributo, nível, treinamento e bônus adicionais.
function skillTotal(i) {
  let s = c.skills[i] || { bonus: 0, rank: 0 };
  return (
    mod(c.attrs[skills[i][1]]) +
    Number(s.bonus) +
    Math.floor(Number(c.level) / 2) +
    (Number(s.rank) === 2
      ? Math.floor(Number(c.training) * 1.5)
      : Number(s.rank) * Number(c.training))
  );
}
function list(key, title, labels) {
  return card(
    title,
    `<button data-add="${key}" class="primary">＋ Adicionar</button>${c[key].length ? c[key].map((x, i) => `<div class="listrow"><div><b>${esc(x.name)}</b><p>${esc(x.description)}</p></div><button data-editrow="${key}" data-index="${i}">Editar</button><button data-remove="${key}" data-index="${i}" aria-label="Remover ${esc(x.name)}">✕</button></div>`).join("") : `<div class="empty">Nenhum registro ainda. Adicione o primeiro.</div>`}`,
  );
}
// Monta a aba Perícias e combate.
function combat() {
  return `<div class="grid2">${card("Perícias", `<div class="skill"><small>PERÍCIA</small><small>TREINO</small><small>OUTROS</small><small>ROLAR</small></div>${skills.map(([s, a], i) => `<div class="skill"><span>${s} <small>${attrs[a].slice(0, 3).toUpperCase()}</small></span><select data-skill="${i}" aria-label="Treinamento em ${s}">${["Não", "Treinado", "Mestre"].map((t, j) => `<option value="${j}" ${(c.skills[i]?.rank || 0) === j ? "selected" : ""}>${t}</option>`).join("")}</select><input type="number" data-bonus="${i}" value="${c.skills[i]?.bonus || 0}" aria-label="Outros bônus de ${s}"><button data-roll="${i}">${signed(skillTotal(i))}</button></div>`).join("")}<p class="hint">Total = modificador + metade do nível (arredondada para baixo) + treinamento (1,5× para mestre) + outros bônus.</p>`)}<div class="stack">${card("Recursos de combate", `<div class="formgrid">${field("Bônus de treinamento", "training", "number")}${field("Bônus adicional de iniciativa", "initiativeExtra", "number")}${field("Bônus adicional de atenção", "attentionExtra", "number")}${field("CD de especialização", "specCD", "number")}${field("Vida temporária", "hpTemp", "number")}${field("Energia / estamina temporária", "energyTemp", "number")}${field("Sucessos nos testes de morte (0 a 3)", "deathSuccess", "number")}${field("Falhas nos testes de morte (0 a 3)", "deathFail", "number")}${field("Dados de vida, disponíveis e gastos", "lifeDice", "textarea", true)}${field("Testes de resistência e seus bônus", "resistanceTests", "textarea", true)}${field("Redução de dano e resistências", "resistances", "textarea", true)}</div>`)}${list("attacks", "Ataques")}${list("abilities", "Habilidades e talentos")}</div></div>`;
}
// Monta a aba Perfil amaldiçoado.
function cursed() {
  return `<div class="grid2"><div class="stack">${card("Técnica amaldiçoada", `<div class="formgrid">${field("Nome da técnica", "technique", "text", true)}${field("Descrição e funcionamento", "techniqueDesc", "textarea", true)}<label class="field">Atributo principal<select data-key="mainAttr">${attrs.map((a) => `<option ${c.mainAttr === a ? "selected" : ""}>${a}</option>`).join("")}</select></label>${field("CD amaldiçoada", "cursedCD", "number")}</div>`)}${card("Níveis de aptidão", `<div class="formgrid">${["Aura", "Controle e leitura", "Barreira", "Domínio", "Energia reversa"].map((a, i) => `<label class="field">${a}<input type="number" min="0" data-apt="${i}" value="${c.aptitudes[i]}"></label>`).join("")}</div>`)}${list("spells", "Feitiços conhecidos")}</div><div class="stack">${card("Expansão de domínio", `<div class="formgrid">${field("Nome da expansão", "domain", "text", true)}${field("Tipo de expansão", "domainType", "text", true)}${field("Descrição, custo e efeitos", "domainDesc", "textarea", true)}</div>`)}${card("Técnica máxima", field("Nome", "maxTechnique") + field("Descrição e custo", "maxDesc", "textarea"))}<p class="hint">CDs e recursos são editáveis para considerar bônus e exceções do personagem. Nenhum feitiço é concedido automaticamente.</p></div></div>`;
}
// Monta a aba Registro e inventário.
function record() {
  return `<div class="grid2"><div class="stack">${card("Aparência e personalidade", field("Idade, altura, peso, gênero, cabelos, olhos, roupas e marcas", "appearance", "textarea") + field("Traços de personalidade", "personality", "textarea") + field("Ideais", "ideals", "textarea"))}${card("Vínculos e história", field("Ligações", "bonds", "textarea") + field("Complicações", "complications", "textarea") + field("Domínio inato", "innateDomain", "textarea"))}</div><div class="stack">${list("items", "Inventário")}${card("Capacidade de carga", field("Limite de espaços", "capacity", "number") + '<p class="hint">Registre quantidade, peso, preço e espaços de cada item na descrição. Controle manual.</p>')}</div></div>`;
}
let lastRoll = "";
// Atualiza a navegação e mostra o conteúdo da aba selecionada.
function render() {
  $("#characters").innerHTML = db.characters
    .map(
      (x) =>
        `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.name)}</option>`,
    )
    .join("");
  $("#nav").innerHTML = tabs
    .map(
      (t, i) =>
        `<button class="${i === tab ? "active" : ""}" data-tab="${i}"><span>${t[0]}</span>${t[1]}</button>`,
    )
    .join("");
  $("#pageTitle").textContent = tabs[tab][1];
  $("#pageSub").textContent = tabs[tab][2];
  $("#breadcrumb").textContent = tabs[tab][1].toUpperCase();
  $("#code").textContent =
    "Nº " + String(db.characters.indexOf(c) + 1).padStart(3, "0");
  $("#view").innerHTML = [
    general,
    combat,
    cursed,
    () =>
      list("summons", "Invocações") +
      '<p class="hint">Registre grau, PV atuais e máximos, defesa, deslocamento, atributos, perícias, ações e características na descrição de cada invocação.</p>',
    record,
  ][tab]();
}
// Sorteia o d20 com a API crypto e aplica o bônus informado.
function roll(bonus = 0, label = "d20") {
  const raw = crypto.getRandomValues(new Uint32Array(1))[0];
  if (raw >= 4294967280) return roll(bonus, label);
  const d = (raw % 20) + 1;
  lastRoll = d + bonus;
  toast(`${label}: ${d} ${signed(bonus)} = ${lastRoll}`);
  if ($("#rollResult")) $("#rollResult").textContent = lastRoll;
}
// Navegação entre abas e gerenciamento dos personagens.
$("#nav").onclick = (e) => {
  const b = e.target.closest("[data-tab]");
  if (b) {
    tab = Number(b.dataset.tab);
    render();
  }
};
$("#characters").onchange = (e) => {
  c = db.characters.find((x) => x.id === e.target.value);
  db.active = c.id;
  save();
  render();
};
$("#new").onclick = () => {
  c = fresh();
  db.characters.push(c);
  db.active = c.id;
  save();
  render();
  $("#edit").click();
};
$("#edit").onclick = () => {
  $("#identity").innerHTML =
    [
      ["Nome", "name"],
      ["Jogador", "player"],
      ["Origem", "origin"],
      ["Campanha", "campaign"],
      ["Grau", "grade"],
      ["Nível", "level", "number"],
      ["Experiência", "xp", "number"],
    ]
      .map((x) => field(...x))
      .join("") +
    `<label class="field">Especialização<select data-key="spec">${["", "Lutador", "Especialista em Combate", "Especialista em Técnica", "Controlador", "Suporte", "Restringido"].map((s) => `<option ${c.spec === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>`;
  $("#editor").showModal();
};
// Trata alterações nos campos, limita valores e prepara a foto para salvar.
document.addEventListener("change", async (e) => {
  let t = e.target;
  if (t.dataset.key) {
    let k = t.dataset.key,
      v =
        t.type === "number"
          ? num(t.value, k.includes("Extra") ? -999 : 0)
          : t.value;
    if (k === "level") v = num(v, 1, 20);
    if (k === "deathSuccess" || k === "deathFail") v = num(v, 0, 3);
    c[k] = v;
    if (["hp", "energy", "soul"].includes(k)) c[k] = num(v, 0, c[k + "Max"]);
    if (["hpMax", "energyMax", "soulMax"].includes(k)) {
      let n = k.slice(0, -3);
      c[n] = Math.min(c[n], v);
    }
    save();
    if (!$("#editor").open) render();
  }
  if (t.dataset.attr !== undefined) {
    c.attrs[t.dataset.attr] = num(t.value, 0, 30);
    save();
    render();
  }
  if (t.dataset.apt !== undefined) {
    c.aptitudes[t.dataset.apt] = num(t.value);
    save();
  }
  if (t.dataset.skill !== undefined || t.dataset.bonus !== undefined) {
    let i = t.dataset.skill ?? t.dataset.bonus;
    c.skills[i] ??= { rank: 0, bonus: 0 };
    if (t.dataset.skill !== undefined) c.skills[i].rank = Number(t.value);
    else c.skills[i].bonus = num(t.value, -999, 999);
    save();
    render();
  }
  if (t.id === "photo" && t.files[0]) {
    let f = t.files[0];
    if (!f.type.startsWith("image/")) return toast("Selecione uma imagem.");
    try {
      const bitmap = await createImageBitmap(f);
      let canvas = document.createElement("canvas"),
        scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
      canvas.width = bitmap.width * scale;
      canvas.height = bitmap.height * scale;
      canvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      c.photo = canvas.toDataURL("image/jpeg", 0.82);
      save();
      render();
    } catch {
      toast("Não foi possível abrir essa imagem. Tente PNG ou JPG.");
    }
  }
});
$("#editor").addEventListener("close", () => {
  save();
  render();
});
// Textos iniciais dos registros de invocações, feitiços, itens e habilidades.
const templates = {
  summons:
    "Grau:\nPV atuais / máximos:\nDefesa:\nDeslocamento:\nForça / Destreza / Constituição / Inteligência / Sabedoria / Presença:\nPerícias treinadas:\nAções e características:",
  spells: "Nível (0 a 5):\nCusto:\nAlcance:\nDuração:\nEfeito:",
  items: "Quantidade:\nPeso:\nPreço:\nEspaços:\nDescrição:",
  attacks: "Bônus de ataque:\nDano:\nCrítico:\nTipo:\nAlcance:\nPropriedades:",
  abilities: "Usos atuais / máximos:\nCusto:\nEfeito:",
};
// Centraliza os cliques dos botões criados dinamicamente na ficha.
document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.adjust) {
    let k = t.dataset.adjust;
    c[k] = num(c[k] + Number(t.dataset.delta), 0, c[k + "Max"]);
    save();
    render();
  }
  if (t.id === "d20") roll();
  if (t.dataset.roll !== undefined) {
    let i = Number(t.dataset.roll);
    roll(skillTotal(i), skills[i][0]);
  }
  if (t.dataset.add || t.dataset.editrow) {
    const key = t.dataset.add || t.dataset.editrow,
      index = t.dataset.index;
    openRow(key, index);
  }
  if (t.dataset.remove) {
    if (confirm("Remover este registro?")) {
      c[t.dataset.remove].splice(Number(t.dataset.index), 1);
      save();
      render();
    }
  }
});
// Abre o formulário para adicionar ou editar um registro.
function openRow(key, index) {
  let old =
    index === undefined
      ? { name: "", description: templates[key] }
      : c[key][index];
  const d = document.createElement("dialog");
  d.innerHTML = `<form method="dialog"><div class="dialog-head"><h2>${index === undefined ? "Adicionar" : "Editar"} registro</h2><button value="cancel" aria-label="Fechar">✕</button></div><label class="field">Nome<input name="title" required maxlength="150" value="${esc(old.name)}"></label><label class="field" style="margin-top:18px">Informações<textarea name="description" style="min-height:240px">${esc(old.description)}</textarea></label><button class="primary" value="save">Salvar registro</button></form>`;
  document.body.append(d);
  d.addEventListener("close", () => {
    if (d.returnValue === "save") {
      let r = {
        name: d.querySelector("[name=title]").value,
        description: d.querySelector("textarea").value,
      };
      if (index === undefined) c[key].push(r);
      else c[key][index] = r;
      save();
      render();
    }
    d.remove();
  });
  d.showModal();
}
// Exporta o personagem ativo como JSON para permitir backup e transferência.
$("#export").onclick = () => {
  let u = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          { format: "arquivo-amaldicoado", version: 1, character: c },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  let a = document.createElement("a");
  a.href = u;
  a.download = c.name.replace(/[^a-z0-9]/gi, "_") + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
$("#import").onclick = () => $("#json").click();
// Valida o JSON importado e cria uma nova ficha a partir dele.
$("#json").onchange = async (e) => {
  try {
    let file = e.target.files[0];
    if (!file) return;
    if (file.size > 6000000) throw Error();
    let data = JSON.parse(await file.text()),
      v = data.character;
    if (
      data.format !== "arquivo-amaldicoado" ||
      !v ||
      typeof v.name !== "string" ||
      !Array.isArray(v.attrs) ||
      v.attrs.length !== 6
    )
      throw Error();
    let base = fresh();
    for (let k of Object.keys(base)) {
      if (k === "id") continue;
      if (typeof base[k] === "number")
        base[k] = num(v[k] ?? base[k], k.includes("Extra") ? -999 : 0);
      else if (typeof base[k] === "string")
        base[k] = typeof v[k] === "string" ? v[k] : base[k];
    }
    base.attrs = v.attrs.map((a) => num(a, 0, 30));
    base.aptitudes = Array.from({ length: 5 }, (_, i) =>
      num(v.aptitudes?.[i] || 0),
    );
    base.skills = {};
    for (let i = 0; i < skills.length; i++)
      if (v.skills?.[i])
        base.skills[i] = {
          rank: num(v.skills[i].rank, 0, 2),
          bonus: num(v.skills[i].bonus, -999, 999),
        };
    for (let k of ["spells", "summons", "items", "abilities", "attacks"])
      base[k] = Array.isArray(v[k])
        ? v[k]
            .slice(0, 500)
            .filter(
              (x) =>
                x &&
                typeof x.name === "string" &&
                typeof x.description === "string",
            )
            .map((x) => ({ name: x.name, description: x.description }))
        : [];
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(base.photo))
      base.photo = "";
    for (let k of ["hp", "energy", "soul"])
      base[k] = Math.min(base[k], base[k + "Max"]);
    c = base;
    db.characters.push(c);
    db.active = c.id;
    save();
    render();
    toast("Ficha importada como novo personagem.");
  } catch {
    toast("Arquivo inválido. Importe um JSON exportado por este site.");
  }
  e.target.value = "";
};
// Impressão e exclusão de personagens.
$("#print").onclick = () => window.print();
$("#delete").onclick = () => {
  if (
    confirm(
      "Excluir este personagem deste navegador? Exporte uma cópia antes de continuar.",
    )
  ) {
    db.characters = db.characters.filter((x) => x.id !== c.id);
    if (!db.characters.length) db.characters.push(fresh());
    c = db.characters[0];
    db.active = c.id;
    save();
    render();
  }
};
render();
save();
