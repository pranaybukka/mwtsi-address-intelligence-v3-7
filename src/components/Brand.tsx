import {OrbitGlobe} from './OrbitGlobe';
/** MWTSI wordmark with a decorative globe; no character artwork. */
export default function Brand({variant='sidebar'}:{variant?:'sidebar'|'auth'|'admin'}){
 return <div className={`mwtsi-brand mwtsi-brand--${variant}`}><OrbitGlobe animated={variant==='sidebar'}/><div className="mwtsi-brand__copy"><strong>MWTSI<span className="brand-period" aria-hidden="true">.</span></strong><span>Address Intelligence</span></div></div>;
}
