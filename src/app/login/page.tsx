import AccountForm from '@/components/AccountForm';import {currentUser} from '@/lib/auth';import {redirect} from 'next/navigation';
export default async function Page(){const user=await currentUser();if(user)redirect(user.mustChangePassword?'/change-password':'/');return <AccountForm/>;}
