import {db} from './connection';
import {DEFAULT_APPEARANCE,isAppearance,type Appearance} from '@/lib/appearance';
import {AccessError} from '@/lib/auth';
export function userAppearance(userId:string):Appearance {
 const row=db().prepare('SELECT scheme,mode FROM user_appearance WHERE user_id=?').get(userId);
 return isAppearance(row)?row:{...DEFAULT_APPEARANCE};
}
export function saveUserAppearance(userId:string,value:unknown):Appearance {
 if(!isAppearance(value))throw new AccessError('Choose an available color scheme and light or dark mode',400);
 const changed=db().prepare(`INSERT INTO user_appearance(user_id,scheme,mode)
  SELECT id,?,? FROM auth_users WHERE id=? AND active=1 AND must_change=0
  ON CONFLICT(user_id) DO UPDATE SET scheme=excluded.scheme,mode=excluded.mode`).run(value.scheme,value.mode,userId);
 if(!changed.changes)throw new AccessError('Sign in again before changing appearance',401);
 return {...value};
}
