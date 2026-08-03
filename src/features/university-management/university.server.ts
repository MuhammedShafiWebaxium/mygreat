import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'

export type Catalog = Awaited<ReturnType<typeof listCatalog>>

export async function listCatalog() {
  const [countries, universities, courses, fees] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string; name: string; code: string; currencyCode: string; active: boolean }>>(Prisma.sql`SELECT id, name, code, currency_code AS "currencyCode", active FROM countries ORDER BY name`),
    prisma.$queryRaw<Array<{ id: string; name: string; city: string; countryId: string; countryName: string; website: string | null; rank: number; tuition: string; acceptance: string; knownFor: string; active: boolean; rankings: Array<{id:string;name:string;value:string}> }>>(Prisma.sql`SELECT u.id, u.name, u.city, u.country_id AS "countryId", c.name AS "countryName", u.website, u.rank, u.tuition, u.acceptance, u.known_for AS "knownFor", u.active, COALESCE(json_agg(json_build_object('id',r.id,'name',r.name,'value',r.value) ORDER BY r.name) FILTER (WHERE r.id IS NOT NULL),'[]') AS rankings FROM universities u JOIN countries c ON c.id=u.country_id LEFT JOIN university_rankings r ON r.university_id=u.id GROUP BY u.id,c.name ORDER BY u.name`),
    prisma.$queryRaw<Array<{ id: string; universityId: string; universityName: string; name: string; code: string; level: string; durationMonths: number; campus:string; intakeMonth:string[]; intakeYear:string; tuitionFee:string; ranking:string; ielts:string; ieltsMin:string; toefl:string; toeflMin:string; pte:string; pteMin:string; applicationDeadline:string; scholarshipAvailable:string; requirements:string; backlogRange:string; remarks:string; applicationMode:string; englishProficiency:string; entryRequirements:string; active: boolean }>>(Prisma.sql`SELECT co.id, co.university_id AS "universityId", u.name AS "universityName", co.name, co.code, co.level, co.duration_months AS "durationMonths", co.campus, co.intake_month AS "intakeMonth", co.intake_year AS "intakeYear", co.tuition_fee AS "tuitionFee", co.ranking, co.ielts, co.ielts_min AS "ieltsMin", co.toefl, co.toefl_min AS "toeflMin", co.pte, co.pte_min AS "pteMin", co.application_deadline AS "applicationDeadline", co.scholarship_available AS "scholarshipAvailable", co.requirements, co.backlog_range AS "backlogRange", co.remarks, co.application_mode AS "applicationMode", co.english_proficiency AS "englishProficiency", co.entry_requirements AS "entryRequirements", co.active FROM courses co JOIN universities u ON u.id=co.university_id ORDER BY co.name`),
    prisma.$queryRaw<Array<{ id: string; courseId: string; amount: string; currencyCode: string; effectiveFrom: Date; effectiveTo: Date | null }>>(Prisma.sql`SELECT id, course_id AS "courseId", amount::text, currency_code AS "currencyCode", effective_from AS "effectiveFrom", effective_to AS "effectiveTo" FROM course_fees ORDER BY effective_from DESC`),
  ])
  return { countries, universities, courses: courses.map(course => ({ ...course, fees: fees.filter(fee => fee.courseId === course.id) })) }
}

export async function saveCountry(actorId: string, data: { id?: string; name: string; code: string; currencyCode: string; active: boolean }) {
  const [row] = data.id
    ? await prisma.$queryRaw<any[]>(Prisma.sql`UPDATE countries SET name=${data.name}, code=${data.code.toUpperCase()}, currency_code=${data.currencyCode.toUpperCase()}, active=${data.active}, updated_at=NOW() WHERE id=${data.id}::uuid RETURNING *`)
    : await prisma.$queryRaw<any[]>(Prisma.sql`INSERT INTO countries(name,code,currency_code,active) VALUES(${data.name},${data.code.toUpperCase()},${data.currencyCode.toUpperCase()},${data.active}) RETURNING *`)
  await audit(actorId, data.id ? 'COUNTRY_UPDATED' : 'COUNTRY_CREATED', 'country', row.id)
  return row
}
export async function saveUniversity(actorId: string, data: { id?: string; name: string; city: string; countryId: string; website:string; rank: number; tuition: string; acceptance: string; knownFor: string; active: boolean; rankings:Array<{name:string;value:string}> }) {
  return prisma.$transaction(async tx => {
    const [row] = data.id
      ? await tx.$queryRaw<any[]>(Prisma.sql`UPDATE universities SET name=${data.name}, city=${data.city}, country_id=${data.countryId}::uuid, website=${data.website || null}, rank=${data.rank}, tuition=${data.tuition}, acceptance=${data.acceptance}, known_for=${data.knownFor}, active=${data.active}, updated_at=NOW() WHERE id=${data.id} RETURNING *`)
      : await tx.$queryRaw<any[]>(Prisma.sql`INSERT INTO universities(name,city,country_id,website,rank,tuition,acceptance,known_for,active) VALUES(${data.name},${data.city},${data.countryId}::uuid,${data.website || null},${data.rank},${data.tuition},${data.acceptance},${data.knownFor},${data.active}) RETURNING *`)
    await tx.$executeRaw(Prisma.sql`DELETE FROM university_rankings WHERE university_id=${row.id}`)
    for (const ranking of data.rankings) await tx.$executeRaw(Prisma.sql`INSERT INTO university_rankings(university_id,name,value) VALUES(${row.id},${ranking.name},${ranking.value})`)
    await tx.auditLog.create({ data:{ actorId, action:data.id?'UNIVERSITY_UPDATED':'UNIVERSITY_CREATED', entityType:'university', entityId:row.id } })
    return row
  })
}
export async function saveCourse(actorId: string, data: { id?: string; universityId: string; name: string; code: string; level: string; durationMonths: number; active: boolean; campus:string; intakeMonth:string[]; intakeYear:string; tuitionFee:string; ranking:string; ielts:string; ieltsMin:string; toefl:string; toeflMin:string; pte:string; pteMin:string; applicationDeadline:string; scholarshipAvailable:string; requirements:string; backlogRange:string; remarks:string; applicationMode:string; englishProficiency:string; entryRequirements:string }) {
  const intakeMonths = data.intakeMonth.length ? Prisma.sql`ARRAY[${Prisma.join(data.intakeMonth)}]::text[]` : Prisma.sql`ARRAY[]::text[]`
  const [row] = data.id
    ? await prisma.$queryRaw<any[]>(Prisma.sql`UPDATE courses SET university_id=${data.universityId},name=${data.name},code=${data.code.toUpperCase()},level=${data.level},duration_months=${data.durationMonths},campus=${data.campus},intake_month=${intakeMonths},intake_year=${data.intakeYear},tuition_fee=${data.tuitionFee},ranking=${data.ranking},ielts=${data.ielts},ielts_min=${data.ieltsMin},toefl=${data.toefl},toefl_min=${data.toeflMin},pte=${data.pte},pte_min=${data.pteMin},application_deadline=${data.applicationDeadline},scholarship_available=${data.scholarshipAvailable},requirements=${data.requirements},backlog_range=${data.backlogRange},remarks=${data.remarks},application_mode=${data.applicationMode},english_proficiency=${data.englishProficiency},entry_requirements=${data.entryRequirements},active=${data.active},updated_at=NOW() WHERE id=${data.id}::uuid RETURNING *`)
    : await prisma.$queryRaw<any[]>(Prisma.sql`INSERT INTO courses(university_id,name,code,level,duration_months,campus,intake_month,intake_year,tuition_fee,ranking,ielts,ielts_min,toefl,toefl_min,pte,pte_min,application_deadline,scholarship_available,requirements,backlog_range,remarks,application_mode,english_proficiency,entry_requirements,active) VALUES(${data.universityId},${data.name},${data.code.toUpperCase()},${data.level},${data.durationMonths},${data.campus},${intakeMonths},${data.intakeYear},${data.tuitionFee},${data.ranking},${data.ielts},${data.ieltsMin},${data.toefl},${data.toeflMin},${data.pte},${data.pteMin},${data.applicationDeadline},${data.scholarshipAvailable},${data.requirements},${data.backlogRange},${data.remarks},${data.applicationMode},${data.englishProficiency},${data.entryRequirements},${data.active}) RETURNING *`)
  await audit(actorId, data.id ? 'COURSE_UPDATED' : 'COURSE_CREATED', 'course', row.id)
  return row
}
export async function setCourseFee(actorId: string, data: { courseId: string; amount: number; currencyCode: string; effectiveFrom: Date }) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw(Prisma.sql`UPDATE course_fees SET effective_to=${data.effectiveFrom} WHERE course_id=${data.courseId}::uuid AND effective_to IS NULL AND effective_from < ${data.effectiveFrom}`)
    const [fee] = await tx.$queryRaw<any[]>(Prisma.sql`INSERT INTO course_fees(course_id,amount,currency_code,effective_from,created_by) VALUES(${data.courseId}::uuid,${data.amount},${data.currencyCode.toUpperCase()},${data.effectiveFrom},${actorId}::uuid) RETURNING *`)
    await tx.auditLog.create({ data: { actorId, action: 'COURSE_FEE_SET', entityType: 'course', entityId: data.courseId, metadata: { amount: data.amount, currency: data.currencyCode } } })
    return fee
  })
}
export async function deleteEntity(actorId: string, entity: 'country'|'university'|'course', id: string) {
  const table = entity === 'country' ? 'countries' : entity === 'university' ? 'universities' : 'courses'
  const dependencies = entity === 'country' ? 'universities' : entity === 'university' ? 'applications or courses' : 'applications'
  try { await prisma.$executeRawUnsafe(`DELETE FROM ${table} WHERE id=$1${entity === 'university' ? '' : '::uuid'}`, id) }
  catch { throw new Error(`Cannot delete this ${entity} while it is used by ${dependencies}. Deactivate it instead.`) }
  await audit(actorId, `${entity.toUpperCase()}_DELETED`, entity, id)
  return { id }
}
async function audit(actorId: string, action: string, entityType: string, entityId: string) { await prisma.auditLog.create({ data: { actorId, action, entityType, entityId } }) }
