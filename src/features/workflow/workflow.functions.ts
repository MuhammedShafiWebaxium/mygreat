'use client'

import type { createApplication, readStudentDashboard, setTaskCompleted, updateApplication } from './workflow.server'

type Dashboard = Awaited<ReturnType<typeof readStudentDashboard>>
type CreatedApplication = Awaited<ReturnType<typeof createApplication>>
type UpdatedTask = Awaited<ReturnType<typeof setTaskCompleted>>
type UpdatedApplication = Awaited<ReturnType<typeof updateApplication>>

async function request<T>(action: string, data?: unknown): Promise<T> {
  const response = await fetch('/api/workflow', {
    method: data === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify({ action, data }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Request failed.')
  return body as T
}

export const getMyDashboardFn = () => request<Dashboard>('dashboard')
export const createApplicationFn = ({ data }: { data: unknown }) => request<CreatedApplication>('createApplication', data)
export const toggleTaskFn = ({ data }: { data: unknown }) => request<UpdatedTask>('toggleTask', data)
export const updateApplicationFn = ({ data }: { data: unknown }) => request<UpdatedApplication>('updateApplication', data)
export async function staffCreateApplicationFn({data,file}:{data:{studentId:string;universityId:string;program:string;deadline?:string};file:File}){const form=new FormData();form.set('workflowAction','createApplicationWithSop');form.set('studentId',data.studentId);form.set('universityId',data.universityId);form.set('program',data.program);if(data.deadline)form.set('deadline',data.deadline);form.set('file',file);const response=await fetch('/api/workflow',{method:'POST',body:form}),body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Application creation failed.');return body as CreatedApplication}
export async function uploadRequiredDocumentFn(documentType:string,file:File){const form=new FormData();form.set('documentType',documentType);form.set('file',file);const response=await fetch('/api/workflow',{method:'POST',body:form}),body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Upload failed.');return body}
export const reviewDocumentFn = (data:{documentId:string;status:'VERIFIED'|'NEEDED';note?:string}) => request('reviewDocument',data)
export const getWorkflowCaseFn=(applicationId:string,workflowType:'APPLICATION'|'VISA',visaAttemptId?:string)=>fetch(`/api/workflow?action=workflowCase&applicationId=${encodeURIComponent(applicationId)}&workflowType=${workflowType}${visaAttemptId?`&visaAttemptId=${encodeURIComponent(visaAttemptId)}`:''}`).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error||'Unable to load case.');return body})
export const actOnWorkflowCaseFn=(data:{applicationId:string;visaAttemptId?:string|null;workflowType:'APPLICATION'|'VISA';targetStage:string;outcome?:string;approvalStage?:'VISA_LEVEL_1_VERIFICATION'|'VISA_LEVEL_2_VERIFICATION';approvalRequestId?:string;offerType?:'CONDITIONAL'|'UNCONDITIONAL'|null;note:string;expectedCompletionAt?:string|null;expectedCompletionEndAt?:string|null;nextFollowUpAt?:string|null;assignedStaffId?:string|null;assignedStaffName?:string|null;reapplyMode?:'APPEAL'|'NEW_ATTEMPT';restartStage?:string;rejectionType?:'UNIVERSITY_FINAL'|'OFFICER_CORRECTION'|'STUDENT_ACTION';requiredDocumentIds?:string[]})=>request('workflowCaseAction',data)
export const setPriorityApplicationFn=(applicationId:string)=>request('setPriorityApplication',{applicationId})
export async function uploadSopFileFn(applicationId:string,file:File,note:string){const form=new FormData();form.set('workflowAction','uploadSop');form.set('applicationId',applicationId);form.set('note',note);form.set('file',file);const response=await fetch('/api/workflow',{method:'POST',body:form}),body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'SOP upload failed.');return body}
export async function uploadOfferLetterFn(applicationId:string,offerType:'CONDITIONAL'|'UNCONDITIONAL',file:File){const form=new FormData();form.set('workflowAction','uploadOfferLetter');form.set('applicationId',applicationId);form.set('offerType',offerType);form.set('file',file);const response=await fetch('/api/workflow',{method:'POST',body:form}),body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Offer letter upload failed.');return body}
export async function acceptStudentOfferFn({applicationId,acknowledgmentLetter,acceptedCourse,file}:{applicationId:string;acknowledgmentLetter:string;acceptedCourse?:string;file?:File|null}){const form=new FormData();form.set('workflowAction','acceptOffer');form.set('applicationId',applicationId);form.set('acknowledgmentLetter',acknowledgmentLetter);if(acceptedCourse)form.set('acceptedCourse',acceptedCourse);if(file)form.set('file',file);const response=await fetch('/api/workflow',{method:'POST',body:form}),body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Offer acceptance failed.');return body}
export const getWorkflowApprovalQueueFn=()=>fetch('/api/workflow?action=approvalQueue').then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error||'Unable to load approvals.');return body})
