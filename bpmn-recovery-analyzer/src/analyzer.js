"use strict";
const TASKS=["task","userTask","serviceTask","scriptTask","sendTask","receiveTask","manualTask","businessRuleTask","callActivity","subProcess"],EVENTS=["startEvent","endEvent","intermediateCatchEvent","intermediateThrowEvent","boundaryEvent"],GW=["exclusiveGateway","parallelGateway","inclusiveGateway","eventBasedGateway","complexGateway"];
const RULE=/policy|rule|eligib|limit|compliance|risk|fraud|approv|decision/i,DATA=/validat|verif|check|parse|input|form|enter|regist|fill|calculat|review/i,EFF=/pay|charge|debit|credit|refund|reserv|allocat|ship|dispatch|deliver|invoice|bill|book|transfer|submit|creat|insert|update|notify|send|email|post|publish|provision/i;
const COMP=[[/pay|charge|debit|capture/i,"Issue a refund or reverse the charge"],[/reserv|allocat|hold/i,"Release the reservation"],[/ship|dispatch|deliver/i,"Recall or cancel the shipment"],[/invoice|bill/i,"Void the invoice or issue a credit note"],[/book/i,"Cancel the booking"],[/send|notify|email/i,"Send a correction notice"],[/creat|regist|submit|insert/i,"Cancel or delete the created record"]];
const S={retry:["Retry","Technical"],rollback:["Rollback","Data"],comp:["Compensation","Business-rule"],esc:["Escalation","Human"]};
const hint=n=>(COMP.find(c=>c[0].test(n))||[0,"Define a reversing action"])[1];


function parseXml(xml){
 const re=/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
 const dec=s=>s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");
 const root={children:[]},st=[root];let m;
 while((m=re.exec(xml))){
  if(!m[2])continue;
  if(m[1]){if(st.length<2||st.pop().tag!==m[2])throw Error("mismatched tag");continue}
  const attrs={};m[3].replace(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,(_,k,a,b)=>{attrs[k]=dec(a??b)});
  const el={tag:m[2],localName:m[2].split(":").pop(),attrs,children:[],getAttribute(k){return k in attrs?attrs[k]:null}};
  st[st.length-1].children.push(el);if(!m[4])st.push(el)}
 if(st.length!==1||!root.children.length)throw Error("unbalanced XML");
 return root.children[0]}

function parse(xml){
 let root;try{root=parseXml(String(xml))}catch(e){throw Error("This file is not valid XML. Export it again from your BPMN modeler.")}
 const all=[];(function w(e){all.push(e);e.children.forEach(w)})(root);
 const N={},F=[],sh={},ed={};
 all.forEach(e=>{const l=e.localName,id=e.getAttribute("id");
  if(id&&(TASKS.includes(l)||EVENTS.includes(l)||GW.includes(l)))N[id]={id,type:l,name:e.getAttribute("name")||"",in:[],out:[],kinds:[],host:e.getAttribute("attachedToRef"),handler:e.getAttribute("isForCompensation")=="true",
   defs:e.children.filter(c=>/EventDefinition$/.test(c.localName)).map(c=>c.localName.replace("EventDefinition","")),def:e.getAttribute("default")};
  else if(l=="sequenceFlow")F.push({id,s:e.getAttribute("sourceRef"),t:e.getAttribute("targetRef"),name:e.getAttribute("name")||"",cond:e.children.some(c=>c.localName=="conditionExpression")});
  else if(l=="BPMNShape"){const b=e.children.find(c=>c.localName=="Bounds");if(b)sh[e.getAttribute("bpmnElement")]=["x","y","width","height"].map(k=>+b.getAttribute(k))}
  else if(l=="BPMNEdge")ed[e.getAttribute("bpmnElement")]=e.children.filter(c=>c.localName=="waypoint").map(w=>[+w.getAttribute("x"),+w.getAttribute("y")])});
 const ids=Object.keys(N);if(!ids.length)throw Error("No BPMN process elements were found. Check that the file is BPMN 2.0 XML.");
 F.forEach(f=>{if(N[f.s]&&N[f.t]){N[f.s].out.push(f);N[f.t].in.push(f)}});
 ids.forEach(i=>{const n=N[i];if(n.host&&N[n.host])N[n.host].kinds.push(...(n.defs.length?n.defs:["other"]))});
 const lanes=all.filter(e=>e.localName=="lane").length,parts=all.filter(e=>e.localName=="participant").length;
 return{N,F,sh,ed,lanes,parts,ids}}

function analyze(m){
 const{N,F,ids}=m,A=n=>{const seen=new Set(),q=[n.id];while(q.length){const c=q.pop();(N[c].in.map(f=>f.s)).forEach(s=>{if(!seen.has(s)){seen.add(s);q.push(s)}})}return[...seen].map(i=>N[i])};
 const tasks=ids.map(i=>N[i]).filter(n=>TASKS.includes(n.type)&&!n.handler);
 tasks.forEach(n=>{const nm=n.name||n.id;
  n.eff=!n.host&&(["serviceTask","sendTask","callActivity"].includes(n.type)||EFF.test(nm))&&!(DATA.test(nm)&&!EFF.test(nm))&&!["userTask","manualTask","businessRuleTask","scriptTask"].includes(n.type)||(EFF.test(nm)&&n.type!="userTask"&&n.type!="businessRuleTask"&&n.type!="scriptTask");
  n.up=[]});
 tasks.forEach(n=>{n.up=A(n).filter(a=>a.eff&&a.id!=n.id&&TASKS.includes(a.type));
  const nm=n.name||n.id;
  n.cat=n.type=="businessRuleTask"||RULE.test(nm)?"Business-rule":n.type=="scriptTask"||DATA.test(nm)?"Data":["userTask","manualTask"].includes(n.type)?"Business-rule":"Technical";
  const hasUp=n.up.length>0,eff=n.eff;
  if(n.cat=="Data"){n.p="rollback";n.s="esc";n.why="Invalid or missing input is deterministic, so retrying cannot succeed. Restore the last checkpoint and ask for corrected data."}
  else if(n.cat=="Technical"){n.p="retry";n.s=hasUp?"comp":"esc";n.why="Service, network and timeout failures are usually transient. Retry with a limit, then "+(hasUp?"compensate the committed upstream effects before escalating.":"escalate because nothing upstream needs reversing.")}
  else{n.p=hasUp?"comp":"esc";n.s="esc";n.why=hasUp?"A business-rule or human decision failed after "+n.up.length+" committed effect(s). Reverse them, then hand the case to a person.":"A business-rule or human decision failed and nothing has been committed yet, so route it to a person."}
  const risk=({task:1,scriptTask:2,userTask:2,manualTask:2,businessRuleTask:2,receiveTask:3}[n.type]||3)+(eff?2:0)+Math.min(3,n.up.length)+(n.kinds.length?0:2);
  n.risk=risk;n.lvl=risk>=8?"High":risk>=5?"Medium":"Low";
  n.comps=n.up.map(u=>({from:u.name||u.id,act:hint(u.name||u.id)}))});
 // loops
 const inLoop=n=>{const seen=new Set(),q=n.out.map(f=>f.t);while(q.length){const c=q.pop();if(c==n.id)return true;if(seen.has(c))continue;seen.add(c);N[c]&&q.push(...N[c].out.map(f=>f.t))}return false};
 const starts=ids.filter(i=>N[i].type=="startEvent"),ends=ids.filter(i=>N[i].type=="endEvent");
 const reach=new Set(),q=[...starts];while(q.length){const c=q.pop();if(reach.has(c))continue;reach.add(c);N[c].out.forEach(f=>q.push(f.t));ids.filter(i=>N[i].host==c).forEach(i=>q.push(i))}
 const fi=[],add=(l,t,d)=>fi.push({l,t,d});
 if(!starts.length)add("high","No start event","The process has no start event, so a recovery run has no defined entry point.");
 if(starts.length>1)add("med","Multiple start events",starts.length+" start events found. Make sure each has its own checkpoint and recovery path.");
 if(!ends.some(i=>N[i].defs.includes("error")||N[i].defs.includes("escalation")||N[i].defs.includes("terminate")))add("med","No failure end state","No error, escalation or terminate end event exists. Add one so escalated cases finish in a recorded state rather than disappearing.");
 const unh=tasks.filter(n=>["serviceTask","sendTask","receiveTask","callActivity","scriptTask"].includes(n.type)&&!n.kinds.some(k=>["error","timer","escalation","message"].includes(k)));
 if(unh.length)add("high","Tasks with no boundary error or timer event",unh.map(n=>n.name||n.id).join(", ")+". Failures here have no modeled path, so the engine would stop with an unhandled exception.");
 const nc=tasks.filter(n=>n.eff&&!n.kinds.includes("compensate"));
 if(nc.length)add("high","Committed effects without a compensation handler",nc.map(n=>n.name||n.id).join(", ")+". If a later step fails these effects stay in place. Add a compensation boundary event and handler task to each.");
 const gw=ids.map(i=>N[i]).filter(n=>n.type=="exclusiveGateway"&&n.out.length>1&&!n.def&&!n.out.every(f=>f.cond));
 if(gw.length)add("med","Exclusive gateways without a default flow",gw.map(n=>n.name||n.id).join(", ")+". If no condition matches the process stalls. Add a default flow to an error or escalation path.");
 const dead=ids.map(i=>N[i]).filter(n=>n.type!="endEvent"&&!n.out.length&&!n.handler&&!n.host);
 if(dead.length)add("med","Dead ends",dead.map(n=>n.name||n.id).join(", ")+" have no outgoing flow and are not end events.");
 const un=ids.filter(i=>!reach.has(i)&&!N[i].handler&&starts.length).map(i=>N[i].name||i);
 if(un.length)add("low","Unreachable elements",un.join(", "));
 const lp=tasks.filter(inLoop);if(lp.length)add("med","Loops detected",lp.map(n=>n.name||n.id).join(", ")+" sit inside a cycle. Put a retry counter on the loop so repeated failure ends in escalation.");
 if(!m.lanes&&m.parts<2)add("low","No human role modeled","No lanes or participants were found. Define who receives escalated cases, such as an operations or support role.");
 const eC=tasks.filter(n=>n.eff).length;if(eC>=3)add("low","Long chain of committed effects","Three or more steps change business state in sequence. Treat the chain as a saga and run compensations in reverse order.");
 if(!fi.length)add("ok","No structural gaps found","Every risky task has a modeled recovery path.");
 // readiness: weighted score out of 100 (structure 30, task handling 35, compensation 20, control flow 15)
 const has=t=>fi.some(f=>f.t==t),W=(ok,w)=>ok?w:0;
 const dyn=["serviceTask","sendTask","receiveTask","callActivity","scriptTask"];
 // structure: entry point, end point, failure end state, no dead ends, no unreachable elements
 let sc=W(starts.length>0,8)+W(ends.length>0,7)+W(!has("No failure end state"),5)+W(!has("Dead ends"),5)+W(!has("Unreachable elements"),5);
 // task handling: risky tasks earn partial credit for being modeled, full credit when a boundary handler exists
 const risky=tasks.filter(n=>dyn.includes(n.type)||n.eff);
 const hCredit=risky.length?risky.reduce((t,n)=>t+(n.kinds.length?1:0.3),0)/risky.length:1;
 sc+=35*hCredit;
 // compensation: effects with a compensate handler (partial credit when the effect has an error/timer handler)
 const effs=tasks.filter(n=>n.eff);
 const cCredit=effs.length?effs.reduce((t,n)=>t+(n.kinds.includes("compensate")?1:n.kinds.length?0.35:0.1),0)/effs.length:1;
 sc+=20*cCredit;
 // control flow: gateway defaults, loops, human role
 sc+=W(!has("Exclusive gateways without a default flow"),6)+W(!has("Loops detected"),5)+W(!has("No human role modeled"),4);
 const ready=Math.max(5,Math.min(100,Math.round(sc)));
 tasks.forEach(n=>{n.up=n.up.map(u=>u.id)});return{tasks,fi,ready,starts,ends,loops:lp}}


function analyzeXml(xml){const m=parse(xml),a=analyze(m),N={};m.ids.forEach(i=>{N[i]={type:m.N[i].type,name:m.N[i].name}});return{model:{N,sh:m.sh,ed:m.ed},analysis:a}}
module.exports={analyzeXml};
