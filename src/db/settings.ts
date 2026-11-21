import {db} from './connection';
import {ProcessingSettings} from '../lib/domain';
function activeSettings(value:Partial<ProcessingSettings>={}):ProcessingSettings{return {postalLookupEnabled:value.postalLookupEnabled!==false};}
export function processingSettings():ProcessingSettings {
 const row=db().prepare("SELECT value FROM metadata WHERE key='processing-settings'").get() as {value:string}|undefined;
 return activeSettings(row?JSON.parse(row.value):{});
}
export function saveProcessingSettings(value:unknown):ProcessingSettings {
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==1||!('postalLookupEnabled' in value)||typeof value.postalLookupEnabled!=='boolean')throw Error('Only boolean postalLookupEnabled is configurable; automatic town approval has been removed');
 const settings:ProcessingSettings={postalLookupEnabled:value.postalLookupEnabled};db().prepare("INSERT OR REPLACE INTO metadata VALUES ('processing-settings',?)").run(JSON.stringify(settings));return settings;
}
export function saveBatchSettings(id:string,settings:ProcessingSettings){db().prepare('INSERT INTO batch_settings VALUES (?,?)').run(id,JSON.stringify(activeSettings(settings)));}
/** Archived settings are returned verbatim for historical exports/audit, not used to approve work. */
export function storedBatchSettings(id:string):ProcessingSettings {
 const row=db().prepare('SELECT payload FROM batch_settings WHERE batch_id=?').get(id) as {payload:string}|undefined;
 return row?JSON.parse(row.payload):activeSettings();
}
/** Only supported settings can affect remaining rows, including older paused/resumed jobs. */
export function batchProcessingSettings(id:string):ProcessingSettings{return activeSettings(storedBatchSettings(id));}
