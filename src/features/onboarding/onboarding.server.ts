import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import type { Country, OnboardingCourseOption, University } from '@/types'

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
  const rows=await prisma.$queryRaw<Array<{name:string;level:string;universityIds:string[]}>>(Prisma.sql`
    SELECT MIN(TRIM(co.name)) AS name,MIN(TRIM(co.level)) AS level,array_agg(DISTINCT u.id ORDER BY u.id) AS "universityIds"
    FROM courses co
    JOIN universities u ON u.id=co.university_id AND u.active=TRUE
    JOIN countries c ON c.id=u.country_id AND c.active=TRUE
    WHERE u.country_id=${countryId}::uuid AND co.active=TRUE AND TRIM(co.name)<>''
    GROUP BY LOWER(TRIM(co.name)),LOWER(TRIM(co.level))
    ORDER BY MIN(TRIM(co.name))
  `)
  return rows.map(row=>({
    name:String(row.name??''),
    level:String(row.level??''),
    universityIds:Array.from(row.universityIds??[],id=>String(id)),
  }))
}

function countryFlag(code:string) {
  const normalized=code.trim().toUpperCase()
  return normalized.length===2 ? [...normalized].map(char=>String.fromCodePoint(127397+char.charCodeAt(0))).join('') : '🌍'
}
