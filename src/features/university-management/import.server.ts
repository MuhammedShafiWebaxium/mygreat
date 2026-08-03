import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import { courseSchema } from './university.schema'
import { saveCourse } from './university.server'

export type ImportJob = { id:string; entityType:string; fileName:string; totalRows:number; processedRows:number; createdRows:number; updatedRows:number; skippedRows:number; failedRows:number; status:string; createdAt:Date; completedAt:Date|null }
type CourseRow = Record<string,string>
let schemaReady: Promise<void> | undefined

function ensureImportSchema() {
  schemaReady ??= (async()=>{
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS catalog_import_jobs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),actor_id UUID NOT NULL,entity_type TEXT NOT NULL,file_name TEXT NOT NULL,total_rows INTEGER NOT NULL DEFAULT 0,processed_rows INTEGER NOT NULL DEFAULT 0,created_rows INTEGER NOT NULL DEFAULT 0,updated_rows INTEGER NOT NULL DEFAULT 0,skipped_rows INTEGER NOT NULL DEFAULT 0,failed_rows INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'PROCESSING',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),completed_at TIMESTAMPTZ)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS catalog_import_jobs_actor_created_idx ON catalog_import_jobs(actor_id,created_at DESC)`)
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS catalog_import_errors (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),job_id UUID NOT NULL REFERENCES catalog_import_jobs(id) ON DELETE CASCADE,row_number INTEGER NOT NULL,message TEXT NOT NULL,row_data JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS catalog_import_errors_job_row_idx ON catalog_import_errors(job_id,row_number)`)
    await prisma.$executeRawUnsafe(`ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_university_id_code_key`)
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS courses_source_id_unique`)
    await prisma.$executeRawUnsafe(`ALTER TABLE courses DROP COLUMN IF EXISTS source_id`)
  })()
  return schemaReady
}

export async function createCourseImportJob(actorId:string,fileName:string,totalRows:number) {
  await ensureImportSchema()
  const [job]=await prisma.$queryRaw<ImportJob[]>(Prisma.sql`INSERT INTO catalog_import_jobs(actor_id,entity_type,file_name,total_rows) VALUES(${actorId}::uuid,'courses',${fileName},${totalRows}) RETURNING id,entity_type AS "entityType",file_name AS "fileName",total_rows AS "totalRows",processed_rows AS "processedRows",created_rows AS "createdRows",updated_rows AS "updatedRows",skipped_rows AS "skippedRows",failed_rows AS "failedRows",status,created_at AS "createdAt",completed_at AS "completedAt"`)
  return job
}

export async function processCourseImportBatch(actorId:string,jobId:string,startRow:number,rows:CourseRow[]) {
  await ensureImportSchema()
  const [job]=await prisma.$queryRaw<Array<{id:string;totalRows:number;processedRows:number;status:string}>>(Prisma.sql`SELECT id,total_rows AS "totalRows",processed_rows AS "processedRows",status FROM catalog_import_jobs WHERE id=${jobId}::uuid AND actor_id=${actorId}::uuid`)
  if(!job) throw new Error('Import job not found.')
  if(job.status==='COMPLETED') return readImportJob(actorId,jobId)
  const universities=await prisma.$queryRaw<Array<{id:string;name:string}>>(Prisma.sql`SELECT id,name FROM universities WHERE active=TRUE`)
  const universityMap=new Map(universities.map(university=>[university.name.trim().toLowerCase(),university]))
  let created=0,updated=0,failed=0
  for(const [offset,row] of rows.entries()) {
    const rowNumber=startRow+offset
    try {
      const university=universityMap.get(String(row.universityName??'').trim().toLowerCase())
      if(!university) throw new Error(`Unknown university: ${row.universityName||'not provided'}`)
      const parsed=courseSchema.parse({...row,universityId:university.id,durationMonths:Number(row.durationMonths||0),intakeMonth:splitList(row.intakeMonth),active:bool(row.active)})
      await saveCourse(actorId,parsed)
      created++
    } catch(error) {
      failed++
      const message=error instanceof Error?error.message:'Invalid row.'
      await prisma.$executeRaw(Prisma.sql`INSERT INTO catalog_import_errors(job_id,row_number,message,row_data) VALUES(${jobId}::uuid,${rowNumber},${message},${JSON.stringify(row)}::jsonb)`)
    }
  }
  const processed=rows.length
  const [result]=await prisma.$queryRaw<ImportJob[]>(Prisma.sql`UPDATE catalog_import_jobs SET processed_rows=processed_rows+${processed},created_rows=created_rows+${created},updated_rows=updated_rows+${updated},failed_rows=failed_rows+${failed},status=CASE WHEN processed_rows+${processed}>=total_rows THEN 'COMPLETED' ELSE 'PROCESSING' END,completed_at=CASE WHEN processed_rows+${processed}>=total_rows THEN NOW() ELSE NULL END WHERE id=${jobId}::uuid RETURNING id,entity_type AS "entityType",file_name AS "fileName",total_rows AS "totalRows",processed_rows AS "processedRows",created_rows AS "createdRows",updated_rows AS "updatedRows",skipped_rows AS "skippedRows",failed_rows AS "failedRows",status,created_at AS "createdAt",completed_at AS "completedAt"`)
  return result
}

export async function readImportJob(actorId:string,jobId:string) {
  await ensureImportSchema()
  const [job]=await prisma.$queryRaw<ImportJob[]>(Prisma.sql`SELECT id,entity_type AS "entityType",file_name AS "fileName",total_rows AS "totalRows",processed_rows AS "processedRows",created_rows AS "createdRows",updated_rows AS "updatedRows",skipped_rows AS "skippedRows",failed_rows AS "failedRows",status,created_at AS "createdAt",completed_at AS "completedAt" FROM catalog_import_jobs WHERE id=${jobId}::uuid AND actor_id=${actorId}::uuid`)
  if(!job) throw new Error('Import job not found.')
  return job
}

export async function listImportJobs(actorId:string) { await ensureImportSchema(); return prisma.$queryRaw<ImportJob[]>(Prisma.sql`SELECT id,entity_type AS "entityType",file_name AS "fileName",total_rows AS "totalRows",processed_rows AS "processedRows",created_rows AS "createdRows",updated_rows AS "updatedRows",skipped_rows AS "skippedRows",failed_rows AS "failedRows",status,created_at AS "createdAt",completed_at AS "completedAt" FROM catalog_import_jobs WHERE actor_id=${actorId}::uuid ORDER BY created_at DESC LIMIT 20`) }
export async function listImportErrors(actorId:string,jobId:string) { await ensureImportSchema(); return prisma.$queryRaw<Array<{rowNumber:number;message:string;rowData:CourseRow}>>(Prisma.sql`SELECT e.row_number AS "rowNumber",e.message,e.row_data AS "rowData" FROM catalog_import_errors e JOIN catalog_import_jobs j ON j.id=e.job_id WHERE e.job_id=${jobId}::uuid AND j.actor_id=${actorId}::uuid ORDER BY e.row_number`) }
function splitList(value:string){return String(value??'').replace(/\\n/g,'\n').split(/[,;\n]/).map(item=>item.trim()).filter(Boolean)}
function bool(value?:string){return !['false','0','no','inactive'].includes(String(value??'true').toLowerCase())}
