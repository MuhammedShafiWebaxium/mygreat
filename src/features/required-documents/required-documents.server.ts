import { prisma } from '@/db/client.server'
import { z } from 'zod'

export const requiredDocumentSettingSchema=z.object({
  id:z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name:z.string().trim().min(1).max(160),
  accept:z.string().trim().min(1).max(255),
  active:z.boolean().default(true),
  sortOrder:z.number().int().min(0).max(10000),
})

export async function listRequiredDocumentSettings(activeOnly=false){
  return prisma.requiredDocumentSetting.findMany({where:activeOnly?{active:true}:undefined,orderBy:[{sortOrder:'asc'},{name:'asc'}],select:{id:true,name:true,accept:true,active:true,sortOrder:true}})
}

export async function saveRequiredDocumentSetting(input:z.infer<typeof requiredDocumentSettingSchema>){
  return prisma.requiredDocumentSetting.upsert({where:{id:input.id},create:input,update:{name:input.name,accept:input.accept,active:input.active,sortOrder:input.sortOrder}})
}

export async function deleteRequiredDocumentSetting(id:string){
  await prisma.requiredDocumentSetting.delete({where:{id}})
  return {ok:true}
}
