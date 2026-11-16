const $ = s => document.querySelector(s);
const fmt = d => new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

async function api(path, opt) {
  const r = await fetch("/api" + path, opt), j = await r.json().catch(() => ({}));
  if (r.status === 401) { location = "/login.html"; throw Error("Please sign in."); }
  if (!r.ok) throw Error(j.error || "Request failed.");
  return j;
}
function show(rec) {
  window.REPORT_DATE = rec.created_at;
  const out = $("#out");
  out.innerHTML = report(rec.model, rec.analysis, rec.filename);
  out.style.display = "block";
  const bar = out.querySelector("p.noprint:last-child");
  bar.insertAdjacentHTML("beforeend", ' <button class="alt" id="export">Download report (HTML)</button>');
  $("#print").onclick = () => window.print();
  $("#again").onclick = () => scrollTo(0, 0);
  $("#export").onclick = () => exportHtml(rec.filename);
  out.scrollIntoView();
}
async function exportHtml(name) {
  const css = await (await fetch("/style.css")).text(), c = $("#out").cloneNode(true);
  c.querySelectorAll(".noprint").forEach(e => e.remove());
  c.style.display = "block";
  const html = `<!DOCTYPE html><html lang="en"><meta charset="utf-8"><title>Recovery report</title><style>${css}</style><body><main>${c.outerHTML}</main></body></html>`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  a.download = name.replace(/\.[^.]+$/, "") + "-recovery-report.html";
  a.click();
}
async function analyze(xml, name) {
  $("#err").textContent = "";
  try { show(await api("/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, xml }) })); await history(); }
  catch (e) { $("#err").textContent = e.message; }
}
async function history() {
  const rows = await api("/reports");
  $("#hist").innerHTML = rows.length
    ? `<table><thead><tr><th>File</th><th>Analyzed</th><th>Tasks</th><th>High risk</th><th>Readiness</th><th></th></tr></thead><tbody>${rows.map(r =>
      `<tr><td>${esc(r.filename)}</td><td>${fmt(r.created_at)}</td><td>${r.task_count}</td><td>${r.high_risk}</td><td>${r.readiness}%</td><td><button data-open="${r.id}">Open</button><button class="alt" data-del="${r.id}">Delete</button></td></tr>`).join("")}</tbody></table>`
    : '<p class="mute empty">You have no uploads yet. Analyze a file and it will appear here.</p>';
}
$("#hist").onclick = async e => {
  const o = e.target.dataset.open, d = e.target.dataset.del;
  try {
    if (o) show(await api("/reports/" + o));
    if (d && confirm("Delete this report?")) { await api("/reports/" + d, { method: "DELETE" }); $("#out").style.display = "none"; await history(); }
  } catch (x) { $("#err").textContent = x.message; }
};
function load(f) { if (!f) return; const r = new FileReader(); r.onload = () => analyze(r.result, f.name); r.onerror = () => $("#err").textContent = "The file could not be read."; r.readAsText(f); }
$("#pick").onclick = () => $("#file").click();
$("#file").onchange = e => { load(e.target.files[0]); e.target.value = ""; };
$("#demo").onclick = () => analyze(sample(), "sample-order-process.bpmn");
const dz = $("#drop");
dz.ondragover = e => { e.preventDefault(); dz.classList.add("over"); };
dz.ondragleave = () => dz.classList.remove("over");
dz.ondrop = e => { e.preventDefault(); dz.classList.remove("over"); load(e.dataTransfer.files[0]); };
$("#logout").onclick = async () => { await fetch("/api/logout", { method: "POST" }); location = "/login.html"; };
api("/me").then(me => { $("#who").textContent = me.username; return history(); }).catch(e => $("#err").textContent = e.message);
