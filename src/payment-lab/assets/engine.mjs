export const BUILTIN = Object.freeze({
  id:'swift-2025-base-v1', name:'SWIFT SR2025', version:'1.0.0', effectiveDate:'2025-11-22',
  description:'Official ISO base schemas with selected local checks. Complete CBPR+ usage rules are not installed.',
  profiles:[
    {key:'pacs008',label:'pacs.008',name:'Customer credit transfer',messageId:'pacs.008.001.08',businessService:'swift.cbprplus.03'},
    {key:'pacs009',label:'pacs.009',name:'Financial institution transfer',messageId:'pacs.009.001.08',businessService:'swift.cbprplus.03'},
    {key:'pacs009cov',label:'pacs.009 COV',name:'Cover payment',messageId:'pacs.009.001.08',businessService:'swift.cbprplus.cov.03'},
    {key:'pain001',label:'pain.001',name:'Customer payment initiation',messageId:'pain.001.001.09',businessService:'swift.cbprplus.03'}
  ],rules:[]
});
export const BAH_VERSIONS=['head.001.001.03','head.001.001.02'];
export const ENVELOPE_REVISION=2;
export const HEADER_TEMPLATE='<RTPSHdr>\n  <ACITBHdr>\n    <RequestType>{{requestType}}</RequestType>\n    <SourceCode>{{sourceCode}}</SourceCode>\n  </ACITBHdr>\n</RTPSHdr>';
export const escapeXML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const tag=(n,v)=>`<${n}>${escapeXML(v)}</${n}>`;
const wrap=(n,v)=>`<${n}>${v}</${n}>`;
export function freshIds(){const id=crypto.randomUUID();return {messageId:'TEST-'+id.slice(0,8).toUpperCase(),endToEndId:'E2E-'+id.slice(9,18).toUpperCase(),uetr:crypto.randomUUID(),createdAt:new Date().toISOString().replace(/\.\d{3}Z$/,'Z')};}
export function partyDefaults(){
 const d={includeDebtorAgent:false,includeCreditorAgent:false,debtorAgentBic:'TESTUS33XXX',creditorAgentBic:'DEMOGB2LXXX',debtorAgentAccount:'',creditorAgentAccount:'',institutionDebtorAccount:'',institutionCreditorAccount:'',underlyingDebtorAgentBic:'TESTUS33XXX',underlyingCreditorAgentBic:'DEMOGB2LXXX',underlyingDebtorAgentAccount:'',underlyingCreditorAgentAccount:''};
 for(const prefix of ['ultimateDebtor','ultimateCreditor','underlyingUltimateDebtor','underlyingUltimateCreditor']){d['include'+prefix[0].toUpperCase()+prefix.slice(1)]=false;d[prefix+'Name']=prefix.endsWith('Creditor')?'Ultimate Beneficiary Test Ltd':'Ultimate Originator Test Ltd';d[prefix+'City']=prefix.endsWith('Creditor')?'London':'New York';d[prefix+'Country']=prefix.endsWith('Creditor')?'GB':'US';d[prefix+'Bic']=prefix.endsWith('Creditor')?'DEMOGB2LXXX':'TESTUS33XXX';}
 for(const prefix of ['intermediary','underlyingIntermediary'])for(let i=1;i<=3;i++){d['include'+prefix[0].toUpperCase()+prefix.slice(1)+i]=false;d[prefix+i+'Bic']='TESTUS33XXX';d[prefix+i+'Account']='';}
 return d;
}
export function restoreState(saved){const state={...defaults(),...(saved||{})};if(saved){if(!Object.hasOwn(saved,'underlyingDebtorAgentBic'))state.underlyingDebtorAgentBic=state.debtorBic;if(!Object.hasOwn(saved,'underlyingCreditorAgentBic'))state.underlyingCreditorAgentBic=state.creditorBic;}return state;}
export function defaults(){return {...partyDefaults(),...freshIds(),type:'pacs008',amount:'12500.00',currency:'USD',valueDate:new Date().toISOString().slice(0,10),settlement:'INDA',chargeBearer:'SHAR',senderBic:'TESTUS33XXX',receiverBic:'DEMO GB2LXXX'.replace(/ /g,''),debtorBic:'TESTUS33XXX',creditorBic:'DEMOGB2LXXX',debtorName:'Northstar Trading Test Ltd',debtorAccount:'TEST-DBTR-001',debtorCity:'New York',debtorCountry:'US',creditorName:'Meridian Supply Test Ltd',creditorAccount:'TEST-CDTR-001',creditorCity:'London',creditorCountry:'GB',remittance:'Synthetic test payment / invoice TEST-2025-001',mode:'positive',negative:'missing-amount',output:'envelope',envelopeRevision:ENVELOPE_REVISION,bahVersion:'head.001.001.03',includeBizSvc:false,sourceCode:'WSN',requestType:'HV_NON_PASS_THROUGH',headerTemplate:HEADER_TEMPLATE,includeAci:true,includeBah:true};}
export function upgradeDraft(draft){const state=restoreState(draft);if(draft&&draft.envelopeRevision!==ENVELOPE_REVISION){state.output='envelope';state.bahVersion='head.001.001.03';state.includeBizSvc=false;state.envelopeRevision=ENVELOPE_REVISION;}return state;}
export function pretty(xml){return xml.replace(/>\s*</g,'>\n<').split('\n').reduce((a,line)=>{if(/^<\//.test(line))a.level--;a.lines.push('  '.repeat(Math.max(0,a.level))+line);if(/^<[^!?/][^>]*>$/.test(line)&&!/<\//.test(line)&&! /\/>$/.test(line))a.level++;return a;},{level:0,lines:[]}).lines.join('\n');}
export function headerXML(s){return s.headerTemplate.replace(/\{\{sourceCode\}\}/g,()=>escapeXML(s.sourceCode)).replace(/\{\{requestType\}\}/g,()=>escapeXML(s.requestType));}
export function generate(s,pack=BUILTIN){
 const p=pack.profiles.find(p=>p.key===s.type);if(!p)throw Error('Message profile unavailable in this standards package.');
 const ag=(n,b)=>wrap(n,wrap('FinInstnId',tag('BICFI',b)));
 const acct=(n,a)=>wrap(n,wrap('Id',wrap('Othr',tag('Id',a))));
 const party=(n,prefix)=>{const city=s[prefix+'City'],country=s[prefix+'Country'];return wrap(n,tag('Nm',s[prefix+'Name'])+wrap('PstlAdr',(s[prefix+'Postal']?tag('PstCd',s[prefix+'Postal']):'')+(city?tag('TwnNm',city):'')+(s[prefix+'Subdivision']?tag('CtrySubDvsn',s[prefix+'Subdivision']):'')+(country?tag('Ctry',country):'')+[1,2].map(i=>s[prefix+'AddressLine'+i]?tag('AdrLine',s[prefix+'AddressLine'+i]):'').join('')));};
 const optionalAcct=(n,value)=>value?acct(n,value):'';
 const enabled=prefix=>s['include'+prefix[0].toUpperCase()+prefix.slice(1)];
 const ultimate=(name,prefix,financial=false)=>enabled(prefix)?(financial?ag(name,s[prefix+'Bic']):party(name,prefix)):'';
 const agentRole=(name,prefix)=>enabled(prefix)?ag(name,s[prefix+'Bic'])+optionalAcct(name+'Acct',s[prefix+'Account']):'';
 const intermediaries=(prefix='intermediary')=>[1,2,3].map(i=>agentRole('IntrmyAgt'+i,prefix+i)).join('');
 const rmt=()=>s.remittance?wrap('RmtInf',tag('Ustrd',s.remittance)):'';
 const customer=(underlying=false)=>{
  const debtorAgent=underlying?(s.underlyingDebtorAgentBic??s.debtorBic):s.debtorBic,creditorAgent=underlying?(s.underlyingCreditorAgentBic??s.creditorBic):s.creditorBic;
  const debtorAcct=underlying?s.underlyingDebtorAgentAccount:s.debtorAgentAccount,creditorAcct=underlying?s.underlyingCreditorAgentAccount:s.creditorAgentAccount;
  return ultimate('UltmtDbtr',underlying?'underlyingUltimateDebtor':'ultimateDebtor')+party('Dbtr','debtor')+acct('DbtrAcct',s.debtorAccount)+ag('DbtrAgt',debtorAgent)+optionalAcct('DbtrAgtAcct',debtorAcct)+(underlying?intermediaries('underlyingIntermediary'):'')+ag('CdtrAgt',creditorAgent)+optionalAcct('CdtrAgtAcct',creditorAcct)+party('Cdtr','creditor')+acct('CdtrAcct',s.creditorAccount)+ultimate('UltmtCdtr',underlying?'underlyingUltimateCreditor':'ultimateCreditor');
 };
 const paymentId=wrap('PmtId',tag('InstrId',s.messageId)+tag('EndToEndId',s.endToEndId)+(s.type==='pain001'?'':tag('UETR',s.uetr)));
 const amt=(name)=>`<${name} Ccy="${escapeXML(s.currency)}">${escapeXML(s.amount)}</${name}>`;
 let body,group=tag('MsgId',s.messageId)+tag('CreDtTm',s.createdAt)+tag('NbOfTxs','1');
 if(s.type==='pain001'){
  group+=wrap('InitgPty',tag('Nm',s.debtorName));
  const pay=tag('PmtInfId',s.messageId)+tag('PmtMtd','TRF')+tag('NbOfTxs','1')+wrap('ReqdExctnDt',tag('Dt',s.valueDate))+party('Dbtr','debtor')+acct('DbtrAcct',s.debtorAccount)+ag('DbtrAgt',s.debtorBic)+optionalAcct('DbtrAgtAcct',s.debtorAgentAccount)+ultimate('UltmtDbtr','ultimateDebtor')+tag('ChrgBr',s.chargeBearer)+wrap('CdtTrfTxInf',paymentId+wrap('Amt',amt('InstdAmt'))+intermediaries()+ag('CdtrAgt',s.creditorBic)+optionalAcct('CdtrAgtAcct',s.creditorAgentAccount)+party('Cdtr','creditor')+acct('CdtrAcct',s.creditorAccount)+ultimate('UltmtCdtr','ultimateCreditor')+rmt());
  body=wrap('CstmrCdtTrfInitn',wrap('GrpHdr',group)+wrap('PmtInf',pay));
 }else{
  group+=wrap('SttlmInf',tag('SttlmMtd',s.settlement));
  let tx=paymentId+amt('IntrBkSttlmAmt')+tag('IntrBkSttlmDt',s.valueDate);
  if(s.type==='pacs008')tx+=amt('InstdAmt')+tag('ChrgBr',s.chargeBearer);
  tx+=ag('InstgAgt',s.senderBic)+ag('InstdAgt',s.receiverBic)+intermediaries();
  if(s.type==='pacs008')tx+=customer()+rmt();
  else {
   tx+=ultimate('UltmtDbtr','ultimateDebtor',true)+ag('Dbtr',s.debtorBic)+optionalAcct('DbtrAcct',s.institutionDebtorAccount)+agentRole('DbtrAgt','debtorAgent')+agentRole('CdtrAgt','creditorAgent')+ag('Cdtr',s.creditorBic)+optionalAcct('CdtrAcct',s.institutionCreditorAccount)+ultimate('UltmtCdtr','ultimateCreditor',true);
   if(s.type==='pacs009cov')tx+=wrap('UndrlygCstmrCdtTrf',customer(true)+rmt()+amt('InstdAmt'));else tx+=rmt();
  }
  body=wrap(s.type==='pacs008'?'FIToFICstmrCdtTrf':'FICdtTrf',wrap('GrpHdr',group)+wrap('CdtTrfTxInf',tx));
 }
 let document=`<Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:${p.messageId}">${body}</Document>`;
 if(s.mode==='negative'){
  if(s.negative==='missing-amount')document=document.replace(s.type==='pain001'?/<InstdAmt\b[^>]*>[^<]*<\/InstdAmt>/:/<IntrBkSttlmAmt\b[^>]*>[^<]*<\/IntrBkSttlmAmt>/,'');
  if(s.negative==='invalid-bic')document=document.replace(/<BICFI>[^<]*<\/BICFI>/,'<BICFI>BAD</BICFI>');
  if(s.negative==='invalid-currency')document=document.replace(/Ccy="[^"]*"/,'Ccy="US"');
  if(s.negative==='count-mismatch')document=document.replace('<NbOfTxs>1</NbOfTxs>','<NbOfTxs>2</NbOfTxs>');
 }
 const bahVersion=s.bahVersion||BAH_VERSIONS[0];
 if(!BAH_VERSIONS.includes(bahVersion))throw Error('Unsupported Business Application Header version.');
 const bah=`<AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:${bahVersion}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${wrap('Fr',wrap('FIId',wrap('FinInstnId',tag('BICFI',s.senderBic))))}${wrap('To',wrap('FIId',wrap('FinInstnId',tag('BICFI',s.receiverBic))))}${tag('BizMsgIdr',s.messageId)}${tag('MsgDefIdr',p.messageId)}${s.includeBizSvc?tag('BizSvc',p.businessService):''}${tag('CreDt',s.createdAt)}</AppHdr>`;
 const aci=headerXML(s);
 const envelope=`<ns:RTPSMsg xmlns:ns="urn:rtps.bank">${aci}<BusMsg>${bah}${document}</BusMsg></ns:RTPSMsg>`;
 const outputs={document,bah,aci,envelope};
 return {xml:'<?xml version="1.0" encoding="UTF-8"?>\n'+pretty(outputs[s.output]||document),document:pretty(document),bah:pretty(bah),aci:pretty(aci),bahVersion,profile:p};
}
export function validatePackage(pack){
 if(!pack||typeof pack!=='object')throw Error('Choose a standards package JSON object.');
 for(const f of ['id','name','version','effectiveDate'])if(typeof pack[f]!=='string'||!pack[f].trim()||pack[f].length>100)throw Error('Package needs a valid '+f+'.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(pack.effectiveDate)||Number.isNaN(Date.parse(pack.effectiveDate)))throw Error('Effective date must be YYYY-MM-DD.');
 if(!Array.isArray(pack.profiles)||pack.profiles.length!==4)throw Error('Package must contain the four supported profiles.');
 const keys=['pacs008','pacs009','pacs009cov','pain001'];
 for(const k of keys){const list=pack.profiles.filter(p=>p.key===k);if(list.length!==1)throw Error('Missing or duplicate profile '+k);const p=list[0],family=k==='pacs009cov'?'pacs.009':k==='pacs008'?'pacs.008':k==='pacs009'?'pacs.009':'pain.001';if(!new RegExp('^'+family.replaceAll('.','\\.')+'\\.001\\.\\d{2}$').test(p.messageId))throw Error('Unsupported message family for '+k);for(const f of ['name','label','businessService'])if(typeof p[f]!=='string'||p[f].length>150)throw Error('Invalid profile '+f);if(typeof p.schema!=='string'||p.schema.length>500000||!p.schema.includes('http://www.w3.org/2001/XMLSchema')||!p.schema.includes('urn:iso:std:iso:20022:tech:xsd:'+p.messageId))throw Error('Include a self-contained XSD with matching namespace for '+k);if(/<!DOCTYPE|<!ENTITY|<(?:\w+:)?(?:import|include|redefine)\b/i.test(p.schema))throw Error('External XSD dependencies and DTDs are not supported.');}
 if(!Array.isArray(pack.rules)||pack.rules.length>50)throw Error('Include a rules array of at most 50 rules.');
 for(const r of pack.rules){if(!r||typeof r.id!=='string'||r.id.length>100||typeof r.message!=='string'||r.message.length>300||!['required','equals','maxLength'].includes(r.check)||typeof r.path!=='string'||!/^Document(?:\/[A-Za-z][A-Za-z0-9]*)+$/.test(r.path))throw Error('Invalid rule: use Document/element paths and required, equals, or maxLength.');if(r.profiles&&(!Array.isArray(r.profiles)||r.profiles.some(x=>!keys.includes(x))))throw Error('Unknown rule profile.');if(r.check==='maxLength'&&(!Number.isInteger(r.value)||r.value<1||r.value>10000))throw Error('Invalid maximum length.');if(r.check==='equals'&&typeof r.value!=='string')throw Error('Equals rules need a string value.');}
 if(pack.id===BUILTIN.id)throw Error('Use a new package ID; the built-in baseline is immutable.');
 return JSON.parse(JSON.stringify(pack));
}
