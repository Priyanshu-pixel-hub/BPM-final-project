const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const TASKS=["task","userTask","serviceTask","scriptTask","sendTask","receiveTask","manualTask","businessRuleTask","callActivity","subProcess"],EVENTS=["startEvent","endEvent","intermediateCatchEvent","intermediateThrowEvent","boundaryEvent"],GW=["exclusiveGateway","parallelGateway","inclusiveGateway","eventBasedGateway","complexGateway"];
const RULE=/policy|rule|eligib|limit|compliance|risk|fraud|approv|decision/i,DATA=/validat|verif|check|parse|input|form|enter|regist|fill|calculat|review/i,EFF=/pay|charge|debit|credit|refund|reserv|allocat|ship|dispatch|deliver|invoice|bill|book|transfer|submit|creat|insert|update|notify|send|email|post|publish|provision/i;
const COMP=[[/pay|charge|debit|capture/i,"Issue a refund or reverse the charge"],[/reserv|allocat|hold/i,"Release the reservation"],[/ship|dispatch|deliver/i,"Recall or cancel the shipment"],[/invoice|bill/i,"Void the invoice or issue a credit note"],[/book/i,"Cancel the booking"],[/send|notify|email/i,"Send a correction notice"],[/creat|regist|submit|insert/i,"Cancel or delete the created record"]];
const S={retry:["Retry","Technical"],rollback:["Rollback","Data"],comp:["Compensation","Business-rule"],esc:["Escalation","Human"]};
const hint=n=>(COMP.find(c=>c[0].test(n))||[0,"Define a reversing action"])[1];

function svg(m,a){
 const{N,sh,ed}=m,ks=Object.keys(sh);if(!ks.length)return"";
 const xs=ks.flatMap(k=>[sh[k][0],sh[k][0]+sh[k][2]]),ys=ks.flatMap(k=>[sh[k][1],sh[k][1]+sh[k][3]]),x0=Math.min(...xs)-20,y0=Math.min(...ys)-20,w=Math.max(...xs)-x0+20,h=Math.max(...ys)-y0+20,col={retry:"--retry",rollback:"--rollback",comp:"--comp",esc:"--esc"};
 let o=`<svg viewBox="${x0} ${y0} ${w} ${h}" role="img" aria-label="Process diagram colored by recommended recovery strategy"><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--mute)"/></marker></defs>`;
 Object.values(ed).forEach(p=>{if(p.length>1)o+=`<polyline points="${p.map(q=>q.join(",")).join(" ")}" fill="none" stroke="var(--mute)" stroke-width="1.5" marker-end="url(#ar)"/>`});
 ks.forEach(k=>{const n=N[k];if(!n)return;const[x,y,W,H]=sh[k],t=a.tasks.find(t=>t.id==k),c=t?`var(${col[t.p]})`:"var(--mute)",nm=n.name||"",ln=[];
  nm.split(" ").forEach(wd=>{const l=ln[ln.length-1];l!==undefined&&(l+" "+wd).length<=17?ln[ln.length-1]=l+" "+wd:ln.push(wd)});
  const tx=(cx,cy,dy=0)=>ln.slice(0,3).map((l,i)=>`<text x="${cx}" y="${cy+dy+i*13-(Math.min(ln.length,3)-1)*6.5}" text-anchor="middle" font-size="11.5" fill="var(--ink)">${esc(l)}</text>`).join("");
  if(TASKS.includes(n.type))o+=`<g><title>${esc(nm)}${t?" — "+S[t.p][0]:""}</title><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="8" fill="var(--panel)" stroke="${c}" stroke-width="3"/>${tx(x+W/2,y+H/2+4)}</g>`;
  else if(GW.includes(n.type))o+=`<polygon points="${x+W/2},${y} ${x+W},${y+H/2} ${x+W/2},${y+H} ${x},${y+H/2}" fill="var(--panel)" stroke="var(--mute)" stroke-width="2"/>`+(nm?`<text x="${x+W/2}" y="${y+H+14}" text-anchor="middle" font-size="11" fill="var(--mute)">${esc(nm)}</text>`:"");
  else o+=`<circle cx="${x+W/2}" cy="${y+H/2}" r="${W/2}" fill="var(--panel)" stroke="var(--mute)" stroke-width="${n.type=="endEvent"?4:2}"/>`+(nm?`<text x="${x+W/2}" y="${y+H+14}" text-anchor="middle" font-size="11" fill="var(--mute)">${esc(nm)}</text>`:"")});
 return o+"</svg>"}

function report(m,a,fname){
 const T=a.tasks,cnt={retry:0,rollback:0,comp:0,esc:0};T.forEach(t=>cnt[t.p]++);
 const hi=T.filter(t=>t.lvl=="High").length,mix=Object.keys(cnt).map(k=>cnt[k]?`<i style="flex:${cnt[k]};background:var(--${k=="comp"?"comp":k})" title="${S[k][0]}: ${cnt[k]}"></i>`:"").join("");
 const sorted=[...T].sort((x,y)=>y.risk-x.risk);
 const saga=T.filter(t=>t.eff);
 let h=`<h2 style="margin-top:8px">Recovery report: ${esc(fname)}</h2>
 <p class="mute">Generated ${new Date(window.REPORT_DATE||Date.now()).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})} using the rule-based policy: classify the exception, check the retry limit, check committed effects, then choose retry, rollback, compensation or escalation.</p>
 <div class="stats"><div class="stat"><b>${a.ready}%</b><span>Recovery readiness</span></div><div class="stat"><b>${T.length}</b><span>Tasks analyzed</span></div><div class="stat"><b>${hi}</b><span>High-risk tasks</span></div><div class="stat"><b>${saga.length}</b><span>Steps with committed effects</span></div><div class="stat"><b>${a.fi.filter(f=>f.l=="high").length}</b><span>Critical gaps</span></div></div>
 <p><b>Summary.</b> ${hi?`${hi} of ${T.length} tasks carry high recovery risk, `:"No task carries high recovery risk, "}${saga.length?`and ${saga.length} step(s) change business state, so a failure after them needs compensation rather than a plain restart.`:"and no step changes business state, so rollback to a checkpoint is enough in most cases."} Readiness measures how many error, timer and compensation paths the model already contains.</p>
 <div class="mix" aria-hidden="true">${mix}</div><div class="legend">${Object.keys(S).map(k=>`<span style="--c:var(--${k})">${S[k][0]} (${cnt[k]})</span>`).join("")}</div>`;
 const d=svg(m,a);if(d)h+=`<h2>Process map by recommended strategy</h2><div class="dia">${d}</div>`;
 h+=`<h2>Findings</h2><div class="find">${a.fi.map(f=>`<div class="f ${f.l}"><b>${esc(f.t)}.</b> ${esc(f.d)}</div>`).join("")}</div>
 <h2>Recommended strategy for each task</h2><div class="tw"><table><thead><tr><th>Task</th><th>Type</th><th>Likely exception</th><th>Primary</th><th>Fallback</th><th>Risk</th></tr></thead><tbody>${T.map(t=>`<tr><td>${esc(t.name||t.id)}</td><td>${t.type}</td><td>${t.cat}</td><td><span class="tag t-${t.p}">${S[t.p][0]}</span></td><td><span class="tag t-${t.s}">${S[t.s][0]}</span></td><td><span class="tag t-${t.lvl}">${t.lvl}</span></td></tr>`).join("")}</tbody></table></div>
 <h2>Task-by-task recovery plan</h2><p class="mute">Highest risk first. Open a task for its steps.</p>`;
 sorted.forEach((t,i)=>{const L=3;
  const st={retry:[`Retry up to ${L} times with exponential backoff (for example 2 s, 4 s, 8 s) and a timeout on each attempt.`,"Make the task idempotent or attach an idempotency key so a retry cannot repeat its effect.",`If attempt ${L} fails, move to ${S[t.s][0].toLowerCase()}.`],
   rollback:["Restore the checkpoint taken before this task and discard partial changes.","Do not retry automatically; the same input will fail again.","Return a clear error to the owner and resume at this task once the data is corrected."],
   comp:["Stop forward execution and mark the case as compensating.","Run these reversals in reverse order of execution, then record each in the recovery log.","Escalate to a person if any reversal fails."],
   esc:["Stop automatic recovery and preserve process variables and the checkpoint.","Assign the case to a named role with a deadline (timer boundary event).","Record the decision the operator takes so it can be audited."]}[t.p].slice();
  const dtl=t.p=="comp"||(t.p=="retry"&&t.s=="comp");
  h+=`<details${i<2?" open":""}><summary>${esc(t.name||t.id)} <span class="tag t-${t.p}">${S[t.p][0]}</span> <span class="tag t-${t.lvl}">${t.lvl} risk</span></summary><p>${esc(t.why)}</p><ol>${st.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
  ${dtl&&t.comps.length?`<p><b>Reversals if this task ultimately fails:</b></p><ul>${[...t.comps].reverse().map(c=>`<li>${esc(c.from)}: ${esc(c.act)}</li>`).join("")}</ul>`:""}
  <p class="mute">Checkpoint: ${t.eff||t.up.length?"take one before this task and keep it until the process completes.":"a lightweight task-level checkpoint is enough."} Model gap: ${t.kinds.length?"has boundary event ("+t.kinds.join(", ")+").":"no boundary event, so add one for this strategy."}</p></details>`});
 h+=`<h2>Process-level plan</h2><div class="two"><div><h3>Checkpoints</h3><ul>${saga.length?saga.map(t=>`<li>Before “${esc(t.name||t.id)}”, then mark its effect committed.</li>`).join(""):"<li>Checkpoint at the start of each task.</li>"}</ul></div>
 <div><h3>Compensation order if the process fails late</h3>${saga.length?`<ol>${[...saga].reverse().map(t=>`<li>${esc(t.name||t.id)}: ${esc(hint(t.name||t.id))}</li>`).join("")}</ol>`:"<p class='mute'>No committed effects detected.</p>"}</div></div>
 <h2>Modeling actions to take next</h2><ol>${[a.fi.some(f=>f.t.startsWith("Tasks with no boundary"))&&"Attach a boundary error or timer event to every service, send, receive and script task.",a.fi.some(f=>f.t.startsWith("Committed"))&&"Add compensation boundary events and handler tasks for every step that changes business state.",a.fi.some(f=>f.t.startsWith("No failure"))&&"Add an error or escalation end event for cases that cannot be recovered automatically.",a.fi.some(f=>f.t.startsWith("Exclusive"))&&"Give each exclusive gateway a default flow.",a.loops.length&&"Add a retry counter to each loop.","Log every retry, rollback, compensation and escalation so recovery can be audited.","Re-run this analysis after the model changes."].filter(Boolean).map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
 <h2>How the decision was made</h2><p>Each task is classified from its BPMN type and name: scripts and validation steps as data exceptions, rule and approval steps as business-rule exceptions, human tasks as business-rule or human-judgment cases, and service, send and receive tasks as technical exceptions. The policy applies these rules: data errors roll back; technical errors retry within a limit; when retries are exhausted or a rule fails, committed upstream effects are compensated; otherwise the case is escalated. Classification uses names and element types, so review the results against your domain knowledge.</p>
 <p class="noprint"><button id="print">Print or save as PDF</button> <button class="alt" id="again">Analyze another file</button></p>`;
 return h}

