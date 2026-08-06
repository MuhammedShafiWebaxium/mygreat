'use client'
async function json(url:string,init?:RequestInit){const r=await fetch(url,init),b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.error||'Request failed.');return b}
const post=(body:unknown)=>json('/api/support',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
export const getStudentSupport=()=>json('/api/support')
export const sendStudentSupportMessage=(body:string)=>post({action:'message',body})
export const decideStudentTicketResolution=(threadId:string,decision:'APPROVE'|'REJECT')=>post({action:'resolutionDecision',threadId,decision})
export const dummySubscribe=()=>post({action:'subscribe'})
export async function receiptSubscribe(file:File){const f=new FormData();f.set('file',file);return json('/api/support',{method:'POST',body:f})}
export const getStaffThreads=()=>json('/api/support?action=threads')
export const getTicketRecipients=()=>json('/api/support?action=recipients') as Promise<Array<{id:string;name:string;email:string;role:string;accountType:'ADMIN'|'PARTNER';companyName:string|null}>>
export const getStaffThread=(id:string)=>json(`/api/support?action=thread&threadId=${encodeURIComponent(id)}`)
export const getTicketAssignees=(threadId:string)=>json(`/api/support?action=assignees&threadId=${encodeURIComponent(threadId)}`) as Promise<Array<{id:string;name:string;role:string;accountType:'ADMIN'|'PARTNER';companyName:string|null}>>
export const sendStaffSupportMessage=(threadId:string,body:string)=>post({action:'message',threadId,body})
export const assignSupportTicket=(threadId:string,assigneeId:string)=>post({action:'assignTicket',threadId,assigneeId})
export const createTicket=(data:{subject:string;body:string;recipientId:string;category:string;priority:string})=>post({action:'createTicket',...data})
export const updateTicket=(threadId:string,data:{status?:string;category?:string;priority?:string;assignToMe?:boolean;resolutionDecision?:'APPROVE'|'REJECT';postponedUntil?:string})=>post({action:'updateTicket',threadId,...data})
export const getFinance=()=>json('/api/support?action=finance')
export const savePriorityPrice=(price:number)=>post({action:'updatePlan',price})
export const reviewSubscriptionPayment=(paymentId:string,approved:boolean,note='')=>post({action:'reviewPayment',paymentId,approved,note})
