import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import type { UserRole } from '@/features/auth/auth.schema'
import type { z } from 'zod'
import type { applicationUpdateSchema, createApplicationSchema } from './workflow.schema'
import type { workflowCaseActionSchema } from './workflow.schema'
import { APPLICATION_WORKFLOW, VISA_WORKFLOW, WORKFLOW_TRANSITIONS, isValidWorkflowTransition } from './workflow.transitions'

const dateOnly = (date: Date | null) => date?.toISOString().slice(0, 10) ?? null

const SUPER_ADMIN_TARGETS=new Set(['SOP_APPROVED','SOP_CORRECTION_REQUIRED','APPLICATION_ACCEPTED','APPLICATION_REJECTED','VISA_APPROVED','VISA_REAPPLY_OR_APPEAL'])

async function assertWorkflowAccess(actor:{id:string;role:UserRole},studentId:string){
  if(actor.role==='SUPER_ADMIN')return
  if(['PARTNER_ADMIN','ADMISSIONS_EXECUTIVE','VISA_EXECUTIVE'].includes(actor.role)){await assertPartnerCanAccessStudent(actor.id,studentId);return}
  throw new Error('FORBIDDEN')
}

export async function readWorkflowCase(actor:{id:string;role:UserRole},applicationId:string,workflowType:'APPLICATION'|'VISA',requestedVisaAttemptId?:string|null){
  const [current]=await prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT a.id,a.student_id AS "studentId",a.program,a.progress,a.next_action AS "nextAction",a.application_stage AS "applicationStage",a.offer_type AS "offerType",ol.id AS "offerLetterId",ol.file_name AS "offerLetterName",a.is_priority AS "isPriority",a.quoted_fee_amount AS "quotedFeeAmount",a.quoted_fee_currency AS "quotedFeeCurrency",a.updated_at AS "updatedAt",a.created_at AS "createdAt",s.name AS "studentName",s.email AS "studentEmail",sp.preferred_intake AS intake,u.name AS "universityName",u.city,c.name AS "countryName" FROM applications a JOIN students s ON s.id=a.student_id LEFT JOIN student_profiles sp ON sp.user_id=s.id JOIN universities u ON u.id=a.university_id JOIN countries c ON c.id=u.country_id LEFT JOIN application_offer_letters ol ON ol.application_id=a.id WHERE a.id=${applicationId}::uuid`)
  if(!current)throw new Error('Application not found.')
  await assertWorkflowAccess(actor,current.studentId)
  if(workflowType==='VISA'&&current.applicationStage!=='MOVE_TO_VISA')throw new Error('Visa workflow is locked until the application reaches Move To Visa.')
  const [siblings,visaAttempts,tasks,documents]=await Promise.all([
    prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT a.id,a.program,a.application_stage AS "applicationStage",a.is_priority AS "isPriority",a.updated_at AS "updatedAt",u.name AS "universityName",c.name AS "countryName" FROM applications a JOIN universities u ON u.id=a.university_id JOIN countries c ON c.id=u.country_id WHERE a.student_id=${current.studentId}::uuid ORDER BY a.is_priority DESC,a.created_at ASC`),
    prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT id,attempt_number AS "attemptNumber",is_current AS "isCurrent",current_stage AS "currentStage",outcome,created_at AS "createdAt" FROM visa_attempts WHERE application_id=${applicationId}::uuid ORDER BY attempt_number DESC`),
    prisma.task.findMany({where:{applicationId},orderBy:{createdAt:'desc'}}),
    prisma.document.findMany({where:{applicationId},orderBy:{createdAt:'desc'}}),
  ])
  const visaAttempt=workflowType==='VISA'?(requestedVisaAttemptId?visaAttempts.find((item:any)=>item.id===requestedVisaAttemptId):visaAttempts.find((item:any)=>item.isCurrent)):null
  const followups=await prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT f.id,f.stage,f.outcome,f.notes,f.expected_completion_at AS "expectedCompletionAt",f.expected_completion_end_at AS "expectedCompletionEndAt",f.next_follow_up_at AS "nextFollowUpAt",f.assigned_staff_id AS "assignedStaffId",f.assigned_staff_name AS "assignedStaffName",f.created_by_name AS "createdByName",f.followed_up_at AS "followedUpAt",f.created_at AS "createdAt",COALESCE(json_agg(json_build_object('id',wf.id,'fileName',wf.file_name,'mimeType',wf.mime_type,'sizeBytes',wf.size_bytes)) FILTER (WHERE wf.id IS NOT NULL),'[]') AS attachments FROM workflow_followups f LEFT JOIN workflow_followup_files wf ON wf.followup_id=f.id WHERE f.application_id=${applicationId}::uuid AND f.workflow_type=${workflowType} AND (${workflowType}='APPLICATION' OR f.visa_attempt_id=${visaAttempt?.id??null}::uuid) GROUP BY f.id ORDER BY f.followed_up_at DESC,f.id DESC`)
  const events=workflowType==='VISA'?await prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT f.id,f.stage,f.outcome,f.notes,f.expected_completion_at AS "expectedCompletionAt",f.expected_completion_end_at AS "expectedCompletionEndAt",f.next_follow_up_at AS "nextFollowUpAt",f.assigned_staff_id AS "assignedStaffId",f.assigned_staff_name AS "assignedStaffName",f.created_by_name AS "createdByName",f.followed_up_at AS "followedUpAt",f.created_at AS "createdAt",v.attempt_number AS "attemptNumber",COALESCE(json_agg(json_build_object('id',wf.id,'fileName',wf.file_name,'mimeType',wf.mime_type,'sizeBytes',wf.size_bytes)) FILTER (WHERE wf.id IS NOT NULL),'[]') AS attachments FROM workflow_followups f JOIN visa_attempts v ON v.id=f.visa_attempt_id LEFT JOIN workflow_followup_files wf ON wf.followup_id=f.id WHERE f.application_id=${applicationId}::uuid AND f.workflow_type='VISA' GROUP BY f.id,v.attempt_number ORDER BY f.followed_up_at DESC,f.id DESC`):followups
  const currentStage=workflowType==='APPLICATION'?current.applicationStage:visaAttempt?.currentStage??'MEET_OFFER_CONDITIONS'
  const stages:string[]=workflowType==='APPLICATION'?[...APPLICATION_WORKFLOW]:[...VISA_WORKFLOW]
  if(workflowType==='APPLICATION'){
    const visited=new Set(followups.map((item:any)=>item.stage))
    if(visited.has('SOP_CORRECTION_REQUIRED')||currentStage==='SOP_CORRECTION_REQUIRED')stages.splice(stages.indexOf('SOP_APPROVED'),0,'SOP_CORRECTION_REQUIRED')
    if(current.offerType==='UNCONDITIONAL')stages[stages.indexOf('CONDITIONAL_OFFER_RECEIVED')]='UNCONDITIONAL_OFFER_RECEIVED'
  }
  return {...current,workflowType,currentStage,stages,validNextStages:WORKFLOW_TRANSITIONS[currentStage]??[],siblings,visaAttempts,selectedVisaAttempt:visaAttempt,tasks,documents,events,canApprove:actor.role==='SUPER_ADMIN',canChangePriority:['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE'].includes(actor.role)}
}

export async function actOnWorkflowCase(actor:{id:string;name:string;role:UserRole},input:z.infer<typeof workflowCaseActionSchema>){
  const detail=await readWorkflowCase(actor,input.applicationId,input.workflowType,input.visaAttemptId)
  const stage=detail.currentStage as string
  const target=input.targetStage
  if(!isValidWorkflowTransition(stage,target))throw new Error(`Invalid transition from ${stage} to ${target}.`)
  if(SUPER_ADMIN_TARGETS.has(target)&&actor.role!=='SUPER_ADMIN')throw new Error('Only Super Admins can record this decision.')
  if(input.workflowType==='APPLICATION'&&['SOP_APPROVED','SOP_CORRECTION_REQUIRED'].includes(target)){
    if(actor.role!=='SUPER_ADMIN'||!input.approvalRequestId)throw new Error('SOP decisions must be completed from the Super Admin approval queue.')
    const pending=await prisma.$queryRaw<Array<{id:string}>>(Prisma.sql`SELECT id FROM workflow_approval_requests WHERE id=${input.approvalRequestId}::uuid AND application_id=${input.applicationId}::uuid AND stage='SOP_VERIFICATION' AND status='PENDING'`)
    if(!pending.length)throw new Error('This SOP approval request is no longer pending.')
  }
  if(input.workflowType==='VISA'&&['VISA_LEVEL_1_VERIFICATION','VISA_LEVEL_2_VERIFICATION'].includes(target)&&actor.role!=='SUPER_ADMIN')throw new Error('Visa verification levels can only be changed through Super Admin approval.')
  if(input.workflowType==='APPLICATION'&&target==='SOP_VERIFICATION'&&stage!==target){
    const [{count}]=await prisma.$queryRaw<Array<{count:bigint}>>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM workflow_followup_files wf JOIN workflow_followups f ON f.id=wf.followup_id WHERE f.application_id=${input.applicationId}::uuid AND f.workflow_type='APPLICATION' AND f.stage IN ('SOP_PREPARATION','SOP_CORRECTION_REQUIRED')`)
    if(Number(count)===0)throw new Error('Attach the prepared SOP before sending it for verification.')
  }
  const offerType=input.offerType??detail.offerType
  if(input.workflowType==='APPLICATION'&&target==='MOVE_TO_VISA'&&!offerType)throw new Error('Select Conditional or Unconditional Offer Received before moving to visa.')
  if(input.workflowType==='APPLICATION'&&offerType&&!detail.offerLetterId)throw new Error('Upload the offer letter before saving the offer outcome.')
  if(!input.note&&target===stage&&!(input.offerType!==undefined&&input.offerType!==detail.offerType))throw new Error('Add notes for this follow-up.')
  let visaAttemptId=detail.selectedVisaAttempt?.id as string|undefined
  let persistedTarget=target==='APPLICATION_REJECTED'?'SOP_APPROVED':target==='APPLICATION_ACCEPTED'?'APPLICATION_FOLLOW_UP':target
  if(input.workflowType==='APPLICATION'&&['APPLICATION_FOLLOW_UP','CONDITIONAL_OFFER_RECEIVED','UNCONDITIONAL_OFFER_RECEIVED'].includes(stage)&&target===stage&&input.offerType)persistedTarget=input.offerType==='CONDITIONAL'?'CONDITIONAL_OFFER_RECEIVED':'UNCONDITIONAL_OFFER_RECEIVED'
  const recordedOutcome=target==='APPLICATION_REJECTED'?'REJECTED':target==='APPLICATION_ACCEPTED'?'ACCEPTED':input.outcome
  await prisma.$transaction(async tx=>{
    if(input.workflowType==='VISA'&&!visaAttemptId){const [created]=await tx.$queryRaw<Array<{id:string}>>(Prisma.sql`INSERT INTO visa_attempts(application_id,attempt_number,is_current,current_stage) VALUES(${input.applicationId}::uuid,1,TRUE,${target}::visa_status) RETURNING id`);visaAttemptId=created.id}
    if(input.workflowType==='VISA'&&stage==='VISA_SUBMISSION'&&target==='VISA_REAPPLY_OR_APPEAL'){
      const restart='VISA_DOCUMENT_COLLECTION'
      await tx.$executeRaw(Prisma.sql`INSERT INTO workflow_followups(student_id,application_id,visa_attempt_id,workflow_type,stage,outcome,notes,created_by_id,created_by_name) VALUES(${detail.studentId}::uuid,${input.applicationId}::uuid,${visaAttemptId}::uuid,'VISA','VISA_REAPPLY_OR_APPEAL','NEW_ATTEMPT',${input.note},${actor.id}::uuid,${actor.name})`)
      await tx.$executeRaw(Prisma.sql`UPDATE visa_attempts SET is_current=FALSE,updated_at=NOW() WHERE application_id=${input.applicationId}::uuid`)
      const [created]=await tx.$queryRaw<Array<{id:string}>>(Prisma.sql`INSERT INTO visa_attempts(application_id,attempt_number,is_current,current_stage) SELECT ${input.applicationId}::uuid,COALESCE(MAX(attempt_number),0)+1,TRUE,${restart}::visa_status FROM visa_attempts WHERE application_id=${input.applicationId}::uuid RETURNING id`);visaAttemptId=created.id
      persistedTarget=restart
    }
    if(input.workflowType==='APPLICATION')await tx.$executeRaw(Prisma.sql`UPDATE applications SET application_stage=${persistedTarget}::application_status,offer_type=COALESCE(${input.offerType??null}::offer_type,offer_type),updated_at=NOW() WHERE id=${input.applicationId}::uuid`)
    else await tx.$executeRaw(Prisma.sql`UPDATE visa_attempts SET current_stage=${persistedTarget}::visa_status,outcome=${input.outcome??null},updated_at=NOW() WHERE id=${visaAttemptId}::uuid`)
    const applicationSummary:Record<string,{progress:number;nextAction:string}>={SOP_APPROVED:{progress:25,nextAction:'SOP Approved'},APPLICATION_SUBMISSION:{progress:35,nextAction:'Prepare application submission'},APPLICATION_ACCEPTED:{progress:60,nextAction:'Application follow-up'},APPLICATION_FOLLOW_UP:{progress:70,nextAction:'Application follow-up in progress'},CONDITIONAL_OFFER_RECEIVED:{progress:90,nextAction:'Meet conditional offer requirements'},UNCONDITIONAL_OFFER_RECEIVED:{progress:90,nextAction:'Unconditional offer received'},MOVE_TO_VISA:{progress:100,nextAction:'Continue to visa process'}}
    const visaSummary:Record<string,{nextAction:string}>={VISA_DOCUMENT_COLLECTION:{nextAction:'Collect visa documents'},VISA_SLOT_BOOKING:{nextAction:'Book visa appointment'},VISA_SUBMISSION:{nextAction:'Awaiting visa decision'},VISA_REAPPLY_OR_APPEAL:{nextAction:'Choose appeal or reapplication'},VISA_GRANTED:{nextAction:'Visa granted'}}
    const summary=input.workflowType==='APPLICATION'?applicationSummary[persistedTarget]:visaSummary[persistedTarget]
    if(summary)await tx.application.update({where:{id:input.applicationId},data:summary})
    const [followup]=await tx.$queryRaw<Array<{id:string}>>(Prisma.sql`INSERT INTO workflow_followups(student_id,application_id,visa_attempt_id,workflow_type,stage,outcome,notes,expected_completion_at,expected_completion_end_at,next_follow_up_at,assigned_staff_id,assigned_staff_name,created_by_id,created_by_name) VALUES(${detail.studentId}::uuid,${input.applicationId}::uuid,${visaAttemptId??null}::uuid,${input.workflowType},${persistedTarget},${recordedOutcome??null},${input.note},${input.expectedCompletionAt?new Date(input.expectedCompletionAt):null},${input.expectedCompletionEndAt?new Date(input.expectedCompletionEndAt):null},${input.nextFollowUpAt?new Date(input.nextFollowUpAt):null},${input.assignedStaffId??null}::uuid,${input.assignedStaffName??null},${actor.id}::uuid,${actor.name}) RETURNING id`)
    if(input.workflowType==='APPLICATION'&&stage!=='SOP_VERIFICATION'&&persistedTarget==='SOP_VERIFICATION')await tx.$executeRaw(Prisma.sql`INSERT INTO workflow_approval_requests(student_id,application_id,followup_id,stage,requested_by_id,requested_by_name) VALUES(${detail.studentId}::uuid,${input.applicationId}::uuid,${followup.id}::uuid,'SOP_VERIFICATION',${actor.id}::uuid,${actor.name})`)
    if(input.workflowType==='APPLICATION'&&stage==='SOP_VERIFICATION'&&['SOP_APPROVED','SOP_CORRECTION_REQUIRED'].includes(persistedTarget))await tx.$executeRaw(Prisma.sql`UPDATE workflow_approval_requests SET status=${persistedTarget==='SOP_APPROVED'?'APPROVED':'REJECTED'},reviewed_by_id=${actor.id}::uuid,reviewed_by_name=${actor.name},review_note=${input.note},reviewed_at=NOW() WHERE id=${input.approvalRequestId}::uuid AND status='PENDING'`)
    const requestedVisaStage=persistedTarget==='VISA_SLOT_BOOKING'?'VISA_LEVEL_1_VERIFICATION':persistedTarget==='VISA_LEVEL_1_VERIFICATION'?'VISA_LEVEL_2_VERIFICATION':null
    if(input.workflowType==='VISA'&&requestedVisaStage)await tx.$executeRaw(Prisma.sql`INSERT INTO workflow_approval_requests(student_id,application_id,followup_id,workflow_type,visa_attempt_id,stage,requested_by_id,requested_by_name) SELECT ${detail.studentId}::uuid,${input.applicationId}::uuid,${followup.id}::uuid,'VISA',${visaAttemptId}::uuid,${requestedVisaStage},${actor.id}::uuid,${actor.name} WHERE NOT EXISTS(SELECT 1 FROM workflow_approval_requests WHERE visa_attempt_id=${visaAttemptId}::uuid AND stage=${requestedVisaStage} AND status='PENDING')`)
    if(input.workflowType==='VISA'&&input.approvalStage&&actor.role==='SUPER_ADMIN')await tx.$executeRaw(Prisma.sql`UPDATE workflow_approval_requests SET status=${input.outcome==='REJECTED'?'REJECTED':'APPROVED'},reviewed_by_id=${actor.id}::uuid,reviewed_by_name=${actor.name},review_note=${input.note},reviewed_at=NOW() WHERE visa_attempt_id=${visaAttemptId}::uuid AND stage=${input.approvalStage} AND status='PENDING'`)
    if(input.workflowType==='APPLICATION'&&target==='MOVE_TO_VISA'){
      const [attempt]=await tx.$queryRaw<Array<{id:string}>>(Prisma.sql`INSERT INTO visa_attempts(application_id,attempt_number,is_current,current_stage) SELECT ${input.applicationId}::uuid,1,TRUE,'MEET_OFFER_CONDITIONS' WHERE NOT EXISTS(SELECT 1 FROM visa_attempts WHERE application_id=${input.applicationId}::uuid AND is_current=TRUE) RETURNING id`)
      if(attempt)await tx.$executeRaw(Prisma.sql`INSERT INTO workflow_followups(student_id,application_id,visa_attempt_id,workflow_type,stage,notes,created_by_id,created_by_name) VALUES(${detail.studentId}::uuid,${input.applicationId}::uuid,${attempt.id}::uuid,'VISA','MEET_OFFER_CONDITIONS','Visa workflow activated from accepted application.',${actor.id}::uuid,${actor.name})`)
    }
    await tx.auditLog.create({data:{actorId:actor.id,action:`${input.workflowType}_FOLLOW_UP_CREATED`,entityType:`${input.workflowType.toLowerCase()}_workflow`,entityId:input.applicationId,metadata:{from:stage,to:persistedTarget,outcome:input.outcome,note:input.note,visaAttemptId,reapplyMode:input.reapplyMode}}})
  })
  return readWorkflowCase(actor,input.applicationId,input.workflowType,visaAttemptId)
}

export async function uploadSopFile(actor:{id:string;name:string;role:UserRole},applicationId:string,file:File,note:string){
  const detail=await readWorkflowCase(actor,applicationId,'APPLICATION')
  if(!['SOP_PREPARATION','SOP_CORRECTION_REQUIRED'].includes(detail.currentStage))throw new Error('SOP files can only be attached during SOP Preparation or correction.')
  if(file.size<=0||file.size>10*1024*1024)throw new Error('The SOP file must be between 1 byte and 10 MB.')
  const allowed=new Set(['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
  if(!allowed.has(file.type))throw new Error('Upload a PDF, DOC, or DOCX SOP file.')
  const bytes=Buffer.from(await file.arrayBuffer())
  await prisma.$transaction(async tx=>{
    await tx.$executeRaw(Prisma.sql`DELETE FROM workflow_followup_files wf USING workflow_followups f WHERE wf.followup_id=f.id AND f.application_id=${applicationId}::uuid AND f.workflow_type='APPLICATION'`)
    const [followup]=await tx.$queryRaw<Array<{id:string}>>(Prisma.sql`INSERT INTO workflow_followups(student_id,application_id,workflow_type,stage,notes,created_by_id,created_by_name) VALUES(${detail.studentId}::uuid,${applicationId}::uuid,'APPLICATION',${detail.currentStage},${note||'SOP file attached.'},${actor.id}::uuid,${actor.name}) RETURNING id`)
    await tx.$executeRaw(Prisma.sql`INSERT INTO workflow_followup_files(followup_id,file_name,mime_type,size_bytes,file_data) VALUES(${followup.id}::uuid,${file.name},${file.type},${file.size},${bytes})`)
  })
  return readWorkflowCase(actor,applicationId,'APPLICATION')
}

export async function uploadOfferLetter(actor:{id:string;name:string;role:UserRole},applicationId:string,offerType:'CONDITIONAL'|'UNCONDITIONAL',file:File){
  const detail=await readWorkflowCase(actor,applicationId,'APPLICATION')
  if(!['APPLICATION_FOLLOW_UP','CONDITIONAL_OFFER_RECEIVED','UNCONDITIONAL_OFFER_RECEIVED'].includes(detail.currentStage))throw new Error('Offer letters can only be uploaded during the offer follow-up stages.')
  if(file.size<=0||file.size>10*1024*1024)throw new Error('The offer letter must be between 1 byte and 10 MB.')
  const allowed=new Set(['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
  if(!allowed.has(file.type))throw new Error('Upload a PDF, DOC, or DOCX offer letter.')
  const bytes=Buffer.from(await file.arrayBuffer())
  await prisma.$executeRaw(Prisma.sql`INSERT INTO application_offer_letters(application_id,offer_type,file_name,mime_type,size_bytes,file_data,uploaded_by_id,uploaded_by_name) VALUES(${applicationId}::uuid,${offerType}::offer_type,${file.name},${file.type},${file.size},${bytes},${actor.id}::uuid,${actor.name}) ON CONFLICT(application_id) DO UPDATE SET offer_type=EXCLUDED.offer_type,file_name=EXCLUDED.file_name,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,file_data=EXCLUDED.file_data,uploaded_by_id=EXCLUDED.uploaded_by_id,uploaded_by_name=EXCLUDED.uploaded_by_name,updated_at=NOW()`)
  return {applicationId,fileName:file.name,offerType}
}

export async function readWorkflowFile(actor:{id:string;role:UserRole},fileId:string){
  const [file]=await prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT wf.file_name AS "fileName",wf.mime_type AS "mimeType",wf.file_data AS "fileData",f.student_id AS "studentId" FROM workflow_followup_files wf JOIN workflow_followups f ON f.id=wf.followup_id WHERE wf.id=${fileId}::uuid`)
  if(!file)throw new Error('SOP file not found.')
  await assertWorkflowAccess(actor,file.studentId);return file
}

export async function readOfferLetterFile(actor:{id:string;role:UserRole},fileId:string){
  const [file]=await prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT ol.file_name AS "fileName",ol.mime_type AS "mimeType",ol.file_data AS "fileData",a.student_id AS "studentId" FROM application_offer_letters ol JOIN applications a ON a.id=ol.application_id WHERE ol.id=${fileId}::uuid`)
  if(!file)throw new Error('Offer letter not found.')
  await assertWorkflowAccess(actor,file.studentId);return file
}

export async function readWorkflowApprovalQueue(actor:{role:UserRole}){
  if(actor.role!=='SUPER_ADMIN')return []
  return prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT r.id,r.application_id AS "applicationId",r.workflow_type AS "workflowType",r.visa_attempt_id AS "visaAttemptId",v.current_stage AS "currentStage",r.stage,r.created_at AS "createdAt",r.requested_by_name AS "requestedByName",s.name AS "studentName",a.program,u.name AS "universityName",sop.id AS "fileId",sop.file_name AS "fileName",sop.mime_type AS "mimeType",sop.size_bytes AS "fileSize" FROM workflow_approval_requests r JOIN students s ON s.id=r.student_id JOIN applications a ON a.id=r.application_id JOIN universities u ON u.id=a.university_id LEFT JOIN visa_attempts v ON v.id=r.visa_attempt_id LEFT JOIN LATERAL (SELECT wf.id,wf.file_name,wf.mime_type,wf.size_bytes FROM workflow_followup_files wf JOIN workflow_followups f ON f.id=wf.followup_id WHERE f.application_id=r.application_id ORDER BY wf.created_at DESC LIMIT 1) sop ON r.workflow_type='APPLICATION' WHERE r.status='PENDING' ORDER BY r.created_at ASC`)
}

export async function setPriorityApplication(actor:{id:string;name:string;role:UserRole},applicationId:string){
  if(!['SUPER_ADMIN','PARTNER_ADMIN','ADMISSIONS_EXECUTIVE'].includes(actor.role))throw new Error('FORBIDDEN')
  const application=await prisma.application.findUnique({where:{id:applicationId},select:{studentId:true}});if(!application)throw new Error('Application not found.')
  await assertWorkflowAccess(actor,application.studentId)
  await prisma.$transaction(async tx=>{await tx.$executeRaw(Prisma.sql`UPDATE applications SET is_priority=FALSE WHERE student_id=${application.studentId}::uuid`);await tx.$executeRaw(Prisma.sql`UPDATE applications SET is_priority=TRUE WHERE id=${applicationId}::uuid`);await tx.auditLog.create({data:{actorId:actor.id,action:'PRIORITY_APPLICATION_CHANGED',entityType:'application',entityId:applicationId,metadata:{studentId:application.studentId}}})})
  return {applicationId,studentId:application.studentId}
}

export async function createApplication(userId: string, input: z.infer<typeof createApplicationSchema>) {
  await assertRequiredDocumentsVerified(userId)
  const shortlisted = await prisma.studentShortlist.findUnique({
    where: { userId_universityId: { userId, universityId: input.universityId } },
    select: { universityId: true },
  })
  if (!shortlisted) throw new Error('Add the university to your shortlist first.')
  const application = await prisma.application.create({
    data: {
      studentId: userId,
      universityId: input.universityId,
      program: input.program,
      applicationDeadline: input.deadline ? new Date(`${input.deadline}T00:00:00.000Z`) : null,
    },
  })
  await prisma.$executeRaw(Prisma.sql`UPDATE applications SET is_priority=TRUE WHERE id=${application.id}::uuid AND (SELECT COUNT(*) FROM applications WHERE student_id=${userId}::uuid)=1`)
  await snapshotCourseFee(application.id, input.universityId, input.program)
  return application
}

async function snapshotCourseFee(applicationId: string, universityId: string, program: string) {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE applications a SET
      course_id = priced.course_id, quoted_fee_amount = priced.amount,
      quoted_fee_currency = priced.currency_code, fee_quoted_at = NOW()
    FROM (
      SELECT c.id AS course_id, f.amount, f.currency_code
      FROM courses c JOIN course_fees f ON f.course_id = c.id
      WHERE c.university_id = ${universityId} AND LOWER(c.name) = LOWER(${program})
        AND c.active = TRUE AND f.effective_from <= NOW()
        AND (f.effective_to IS NULL OR f.effective_to > NOW())
      ORDER BY f.effective_from DESC LIMIT 1
    ) priced WHERE a.id = ${applicationId}::uuid
  `)
}

async function assertPartnerCanAccessStudent(actorId: string, studentId: string) {
  const partner = await prisma.partner.findUnique({
    where: { id: actorId },
    select: { partnerCompanyId: true, partnerCompany: { select: { status: true } } },
  })
  if (!partner || partner.partnerCompany.status !== 'APPROVED') throw new Error('FORBIDDEN')
  const [student] = await prisma.$queryRaw<Array<{ assignedPartnerCompanyId: string | null }>>(Prisma.sql`
    SELECT assigned_partner_company_id AS "assignedPartnerCompanyId"
    FROM students
    WHERE id = ${studentId}::uuid
  `)
  if (!student || student.assignedPartnerCompanyId !== partner.partnerCompanyId) throw new Error('FORBIDDEN')
}

export async function createApplicationForStudent(
  actor: { id: string; role: UserRole; accountType: 'ADMIN' | 'PARTNER' | 'STUDENT' },
  input: { studentId: string; universityId: string; program: string; deadline?: string },
) {
  if (actor.accountType === 'PARTNER') await assertPartnerCanAccessStudent(actor.id, input.studentId)
  else if (actor.accountType !== 'ADMIN') throw new Error('FORBIDDEN')
  await assertRequiredDocumentsVerified(input.studentId)
  const duplicate = await prisma.application.findFirst({
    where: { studentId: input.studentId, universityId: input.universityId, program: input.program },
    select: { id: true },
  })
  if (duplicate) throw new Error('An application for this university and program already exists.')
  const application = await prisma.$transaction(async (tx) => {
    const created = await tx.application.create({
      data: {
        studentId: input.studentId,
        universityId: input.universityId,
        program: input.program,
        applicationDeadline: input.deadline ? new Date(`${input.deadline}T00:00:00.000Z`) : null,
        admissionsExecutiveId: actor.role === 'ADMISSIONS_EXECUTIVE' ? actor.id : null,
        visaExecutiveId: actor.role === 'VISA_EXECUTIVE' ? actor.id : null,
      },
    })
    await tx.$executeRaw(Prisma.sql`
      UPDATE applications a SET course_id=priced.course_id, quoted_fee_amount=priced.amount,
        quoted_fee_currency=priced.currency_code, fee_quoted_at=NOW()
      FROM (SELECT c.id course_id, f.amount, f.currency_code FROM courses c JOIN course_fees f ON f.course_id=c.id
        WHERE c.university_id=${input.universityId} AND LOWER(c.name)=LOWER(${input.program}) AND c.active=TRUE
          AND f.effective_from<=NOW() AND (f.effective_to IS NULL OR f.effective_to>NOW()) ORDER BY f.effective_from DESC LIMIT 1) priced
      WHERE a.id=${created.id}::uuid
    `)
    await tx.$executeRaw(Prisma.sql`UPDATE applications SET is_priority=TRUE WHERE id=${created.id}::uuid AND (SELECT COUNT(*) FROM applications WHERE student_id=${input.studentId}::uuid)=1`)
    await tx.auditLog.create({
      data: {
        actorId: actor.id, action: 'APPLICATION_CREATED', entityType: 'application',
        entityId: created.id, metadata: { studentId: input.studentId },
      },
    })
    return created
  })
  return application
}

export async function updateApplication(
  actor: { id: string; role: UserRole },
  input: z.infer<typeof applicationUpdateSchema>,
) {
  const current = await prisma.application.findUnique({ where: { id: input.applicationId } })
  if (!current) throw new Error('Application not found.')

  if (actor.role === 'ADMISSIONS_EXECUTIVE') {
    await assertPartnerCanAccessStudent(actor.id, current.studentId)
    if (input.visaExecutiveId !== undefined) throw new Error('FORBIDDEN')
  } else if (actor.role === 'VISA_EXECUTIVE') {
    await assertPartnerCanAccessStudent(actor.id, current.studentId)
    if (input.admissionsExecutiveId !== undefined) throw new Error('FORBIDDEN')
  } else if (actor.role === 'PARTNER_ADMIN') {
    await assertPartnerCanAccessStudent(actor.id, current.studentId)
    if (input.admissionsExecutiveId !== undefined || input.visaExecutiveId !== undefined) throw new Error('FORBIDDEN')
  } else if (actor.role !== 'SUPER_ADMIN') {
    throw new Error('FORBIDDEN')
  }

  const { applicationId, ...changes } = input
  return prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: changes,
    })
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'APPLICATION_UPDATED',
        entityType: 'application',
        entityId: applicationId,
        metadata: changes as Prisma.InputJsonValue,
      },
    })
    return updated
  })
}

export async function readStudentDashboard(userId: string) {
  const [applicationRows, taskRows, documentRows, deadlineRows, notificationRows, profile, shortlist] = await Promise.all([
    prisma.application.findMany({
      where: { studentId: userId },
      include: { university: true },
    }),
    prisma.task.findMany({ where: { userId } }),
    prisma.document.findMany({ where: { userId } }),
    prisma.deadline.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.studentShortlist.findMany({ where: { userId }, select: { universityId: true } }),
  ])
  const visaStages=applicationRows.length?await prisma.$queryRaw<Array<{applicationId:string;currentStage:string}>>(Prisma.sql`SELECT application_id AS "applicationId",current_stage AS "currentStage" FROM visa_attempts WHERE is_current=TRUE AND application_id IN (${Prisma.join(applicationRows.map(row=>Prisma.sql`${row.id}::uuid`))})`):[]
  const visaStageByApplication=new Map(visaStages.map(item=>[item.applicationId,item.currentStage]))
  const destination = profile?.destinationCountry as { id?: string } | null
  const recommendationRows = destination?.id && profile?.field
    ? await prisma.university.findMany({
        where: {
          active: true,
          countryId: destination.id,
          id: { notIn: shortlist.map((item) => item.universityId) },
          courses: { some: { active: true, name: { equals: profile.field, mode: 'insensitive' } } },
        },
        select: { id: true, name: true, city: true, countryId: true, rank: true, tuition: true, acceptance: true, knownFor: true },
        orderBy: [{ rank: 'asc' }, { name: 'asc' }],
        take: 50,
      })
    : []
  return {
    applications: applicationRows.map(({ university, ...application }) => ({
      id: application.id,
      universityId: university.id,
      universityName: university.name,
      city: university.city,
      rank: university.rank,
      program: application.program,
      status: application.applicationStage,
      visaStatus: visaStageByApplication.get(application.id)??null,
      progress: application.progress,
      nextAction: application.nextAction,
      deadline: dateOnly(application.applicationDeadline),
    })),
    tasks: taskRows.map((task) => ({ ...task, dueDate: dateOnly(task.dueDate) })),
    documents: documentRows,
    deadlines: deadlineRows.map((deadline) => ({ ...deadline, dueDate: dateOnly(deadline.dueDate)! })),
    notifications: notificationRows.map((notice) => ({ ...notice, createdAt: notice.createdAt.toISOString() })),
    recommendations: recommendationRows,
  }
}

export async function setTaskCompleted(userId: string, taskId: string, completed: boolean) {
  const result = await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: { completed },
  })
  if (!result.count) throw new Error('Task not found.')
  return prisma.task.findUniqueOrThrow({ where: { id: taskId } })
}

const requiredDocumentNames: Record<string, string> = {
  passport: 'Passport',
  'passport-photo': 'Passport-size photograph',
  cv: 'CV or résumé',
  aadhaar: 'Aadhaar',
  '10th-certificate': '10th certificate / mark sheet',
  '12th-certificate': '12th certificate / mark sheet',
}

async function assertRequiredDocumentsVerified(userId: string) {
  const names = Object.values(requiredDocumentNames)
  const verified = await prisma.document.count({
    where: { userId, name: { in: names }, status: 'VERIFIED' },
  })
  if (verified !== names.length) {
    throw new Error('All required documents must be verified before an application can be created.')
  }
}

let documentFilesReady:Promise<void>|undefined
function ensureDocumentFiles(){documentFilesReady??=(async()=>{await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS document_files (document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,file_name TEXT NOT NULL,mime_type TEXT NOT NULL,size_bytes INTEGER NOT NULL,file_data BYTEA NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)})();return documentFilesReady}

export async function uploadRequiredDocument(userId:string,documentType:string,file:File) {
  const name=requiredDocumentNames[documentType]
  if(!name) throw new Error('Unknown required document type.')
  if(file.size>10*1024*1024) throw new Error('Files must be 10 MB or smaller.')
  await ensureDocumentFiles()
  const bytes=Buffer.from(await file.arrayBuffer())
  const existing=await prisma.document.findFirst({where:{userId,name}})
  const document=existing?await prisma.document.update({where:{id:existing.id},data:{status:'PENDING',note:'Uploaded and awaiting verification.',storageKey:`db:${existing.id}`,verifiedBy:null}}):await prisma.document.create({data:{userId,name,status:'PENDING',note:'Uploaded and awaiting verification.'}})
  await prisma.$executeRaw(Prisma.sql`INSERT INTO document_files(document_id,file_name,mime_type,size_bytes,file_data) VALUES(${document.id}::uuid,${file.name},${file.type||'application/octet-stream'},${file.size},${bytes}) ON CONFLICT(document_id) DO UPDATE SET file_name=EXCLUDED.file_name,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,file_data=EXCLUDED.file_data,updated_at=NOW()`)
  if(!document.storageKey) await prisma.document.update({where:{id:document.id},data:{storageKey:`db:${document.id}`}})
  return {...document,fileName:file.name,size:file.size}
}

export async function readDocumentFile(
  documentId: string,
  actor: { id: string; accountType: 'ADMIN' | 'PARTNER' | 'STUDENT' },
) {
  await ensureDocumentFiles()
  const [file] = await prisma.$queryRaw<Array<{ userId: string; fileName: string; mimeType: string; fileData: Uint8Array }>>(Prisma.sql`
    SELECT d.user_id AS "userId", f.file_name AS "fileName", f.mime_type AS "mimeType", f.file_data AS "fileData"
    FROM document_files f
    JOIN documents d ON d.id = f.document_id
    WHERE f.document_id = ${documentId}::uuid
  `)
  if(!file) throw new Error('Document file not found.')
  if (actor.accountType === 'STUDENT' && file.userId !== actor.id) throw new Error('FORBIDDEN')
  if (actor.accountType === 'PARTNER') await assertPartnerCanAccessStudent(actor.id, file.userId)
  return file
}

export async function reviewDocument(
  actor: { id: string; accountType: 'ADMIN' | 'PARTNER' | 'STUDENT' },
  documentId: string,
  status: 'VERIFIED' | 'NEEDED',
  note: string,
) {
  const current = await prisma.document.findUnique({ where: { id: documentId }, select: { userId: true } })
  if (!current) throw new Error('Document not found.')
  if (actor.accountType === 'PARTNER') await assertPartnerCanAccessStudent(actor.id, current.userId)
  else if (actor.accountType !== 'ADMIN') throw new Error('FORBIDDEN')
  const document=await prisma.document.update({where:{id:documentId},data:{status,note:note||(status==='VERIFIED'?'Verified by staff.':'A replacement file is required.'),verifiedBy:actor.accountType==='PARTNER'&&status==='VERIFIED'?actor.id:null}})
  await prisma.auditLog.create({data:{actorId:actor.id,action:status==='VERIFIED'?'DOCUMENT_VERIFIED':'DOCUMENT_REJECTED',entityType:'document',entityId:documentId,metadata:{note}}})
  return document
}
