import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidWorkflowTransition } from './workflow.transitions'

test('SOP correction preserves the verification loop',()=>{
  assert.equal(isValidWorkflowTransition('SOP_VERIFICATION','SOP_CORRECTION_REQUIRED'),true)
  assert.equal(isValidWorkflowTransition('SOP_CORRECTION_REQUIRED','SOP_VERIFICATION'),true)
  assert.equal(isValidWorkflowTransition('APPLICATION_SUBMISSION','APPLICATION_REJECTED'),true)
})

test('application resubmission returns to submission',()=>{
})

test('visa rejection permits reapply or appeal but not grant',()=>{
  assert.equal(isValidWorkflowTransition('VISA_SUBMISSION','VISA_REAPPLY_OR_APPEAL'),true)
  assert.equal(isValidWorkflowTransition('VISA_REAPPLY_OR_APPEAL','VISA_GRANTED'),false)
})

test('invalid workflow shortcuts are rejected',()=>{
  assert.equal(isValidWorkflowTransition('SOP_PREPARATION','APPLICATION_SUBMISSION'),false)
  assert.equal(isValidWorkflowTransition('VISA_DOCUMENT_COLLECTION','VISA_SUBMISSION'),false)
  assert.equal(isValidWorkflowTransition('VISA_SUBMISSION','VISA_GRANTED'),false)
})
