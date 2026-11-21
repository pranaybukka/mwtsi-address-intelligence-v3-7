import {currentUser} from '@/lib/auth';import {redirect} from 'next/navigation';import UserManager from '@/components/UserManager';
export default async function Page(){const user=await currentUser();if(!user)redirect('/login');if(user.mustChangePassword)redirect('/change-password');if(user.role!=='Admin')redirect('/review');return <UserManager currentId={user.id}/>;}
