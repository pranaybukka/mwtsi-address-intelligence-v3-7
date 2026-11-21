import countries from 'i18n-iso-countries';
import {normalize} from '../parser/normalize';
// The dependency includes user-assigned XK; it is not an assigned ISO 3166-1 code.
const assigned=new Set(Object.keys(countries.getAlpha2Codes()).filter(code=>code!=='XK'));
export const isIsoCountryCode=(value:string)=>assigned.has(value);
/** Codes are accepted as whole structured-field values, never substring guesses. */
export function isoCountryCode(value:string):string|undefined {
 const input=normalize(value);
 const compact=/^[A-Z](?:[.\s]*[A-Z]){1,2}\.?$/.test(input)?input.replace(/[.\s]/g,''):input;
 const code=compact==='UK'?'GB':assigned.has(compact)?compact:/^[A-Z]{3}$/.test(compact)?countries.alpha3ToAlpha2(compact):/^\d{3}$/.test(compact)?countries.numericToAlpha2(compact):undefined;
 return code&&assigned.has(code)?code:undefined;
}
/** Qualified territory names stay distinct from the parent country's ISO entry. */
export const additionalCountryAliases:Record<string,string[]>={
 'HONG KONG CHINA':['HK'],'HONG KONG SAR':['HK'],'HONG KONG SAR CHINA':['HK'],'HONG KONG S A R CHINA':['HK'],'HONG KONG SPECIAL ADMINISTRATIVE REGION OF CHINA':['HK'],
 'MACAU':['MO'],'MACAO CHINA':['MO'],'MACAU CHINA':['MO'],'MACAO SAR':['MO'],'MACAU SAR':['MO'],'MACAO SAR CHINA':['MO'],'MACAU SAR CHINA':['MO'],'MACAO SPECIAL ADMINISTRATIVE REGION OF CHINA':['MO'],'MACAU SPECIAL ADMINISTRATIVE REGION OF CHINA':['MO'],
 'UAE':['AE'],'VIET NAM':['VN'],'CZECH REPUBLIC':['CZ'],'TURKEY':['TR'],
 'PRC':['CN'],'P R CHINA':['CN'],'PEOPLES REPUBLIC OF CHINA':['CN'],
 // Unqualified Korea, like Congo, is not enough to select a single ISO entry.
 'KOREA':['KP','KR']
};
