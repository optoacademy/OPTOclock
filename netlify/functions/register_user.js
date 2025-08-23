import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const supa = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function scryptHash(password){ const salt=crypto.randomBytes(16);
  const dk=await new Promise((res,rej)=>crypto.scrypt(password,salt,64,{N:16384,r:8,p:1},(e,d)=>e?rej(e):res(d)));
  return {password_hash:dk.toString('hex'),password_salt:salt.toString('hex')};
}

export async function handler(event){
  if(event.httpMethod==='OPTIONS') return {statusCode:204,headers:cors,body:''};
  if(event.httpMethod!=='POST') return {statusCode:405,headers:cors,body:JSON.stringify({error:'Method not allowed'})};
  let body={}; try{ body=JSON.parse(event.body||'{}'); }catch{ return {statusCode:400,headers:cors,body:JSON.stringify({error:'Body inválido'})}; }
  const { admin_email, full_name, email, password, company, position } = body;
  if(!admin_email||!full_name||!email||!password||!company||!position)
    return {statusCode:400,headers:cors,body:JSON.stringify({error:'Faltan campos'})};

  const s=supa();
  const { data: admin }=await s.from('admins').select('email').eq('email',admin_email).maybeSingle();
  if(!admin) return {statusCode:403,headers:cors,body:JSON.stringify({error:'No autorizado'})};

  const { data: exist }=await s.from('users').select('id').eq('email',email).maybeSingle();
  if(exist) return {statusCode:409,headers:cors,body:JSON.stringify({error:'Ese email ya existe'})};

  const { password_hash,password_salt }=await scryptHash(password);
  const userRow={email,password_hash,password_salt,full_name,company,position,is_admin:false};
  const { data:user,error }=await s.from('users').insert(userRow).select().maybeSingle();
  if(error) return {statusCode:500,headers:cors,body:JSON.stringify({error:error.message})};

  return {statusCode:200,headers:cors,body:JSON.stringify({ok:true,user})};
}
