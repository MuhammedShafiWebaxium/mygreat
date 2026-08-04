'use client'
async function json(url:string,init?:RequestInit){const r=await fetch(url,init),b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.error||'Request failed.');return b}
const post=(body:unknown)=>json('/api/support',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
export const getStudentSupport=()=>json('/api/support')
export const sendStudentSupportMessage=(body:string)=>post({action:'message',body})
export const dummySubscribe=()=>post({action:'subscribe'})
export async function receiptSubscribe(file:File){const f=new FormData();f.set('file',file);return json('/api/support',{method:'POST',body:f})}
export const getStaffThreads=()=>json('/api/support?action=threads')
export const getStaffThread=(id:string)=>json(`/api/support?action=thread&threadId=${encodeURIComponent(id)}`)
export const sendStaffSupportMessage=(threadId:string,body:string)=>post({action:'message',threadId,body})
export const getFinance=()=>json('/api/support?action=finance')
export const savePriorityPrice=(price:number)=>post({action:'updatePlan',price})
export const reviewSubscriptionPayment=(paymentId:string,approved:boolean,note='')=>post({action:'reviewPayment',paymentId,approved,note})
