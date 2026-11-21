import type {Metadata} from 'next';
import './globals.css';
import './ui-refresh.css';
import './live-translate.css';
import './appearance.css';
import './review-refinement.css';
import './review-canvas.css';
import './payment-lab.css';
import './workflows.css';
import {GlobeMotionProvider} from '@/components/OrbitGlobe';
import {AppearanceProvider} from '@/components/Appearance';
import {currentUser} from '@/lib/auth';
import {userAppearance} from '@/db/appearance';
import {DEFAULT_APPEARANCE} from '@/lib/appearance';
export const metadata:Metadata={title:'MWTSI Address Intelligence',description:'Review, reconcile and export Hybrid addresses from one operational workspace.',icons:{icon:[{url:'/branding/mwtsi-mark.svg',type:'image/svg+xml'}]}};
export default async function RootLayout({children}:{children:React.ReactNode}){const user=await currentUser(),userId=user&&!user.mustChangePassword?user.id:null,initial=userId?userAppearance(userId):DEFAULT_APPEARANCE;return <html lang="en" data-scheme={initial.scheme} data-mode={initial.mode}><body><AppearanceProvider key={userId??'anonymous'} initial={initial} userId={userId}><GlobeMotionProvider><a className="skip-link" href="#main-content">Skip to content</a>{children}</GlobeMotionProvider></AppearanceProvider></body></html>;}
