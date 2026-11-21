export const BIC_PATTERN=/^[A-Z0-9]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/;
export const normalizeBic=value=>String(value??'').replace(/\s+/g,'').toUpperCase();
export const fold=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const displayNames=typeof Intl.DisplayNames==='function'?new Intl.DisplayNames(['en'],{type:'region'}):null;
export function countryName(code){try{return displayNames?.of(code)||code}catch{return code}}
export class BicDirectory{
 constructor(rows,metadata={}){
  this.records=rows.map(r=>Array.isArray(r)?{bic:r[0],name:r[1],country:r[2],city:r[3]||'',branch:r[4]||'',address:r[5]||'',lastUpdated:r[6]||''}:r);
  this.metadata=metadata;this.byBic=new Map(this.records.map(r=>[r.bic,r]));
  this.index=this.records.map(r=>fold([r.bic,r.name,r.country,countryName(r.country),r.city,r.branch,r.address].join(' ')));
 }
 search(query='',{limit=30,country=''}={}){
  const tokens=fold(query).split(/\s+/).filter(Boolean),code=normalizeBic(query);let total=0;const matches=[];
  const exact=this.byBic.get(code);if(exact&&(!country||exact.country===country)){matches.push(exact);total++}
  for(let i=0;i<this.records.length;i++){const r=this.records[i];if(r===exact||country&&r.country!==country)continue;if(tokens.every(t=>this.index[i].includes(t))){total++;if(matches.length<limit)matches.push(r)}}
  return {matches,total};
 }
}
function parseDelimited(text){
 text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/)[0];const delimiter=['\t',';',','].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
 if(delimiter==='\t'&&/Full legal name/i.test(first)&&/Brch Code/i.test(first)){const lines=text.split(/\r?\n/).filter(l=>l.trim()),headers=lines.shift().split('\t');return lines.map((line,i)=>{const r=line.split('\t');if(r.length!==headers.length)throw Error('ISOBIC column count does not match on record '+(i+1)+'.');return Object.fromEntries(headers.map((h,i)=>[h,r[i]]))});}
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else if(quoted||cell===''){quoted=!quoted}else throw Error('Unexpected quote in the directory file.')}else if(c===delimiter&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c;}
 if(quoted)throw Error('Unclosed quoted value in the directory file.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2)throw Error('Directory CSV needs column headers and at least one record.');const headers=rows.shift();return rows.map((r,i)=>{if(r.length!==headers.length)throw Error('Column count does not match on record '+(i+1)+'.');return Object.fromEntries(headers.map((h,i)=>[h,r[i]]))});
}
const aliases={bic:['bic','biccode','bic11','bic8','swift','swiftcode','swiftbic','code'],name:['name','institution','institutionname','bank','bankname','registeredname','bicname','fulllegalname'],country:['countrycode','isocountrycode','country'],city:['city','town','townname'],branch:['branch','branchname','branchinformation','branchdescription'],branchCode:['brchcode','branchcode'],address:['branchaddress','operationaladdress','registeredaddress','address'],lastUpdated:['lastupdatedate','lastupdated','updatedate']};
export function parseDirectory(text,fileName='directory.csv'){
 let raw,metadata={};
 if(/\.json$/i.test(fileName)||/^[\s\uFEFF]*[\[{]/.test(text)){let json;try{json=JSON.parse(text.replace(/^\uFEFF/,''))}catch{throw Error('Invalid directory JSON.')}raw=Array.isArray(json)?json:json.records;metadata=Array.isArray(json)?{}:{name:json.name||json.source,asOf:json.asOf};}
 else raw=parseDelimited(text);
 if(!Array.isArray(raw)||!raw.length||raw.length>500000)throw Error('Directory must contain 1 to 500,000 records.');
 let duplicates=0,sourceRecords=raw.length,isoBicFormat=false;const map=new Map(),bic8Records=new Map();let latestRecordUpdate=null;
 for(let i=0;i<raw.length;i++){
  if(!raw[i]||typeof raw[i]!=='object'||Array.isArray(raw[i]))throw Error('Record '+(i+1)+' must be an object with BIC and institution fields.');
  const normalized=Object.fromEntries(Object.entries(raw[i]).map(([k,v])=>[k.toLowerCase().replace(/[^a-z0-9]/g,''),v]));
  const get=key=>{for(const a of aliases[key]){if(normalized[a]!=null&&String(normalized[a]).trim())return String(normalized[a]).trim()}return ''};
  let bic=normalizeBic(get('bic'));const baseBic=bic,name=get('name'),country=get('country'),branchCode=normalizeBic(get('branchCode'));if(branchCode){if(!/^[A-Z0-9]{3}$/.test(branchCode)||bic.length!==8)throw Error('Expected BIC8 and three-character branch code on record '+(i+1)+'.');bic+=branchCode;isoBicFormat=true;}
  if(!BIC_PATTERN.test(bic))throw Error('Invalid BIC on record '+(i+1)+': '+bic);
  if(!name||name.length>300)throw Error('Institution name is missing or too long on record '+(i+1)+'.');
  if(country.length===2&&country.toUpperCase()!==bic.slice(4,6))throw Error('Country code conflicts with BIC on record '+(i+1)+'.');
  const lastUpdated=get('lastUpdated'),address=get('address');if(lastUpdated&&/^\d{4}-\d{2}-\d{2}$/.test(lastUpdated)&&(!latestRecordUpdate||lastUpdated>latestRecordUpdate))latestRecordUpdate=lastUpdated;const record={bic,name,country:bic.slice(4,6),city:get('city'),branch:get('branch')||(branchCode?branchCode:''),address,lastUpdated};if(address.length>1000)throw Error('Address is too long on record '+(i+1)+'.');if(branchCode&&(!bic8Records.has(baseBic)||branchCode==='XXX'))bic8Records.set(baseBic,{...record,bic:baseBic,branch:''});
  if(record.city.length>200||record.branch.length>500)throw Error('City or branch value is too long on record '+(i+1)+'.');
  if(map.has(bic)){duplicates++;continue}map.set(bic,record);
 }
 for(const [bic,r] of bic8Records)if(!map.has(bic))map.set(bic,r);
 const records=[...map.values()].sort((a,b)=>a.bic.localeCompare(b.bic));
 return {records,metadata:{...metadata,name:String(metadata.name||fileName).slice(0,150),asOf:typeof metadata.asOf==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(metadata.asOf)?metadata.asOf:null,count:records.length,sourceRecords,isoBicFormat,bic8Records:records.filter(r=>r.bic.length===8).length,bic11Records:records.filter(r=>r.bic.length===11).length,latestRecordUpdate,countries:new Set(records.map(r=>r.country)).size,duplicatesRemoved:duplicates,kind:'imported',importedAt:new Date().toISOString(),coverage:'User-imported reference data; publisher completeness, connectivity and active status are not independently verified.'}};
}
export const DIRECTORY_TEMPLATE='bic,institution,country,city,branch\r\nCHASUS33XXX,JPMORGAN CHASE BANK N.A.,US,NEW YORK,Head office\r\n';
export function directoryStore(operation,value){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(Error('Local directory storage is unavailable in this browser.'));return}
  const open=indexedDB.open('mwtsi-integrated-bic-directory:'+new URLSearchParams(location.search).get('scope'),1);open.onupgradeneeded=()=>open.result.createObjectStore('directory');open.onerror=()=>reject(open.error);
  open.onsuccess=()=>{const db=open.result,tx=db.transaction('directory',operation==='get'?'readonly':'readwrite'),store=tx.objectStore('directory');let result;
   const req=operation==='get'?store.get('active'):operation==='delete'?store.delete('active'):store.put(value,'active');req.onsuccess=()=>{result=req.result};tx.oncomplete=()=>{db.close();resolve(result)};tx.onerror=()=>{db.close();reject(tx.error||Error('Directory storage failed.'))};tx.onabort=()=>{db.close();reject(tx.error||Error('Directory storage was cancelled.'))};
  };
 });
}
