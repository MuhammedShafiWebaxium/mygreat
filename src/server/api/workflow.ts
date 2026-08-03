import { assertRole, requireUser } from '@/features/auth/authorization.server'
import { applicationUpdateSchema, createApplicationSchema, staffCreateApplicationSchema, taskToggleSchema } from '@/features/workflow/workflow.schema'
import { createApplication, createApplicationForStudent, readDocumentFile, readStudentDashboard, reviewDocument, setTaskCompleted, updateApplication, uploadRequiredDocument } from '@/features/workflow/workflow.server'
import { apiError } from '@/lib/api'

export async function GET(request?:Request) {
  try {
    const user = await requireUser()
    const documentId=request?new URL(request.url).searchParams.get('documentId'):null
    if(documentId){const file=await readDocumentFile(documentId,user);const fileName=file.fileName.replace(/["\r\n]/g,'');return new Response(file.fileData as BodyInit,{headers:{'content-type':file.mimeType,'content-disposition':`attachment; filename="${fileName}"`,'x-content-type-options':'nosniff'}})}
    assertRole(user.role, ['STUDENT'])
    return Response.json(await readStudentDashboard(user.id))
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    if(request.headers.get('content-type')?.includes('multipart/form-data')){assertRole(user.role,['STUDENT']);const form=await request.formData(),file=form.get('file');if(!(file instanceof File))throw new Error('Select a file to upload.');return Response.json(await uploadRequiredDocument(user.id,String(form.get('documentType')||''),file))}
    const body = await request.json()
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
