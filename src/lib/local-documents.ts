export const REQUIRED_DOCUMENTS = [
  {id:'passport',name:'Passport',accept:'.pdf,.jpg,.jpeg,.png'},
  {id:'passport-photo',name:'Passport-size photograph',accept:'.jpg,.jpeg,.png'},
  {id:'cv',name:'CV or résumé',accept:'.pdf,.doc,.docx'},
  {id:'aadhaar',name:'Aadhaar',accept:'.pdf,.jpg,.jpeg,.png'},
] as const

export type RequiredDocumentId = typeof REQUIRED_DOCUMENTS[number]['id']
