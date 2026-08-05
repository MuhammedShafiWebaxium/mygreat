import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'

const FRANKFURTER_URL='https://api.frankfurter.dev/v2/rates'

export async function readExchangeRateSettings() {
  const rates=await prisma.$queryRaw<Array<{currencyCode:string;rateToInr:string;provider:string;providerDate:Date;updatedAt:Date}>>(Prisma.sql`SELECT currency_code AS "currencyCode",rate_to_inr::text AS "rateToInr",provider,provider_date AS "providerDate",updated_at AS "updatedAt" FROM exchange_rates ORDER BY currency_code`)
  const coverage=await prisma.$queryRaw<Array<{total:bigint;converted:bigint}>>(Prisma.sql`SELECT COUNT(*) AS total,COUNT(amount_inr) AS converted FROM course_fees WHERE effective_to IS NULL OR effective_to>NOW()`)
  return {provider:'Frankfurter central-bank rates',sourceUrl:'https://frankfurter.dev/',rates:rates.map(rate=>({...rate,rateToInr:Number(rate.rateToInr)})),coverage:{total:Number(coverage[0]?.total??0),converted:Number(coverage[0]?.converted??0)}}
}

export async function refreshExchangeRates(actorId:string) {
  const currencies=await prisma.$queryRaw<Array<{code:string}>>(Prisma.sql`SELECT DISTINCT code FROM (SELECT currency_code AS code FROM countries UNION SELECT currency_code AS code FROM course_fees UNION SELECT 'INR' AS code) currencies ORDER BY code`)
  const quotes=currencies.map(({code})=>code.toUpperCase()).filter(code=>code!=='INR')
  const response=await fetch(`${FRANKFURTER_URL}?base=INR&quotes=${encodeURIComponent(quotes.join(','))}`,{headers:{accept:'application/json'}})
  if(!response.ok)throw new Error(`Exchange-rate refresh failed (${response.status}).`)
  const rows=await response.json() as Array<{date:string;base:string;quote:string;rate:number}>
  const available=[{code:'INR',rate:1,date:new Date().toISOString().slice(0,10)},...rows.map(row=>({code:row.quote,rate:1/Number(row.rate),date:row.date}))].filter(item=>Number.isFinite(item.rate)&&item.rate>0)

  const legacy=await prisma.$queryRaw<Array<{courseId:string;tuitionFee:string;currencyCode:string}>>(Prisma.sql`
    SELECT co.id::text AS "courseId",co.tuition_fee AS "tuitionFee",c.currency_code AS "currencyCode"
    FROM courses co JOIN universities u ON u.id=co.university_id JOIN countries c ON c.id=u.country_id
    WHERE TRIM(co.tuition_fee)<>'' AND NOT EXISTS (SELECT 1 FROM course_fees f WHERE f.course_id=co.id AND (f.effective_to IS NULL OR f.effective_to>NOW()))
  `)

  await prisma.$transaction(async tx=>{
    for(const item of available)await tx.$executeRaw(Prisma.sql`INSERT INTO exchange_rates(currency_code,rate_to_inr,provider,provider_date,refreshed_by,updated_at) VALUES(${item.code},${item.rate},'FRANKFURTER',${item.date}::date,${actorId}::uuid,NOW()) ON CONFLICT(currency_code) DO UPDATE SET rate_to_inr=EXCLUDED.rate_to_inr,provider=EXCLUDED.provider,provider_date=EXCLUDED.provider_date,refreshed_by=EXCLUDED.refreshed_by,updated_at=NOW()`)
    for(const item of legacy){const amount=parseLegacyFee(item.tuitionFee),rate=available.find(rate=>rate.code===item.currencyCode.toUpperCase())?.rate;if(amount&&rate)await tx.$executeRaw(Prisma.sql`INSERT INTO course_fees(course_id,amount,currency_code,amount_inr,exchange_rate,effective_from,created_by) VALUES(${item.courseId}::uuid,${amount},${item.currencyCode.toUpperCase()},${amount*rate},${rate},NOW(),${actorId}::uuid)`)}
    await tx.$executeRaw(Prisma.sql`UPDATE course_fees f SET amount_inr=ROUND(f.amount*r.rate_to_inr,2),exchange_rate=r.rate_to_inr FROM exchange_rates r WHERE r.currency_code=f.currency_code AND (f.effective_to IS NULL OR f.effective_to>NOW())`)
    await tx.auditLog.create({data:{actorId,action:'EXCHANGE_RATES_REFRESHED',entityType:'exchange_rate',metadata:{provider:'FRANKFURTER_CENTRAL_BANKS',currencies:available.length,legacyFeesNormalized:legacy.length}}})
  })
  return readExchangeRateSettings()
}

function parseLegacyFee(value:string) {
  const normalized=value.replace(/,/g,'').match(/[0-9]+(?:\.[0-9]+)?/)?.[0]
  const amount=Number(normalized)
  return Number.isFinite(amount)&&amount>0?amount:null
}
