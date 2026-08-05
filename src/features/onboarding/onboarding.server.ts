import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import type { Country, OnboardingCourseOffering, OnboardingCourseOption, University } from '@/types'

export async function readOnboardingCatalog() {
  const [countryRows, universityRows] = await Promise.all([
    prisma.$queryRaw<Array<{ id:string; name:string; code:string; universities:bigint; courses:bigint; cities:string[] }>>(Prisma.sql`
      SELECT c.id::text, c.name, c.code,
        COUNT(DISTINCT u.id) AS universities,
        COUNT(DISTINCT co.id) AS courses,
        COALESCE(array_agg(DISTINCT u.city ORDER BY u.city) FILTER (WHERE u.city <> ''), ARRAY[]::text[]) AS cities
      FROM countries c
      LEFT JOIN universities u ON u.country_id=c.id AND u.active=TRUE
      LEFT JOIN courses co ON co.university_id=u.id AND co.active=TRUE
      WHERE c.active=TRUE
      GROUP BY c.id,c.name,c.code
      HAVING COUNT(DISTINCT u.id)>0
      ORDER BY c.name
    `),
    prisma.$queryRaw<Array<{ id:string; name:string; city:string; countryId:string; website:string; rank:number; courseCount:bigint }>>(Prisma.sql`
      SELECT u.id,u.name,u.city,u.country_id::text AS "countryId",COALESCE(u.website,'') AS website,u.rank,
        COUNT(co.id) AS "courseCount"
      FROM universities u
      JOIN countries c ON c.id=u.country_id AND c.active=TRUE
      LEFT JOIN courses co ON co.university_id=u.id AND co.active=TRUE
      WHERE u.active=TRUE
      GROUP BY u.id,u.name,u.city,u.country_id,u.website,u.rank
      ORDER BY u.name
    `),
  ])
  const countries: Country[] = countryRows.map(row => ({
    id:row.id, name:row.name, flag:countryFlag(row.code),
    tagline:`${Number(row.courses).toLocaleString()} active courses available`,
    universities:Number(row.universities), avgTuition:`${Number(row.courses).toLocaleString()} courses`, cities:row.cities.slice(0,3),
  }))
  const universities: University[] = universityRows.map(row => ({
    id:row.id,name:row.name,city:row.city,countryId:row.countryId,rank:row.rank,
    tuition:'',acceptance:'',knownFor:'',website:row.website,courseCount:Number(row.courseCount),
  }))
  return { countries, universities }
}

export async function readOnboardingCourses(countryId:string):Promise<OnboardingCourseOption[]> {
  const rows=await prisma.$queryRaw<Array<{name:string;level:string;universityIds:string[];universities:Array<{id:string;name:string;city:string;countryId:string;website:string;rank:number;courseCount:number}>;minFeeInr:string|null;feeInrValues:string[];universityFeeValuesInr:Record<string,string[]>;intakeMonthGroups:string[][];universityIntakeMonths:Record<string,string[]>}>>(Prisma.sql`
    WITH university_offerings AS (
      SELECT LOWER(TRIM(co.name)) AS name_key,LOWER(TRIM(co.level)) AS level_key,
        MIN(TRIM(co.name)) AS name,MIN(TRIM(co.level)) AS level,u.id::text AS university_id,
        MIN(u.name) AS university_name,MIN(u.city) AS university_city,MIN(u.country_id::text) AS university_country_id,
        MIN(COALESCE(u.website,'')) AS university_website,MIN(u.rank) AS university_rank,
        COUNT(DISTINCT co.id)::int AS university_course_count,
        COALESCE(array_agg(DISTINCT f.amount_inr::text) FILTER(WHERE f.amount_inr IS NOT NULL),ARRAY[]::text[]) AS fees,
        COALESCE(array_agg(DISTINCT month) FILTER(WHERE month<>''),ARRAY[]::text[]) AS months
      FROM courses co
      JOIN universities u ON u.id=co.university_id AND u.active=TRUE
      JOIN countries c ON c.id=u.country_id AND c.active=TRUE
      LEFT JOIN LATERAL (SELECT amount_inr FROM course_fees WHERE course_id=co.id AND effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW()) ORDER BY effective_from DESC LIMIT 1) f ON TRUE
      LEFT JOIN LATERAL unnest(COALESCE(co.intake_month,ARRAY[]::text[])) month ON TRUE
      WHERE u.country_id=${countryId}::uuid AND co.active=TRUE AND TRIM(co.name)<>''
      GROUP BY LOWER(TRIM(co.name)),LOWER(TRIM(co.level)),u.id
    )
    SELECT MIN(name) AS name,MIN(level) AS level,array_agg(university_id ORDER BY university_id) AS "universityIds",
      jsonb_agg(DISTINCT jsonb_build_object('id',university_id,'name',university_name,'city',university_city,'countryId',university_country_id,'website',university_website,'rank',university_rank,'courseCount',university_course_count)) AS universities,
      MIN(fee::numeric)::text AS "minFeeInr",COALESCE(array_agg(DISTINCT fee) FILTER(WHERE fee IS NOT NULL),ARRAY[]::text[]) AS "feeInrValues",
      jsonb_object_agg(university_id,fees) AS "universityFeeValuesInr",jsonb_agg(months) AS "intakeMonthGroups",
      jsonb_object_agg(university_id,months) AS "universityIntakeMonths"
    FROM university_offerings LEFT JOIN LATERAL unnest(fees) fee ON TRUE
    GROUP BY name_key,level_key ORDER BY MIN(name)
  `)
  return rows.map(row=>({name:String(row.name??''),level:String(row.level??''),universityIds:[...new Set(Array.from(row.universityIds??[],String))],universities:(row.universities??[]).map(university=>({...university,rank:Number(university.rank??0),courseCount:Number(university.courseCount??0),tuition:'',acceptance:'',knownFor:''})),minFeeInr:row.minFeeInr===null?undefined:Number(row.minFeeInr),feeInrValues:Array.from(row.feeInrValues??[],Number),universityFeeValuesInr:Object.fromEntries(Object.entries(row.universityFeeValuesInr??{}).map(([id,fees])=>[id,fees.map(Number)])),intakeMonths:[...new Set((row.intakeMonthGroups??[]).flat().map(normalizeIntakeMonth).filter(Boolean))],universityIntakeMonths:Object.fromEntries(Object.entries(row.universityIntakeMonths??{}).map(([id,months])=>[id,months.map(normalizeIntakeMonth).filter(Boolean)]))}))
}

export async function readOnboardingCourseDetails(input:{countryIds:string[];names:string[];level:string;universityIds:string[]}):Promise<OnboardingCourseOption[]> {
  if(!input.countryIds.length||!input.names.length||!input.universityIds.length)return []
  const rows=await prisma.$queryRaw<Array<OnboardingCourseOffering & {name:string;level:string}>>(Prisma.sql`
    SELECT co.id::text AS "courseId",TRIM(co.name) AS name,TRIM(co.level) AS level,
      u.id::text AS "universityId",u.name AS "universityName",u.country_id::text AS "countryId",u.city,
      co.code,co.campus,co.duration_months AS "durationMonths",co.intake_month AS "intakeMonth",
      co.tuition_fee AS "tuitionFee",COALESCE(f.amount::text,'') AS "feeAmount",COALESCE(f.currency_code,'') AS "feeCurrency",COALESCE(f.amount_inr::text,'') AS "amountInr",
      co.ranking,co.ielts_min AS "ieltsMin",co.toefl_min AS "toeflMin",co.pte_min AS "pteMin",
      co.application_deadline AS "applicationDeadline",co.scholarship_available AS "scholarshipAvailable",
      co.requirements,co.entry_requirements AS "entryRequirements",co.backlog_range AS "backlogRange",
      co.application_mode AS "applicationMode",co.english_proficiency AS "englishProficiency",co.remarks
    FROM courses co JOIN universities u ON u.id=co.university_id AND u.active=TRUE
    LEFT JOIN LATERAL (SELECT amount,currency_code,amount_inr FROM course_fees WHERE course_id=co.id AND effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW()) ORDER BY effective_from DESC LIMIT 1) f ON TRUE
    WHERE co.active=TRUE AND u.country_id::text IN (${Prisma.join(input.countryIds)}) AND u.id::text IN (${Prisma.join(input.universityIds)})
      AND LOWER(TRIM(co.name)) IN (${Prisma.join(input.names.map(name=>name.toLowerCase()))}) AND LOWER(TRIM(co.level))=${input.level.toLowerCase()}
    ORDER BY TRIM(co.name),u.name
  `)
  const grouped=new Map<string,OnboardingCourseOption>()
  rows.forEach(row=>{const key=`${row.level.toLowerCase()}:${row.name.toLowerCase()}`,current=grouped.get(key),offering:OnboardingCourseOffering={...row,durationMonths:Number(row.durationMonths),intakeMonth:Array.from(row.intakeMonth??[],String),intakeYear:''};if(current){current.universityIds.push(offering.universityId);current.offerings?.push(offering)}else grouped.set(key,{name:row.name,level:row.level,universityIds:[offering.universityId],offerings:[offering]})})
  return [...grouped.values()]
}

function countryFlag(code:string) {
  const normalized=code.trim().toUpperCase()
  return normalized.length===2 ? [...normalized].map(char=>String.fromCodePoint(127397+char.charCodeAt(0))).join('') : '🌍'
}

function normalizeIntakeMonth(value:string){const key=String(value??'').trim().toLowerCase().slice(0,3),months:Record<string,string>={jan:'January',feb:'February',mar:'March',apr:'April',may:'May',jun:'June',jul:'July',aug:'August',sep:'September',oct:'October',nov:'November',dec:'December',fal:'September',spr:'January'};return months[key]??''}
