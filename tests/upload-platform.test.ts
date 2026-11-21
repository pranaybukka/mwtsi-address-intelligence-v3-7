import {it,expect} from 'vitest';
import {NextRequest} from 'next/server';
import {POST} from '../src/app/api/batches/route';
import {GET} from '../src/app/api/template/route';
const names=['test.xlsx','Address Test.xlsx','Address_Test_(1).xlsx',"Manny's Test.xlsx",'2026 Hybrid Address Test.xlsx','São Paulo Addresses.xlsx','C:\\fakepath\\input.xlsx','C:\\Users\\Manny\\Downloads\\input.xlsx'];
it.each(names)('processes uploaded bytes with filename %s',async(name)=>{const bytes=await (await GET()).arrayBuffer();const f=new FormData();f.append('file',new File([bytes],name,{type:'application/octet-stream'}));const r=await POST(new NextRequest('http://localhost/api/batches',{method:'POST',body:f}));expect(r.status,JSON.stringify(await r.clone().json())).toBe(200);});
it('accepts matching HTTP Host and Origin despite a canonical internal hostname',async()=>{const f=new FormData();f.append('file',new File([await(await GET()).arrayBuffer()],'test.xlsx'));const r=await POST(new NextRequest('http://localhost:3000/api/batches',{method:'POST',headers:{origin:'http://127.0.0.1:3000',host:'127.0.0.1:3000'},body:f}));expect(r.status).toBe(200);});

it.each(['','application/octet-stream','application/zip','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadml.sheet','text/plain'])('accepts valid XLSX bytes despite MIME %j',async(type)=>{
 const f=new FormData();f.append('file',new File([await(await GET()).arrayBuffer()],'Address Test.xlsx',{type}));
 const response=await POST(new NextRequest('http://localhost/api/batches',{method:'POST',body:f}));expect(response.status).toBe(200);
});
