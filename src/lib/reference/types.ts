export interface Country {code:string;alpha3:string;name:string;}
export interface Place {id:string;country:string;name:string;subdivision:string;source:string;alias?:string;}
export interface PostalMatch extends Place {postal:string;}
export interface ReferenceRepository {
 context?():string;
 countries():Country[];
 countryMatches(tokens:string[]):{alias:string;country:string}[];
 aliases(country:string):string[];
 places(tokens:string[],country?:string):Place[];
 postal(value:string,country?:string):PostalMatch[];
 subdivisions(country:string):{code:string;name:string;alias:string}[];
 postalPattern(country:string):string|undefined;
 snapshot?():import('../domain').ReferenceSnapshot|undefined;
 invalidate():void;
}
export interface AddressValidationProvider { validate(input:import('../domain').AddressInput):Promise<{evidence:import('../domain').Evidence[];candidates:Partial<import('../domain').StructuredAddress>}>; }
