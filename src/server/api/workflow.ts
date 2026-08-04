import { assertRole, requireUser } from '@/features/auth/authorization.server'
import { applicationUpdateSchema, createApplicationSchema, priorityApplicationSchema, staffCreateApplicationSchema, taskToggleSchema, workflowCaseActionSchema } from '@/features/workflow/workflow.schema'
import { actOnWorkflowCase, createApplication, createApplicationForStudent, readDocumentFile, readOfferLetterFile, readStudentDashboard, readWorkflowApprovalQueue, readWorkflowCase, readWorkflowFile, reviewDocument, setPriorityApplication, setTaskCompleted, updateApplication, uploadOfferLetter, uploadRequiredDocument, uploadSopFile } from '@/features/workflow/workflow.server'
import { apiError } from '@/lib/api'

export async function GET(request?:Request) {
  try {
    const user = await requireUser()
    const url=request?new URL(request.url):null
    const documentId=url?.searchParams.get('documentId')
    if(documentId){const file=await readDocumentFile(documentId,user);const fileName=file.fileName.replace(/["\r\n]/g,'');return new Response(file.fileData as BodyInit,{headers:{'content-type':file.mimeType,'content-disposition':`attachment; filename="${fileName}"`,'x-content-type-options':'nosniff'}})}
    const workflowFileId=url?.searchParams.get('workflowFileId')
    if(workflowFileId){assertRole(user.role,['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE','VISA_EXECUTIVE']);const file=await readWorkflowFile(user,workflowFileId);const fileName=file.fileName.replace(/["\r\n]/g,'');const isPdf=file.mimeType==='application/pdf'||fileName.toLowerCase().endsWith('.pdf');const disposition=url?.searchParams.get('preview')==='1'&&isPdf?'inline':'attachment';return new Response(file.fileData as BodyInit,{headers:{'content-type':isPdf?'application/pdf':file.mimeType,'content-disposition':`${disposition}; filename="${fileName}"`,'x-content-type-options':'nosniff','cache-control':'private, no-store'}})}
    const offerLetterId=url?.searchParams.get('offerLetterId')
    if(offerLetterId){assertRole(user.role,['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE','VISA_EXECUTIVE']);const file=await readOfferLetterFile(user,offerLetterId);const fileName=file.fileName.replace(/["\r\n]/g,'');const isPdf=file.mimeType==='application/pdf'||fileName.toLowerCase().endsWith('.pdf');const disposition=url?.searchParams.get('preview')==='1'&&isPdf?'inline':'attachment';return new Response(file.fileData as BodyInit,{headers:{'content-type':isPdf?'application/pdf':file.mimeType,'content-disposition':`${disposition}; filename="${fileName}"`,'x-content-type-options':'nosniff','cache-control':'private, no-store'}})}
    if(url?.searchParams.get('action')==='approvalQueue'){assertRole(user.role,['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE','VISA_EXECUTIVE']);return Response.json(await readWorkflowApprovalQueue(user))}
    if(url?.searchParams.get('action')==='workflowCase'){
      assertRole(user.role,['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE','VISA_EXECUTIVE'])
      const workflowType=url.searchParams.get('workflowType')
      if(workflowType!=='APPLICATION'&&workflowType!=='VISA')throw new Error('Invalid workflow type.')
      return Response.json(await readWorkflowCase(user,String(url.searchParams.get('applicationId')||''),workflowType,url.searchParams.get('visaAttemptId')))
    }
    assertRole(user.role, ['STUDENT'])
    return Response.json(await readStudentDashboard(user.id))
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    if(request.headers.get('content-type')?.includes('multipart/form-data')){const form=await request.formData(),file=form.get('file');if(!(file instanceof File))throw new Error('Select a file to upload.');if(form.get('workflowAction')==='uploadSop'){assertRole(user.role,['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE']);return Response.json(await uploadSopFile(user,String(form.get('applicationId')||''),file,String(form.get('note')||'')))}if(form.get('workflowAction')==='uploadOfferLetter'){assertRole(user.role,['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE']);const offerType=String(form.get('offerType'));if(offerType!=='CONDITIONAL'&&offerType!=='UNCONDITIONAL')throw new Error('Select an offer type.');return Response.json(await uploadOfferLetter(user,String(form.get('applicationId')||''),offerType,file))}assertRole(user.role,['STUDENT']);return Response.json(await uploadRequiredDocument(user.id,String(form.get('documentType')||''),file))}
    const body = await request.json()
    if(body.action==='workflowCaseAction'){
      assertRole(user.role,['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE','VISA_EXECUTIVE'])
      return Response.json(await actOnWorkflowCase(user,workflowCaseActionSchema.parse(body.data)))
    }
    if(body.action==='setPriorityApplication'){
      assertRole(user.role,['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE'])
      return Response.json(await setPriorityApplication(user,priorityApplicationSchema.parse(body.data).applicationId))
    }
    if(body.action==='reviewDocument'){
      assertRole(user.role,['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE','VISA_EXECUTIVE'])
      const status=body.data?.status
      if(status!=='VERIFIED'&&status!=='NEEDED') throw new Error('Invalid document review status.')
      return Response.json(await reviewDocument(user,String(body.data?.documentId||''),status,String(body.data?.note||'')))
    }
    if (body.action === 'createApplication') {
      assertRole(user.role, ['STUDENT'])
      return Response.json(await createApplication(user.id, createApplicationSchema.parse(body.data)))
    }
    if (body.action === 'toggleTask') {
      assertRole(user.role, ['STUDENT'])
      const data = taskToggleSchema.parse(body.data)
      return Response.json(await setTaskCompleted(user.id, data.taskId, data.completed))
    }
    if (body.action === 'updateApplication') {
      assertRole(user.role, ['SUPER_ADMIN', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE'])
      return Response.json(await updateApplication(user, applicationUpdateSchema.parse(body.data)))
    }
    if (body.action === 'staffCreateApplication') {
      assertRole(user.role, ['SUPER_ADMIN', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE', 'RECEPTION_EXECUTIVE'])
      return Response.json(await createApplicationForStudent(user, staffCreateApplicationSchema.parse(body.data)))
    }
    return Response.json({ error: 'Unknown workflow action.' }, { status: 400 })
  } catch (error) {
    return apiError(error)
  }
}
