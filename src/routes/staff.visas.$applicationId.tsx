import { createFileRoute } from '@tanstack/react-router'
import WorkflowCaseDetail from '@/screens/staff/WorkflowCaseDetail'
export const Route=createFileRoute('/staff/visas/$applicationId')({component:VisaCase})
function VisaCase(){const{applicationId}=Route.useParams();return <WorkflowCaseDetail applicationId={applicationId} workflowType="VISA"/>}
