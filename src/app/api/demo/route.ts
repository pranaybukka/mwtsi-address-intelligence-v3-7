import {withAuth} from '@/lib/auth';
import {createBatch} from '@/db/batches';
import {checkLocalMutation,apiError} from '@/lib/api';
async function POSTHandler(req:Request){try{checkLocalMutation(req);return Response.json(createBatch('Demonstration addresses.xlsx',[
{Name:'MORGAN HAYES',Address1:'100 MAIN STREET',Address2:'SUITE 400',Address3:'BOSTON MA 02110'},
{Name:'NORTHSTAR EUROPE GMBH',Address1:'FRIEDRICHSTRASSE 100',Address2:'FLOOR 2',Address3:'BERLIN 10117 GERMANY'},
{Name:'BLUE HARBOR CONSULTING',Address1:'18 QUEENS ROAD CENTRAL',Address2:'ROOM 2208',Address3:'CENTRAL HONG KONG'},
{Name:'SUMMIT PROPERTY GROUP',Address1:'716 AV ENG LUIZ CARLOS BERRINI',Address2:'CJ 1204',Address3:'SAO PAULO SP 04571-010 BRAZIL'},
{Name:'PACIFIC PARTNERS',Address1:'2-6-1 MARUNOUCHI',Address2:'11F',Address3:'TOKYO 100-0005 JAPAN'},
{Name:'EVERGREEN DISTRIBUTION',Address1:'ONE FINANCIAL CENTER',Address2:'MAILSTOP 4B',Address3:'BOSTON MA'},
{Name:'RIVERSTONE CAPITAL',Address1:'100 KING STREET',Address2:'SUITE 600',Address3:'TORONTO ON M5H 1J9 CANADA'},
{Name:'UNRESOLVED BENEFICIARY',Address1:'100 SOMEWHERE LANE',Address2:'ATTN COMMERCIAL CLAIMS AD',Address3:''},
{Name:'NAME ONLY BENEFICIARY',Address1:'',Address2:'',Address3:''}
].map((source,index)=>({...source,Group:['Operations','Treasury','Exceptions'][index%3]}))));}catch(e){return apiError(e);}}

export const POST=withAuth(POSTHandler,true);
