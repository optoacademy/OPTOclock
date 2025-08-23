import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const cors={ 'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const supa=()=>createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE);

async function scryptHash(password,saltHex){const salt=Buffer.from(saltHex,'hex');const dk=await new Promise((res,rej)=>crypto.scrypt(password,salt,64,{N:16384,r:8,p:1},(e,d)=>e?rej(e):res(d)));return {password_hash:dk.toString('hex')};}
function timingSafeEqualHex(a,b){const ba=Buffer.from(a||'','hex'),bb=Buffer.from(b||'','hex');if(ba.length!==bb.length)return false;return crypto.timingSafeEqual(ba,bb);}

export async function handler(event){
  if(event.httpMethod==='OPTIONS') return {statusCode:204,headers:cors,body:''};
  if(event.httpMethod!=='POST') return {statusCode:405,headers:cors,body:JSON.stringify({error:'Method not allowed'})};
  let body={};try{body=JSON.parse(event.body||'{}');}catch{return {statusCode:400,headers:cors,body:JSON.stringify({error:'Body inválido'})};}
  const {email,password}=body;if(!email||!password) return {statusCode:400,headers:cors,body:JSON.stringify({error:'Faltan email/password'})};

  const s=supa();
  const { data:user }=await s.from('users').select('*').eq('email',email).maybeSingle();
  if(!user) return {statusCode:401,headers:cors,body:JSON.stringify({error:'Credenciales inválidas'})};

  const { password_hash }=await scryptHash(password,user.password_salt);
  const ok=timingSafeEqualHex(password_hash,user.password_hash);
  if(!ok) return {statusCode:401,headers:cors,body:JSON.stringify({error:'Credenciales inválidas'})};

  const safe={id:user.id,email:user.email,full_name:user.full_name,company:user.company,position:user.position,is_admin:user.is_admin};
  return {statusCode:200,headers:cors,body:JSON.stringify({ok:true,user:safe})};
}
