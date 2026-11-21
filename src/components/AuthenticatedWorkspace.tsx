import {canOpenWorkspaceView} from '@/lib/entitlements';
import {redirect} from 'next/navigation';import {currentUser} from '@/lib/auth';import Workspace from './Workspace';
export default async function AuthenticatedWorkspace({initialView}:{initialView:'dashboard'|'upload'|'review'|'results'|'export'|'live'|'compare'|'bulk'|'payments'}){const user=await currentUser();if(!user)redirect('/login');if(user.mustChangePassword)redirect('/change-password');if(!canOpenWorkspaceView(user,initialView))redirect('/review');return <Workspace initialView={initialView} user={user}/>;}
