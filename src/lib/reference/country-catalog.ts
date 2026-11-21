import en from 'i18n-iso-countries/langs/en.json';
import fr from 'i18n-iso-countries/langs/fr.json';
import de from 'i18n-iso-countries/langs/de.json';
import es from 'i18n-iso-countries/langs/es.json';
import pt from 'i18n-iso-countries/langs/pt.json';
import ja from 'i18n-iso-countries/langs/ja.json';
import zh from 'i18n-iso-countries/langs/zh.json';
import {key} from '../parser/normalize';
import {additionalCountryAliases,isIsoCountryCode,isoCountryCode} from './iso-country';
const aliases=new Map<string,Set<string>>();
function add(alias:string,code:string){const name=key(alias);if(!aliases.has(name))aliases.set(name,new Set());aliases.get(name)!.add(code);}
for(const locale of [en,fr,de,es,pt,ja,zh])for(const [code,names] of Object.entries(locale.countries))if(isIsoCountryCode(code))for(const name of Array.isArray(names)?names:[names])add(name,code);
for(const [alias,codes] of Object.entries(additionalCountryAliases))for(const code of codes)add(alias,code);
/** Shared browser/server resolver: exact recognized values only; ambiguity never picks a row. */
export function resolveCountry(value:string):{code?:string;ambiguous:boolean;alternatives:string[]} {
 const direct=isoCountryCode(value);if(direct)return {code:direct,ambiguous:false,alternatives:[]};
 const normalized=key(value);const compact=/^[A-Z](?:[.\s]*[A-Z]){1,2}\.?$/.test(value.trim().toUpperCase())?normalized.replace(/ /g,''):normalized;
 const codes=[...(aliases.get(normalized)||aliases.get(compact)||[])].sort();
 return {code:codes.length===1?codes[0]:undefined,ambiguous:codes.length>1,alternatives:codes};
}
