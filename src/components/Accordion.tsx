'use client';
import {useState} from 'react';
import {ChevronDown} from 'lucide-react';
export default function Accordion({title,description,defaultOpen=false,className='',children}:{title:string;description?:string;defaultOpen?:boolean;className?:string;children:React.ReactNode}){
 const [open,setOpen]=useState(defaultOpen);
 return <details className={`accordion ${className}`} open={open} onToggle={event=>setOpen(event.currentTarget.open)}><summary><span className="accordion-title"><strong>{title}</strong>{description&&<small>{description}</small>}</span><ChevronDown className="accordion-chevron" size={18} aria-hidden="true"/></summary><div className="accordion-content">{children}</div></details>;
}
