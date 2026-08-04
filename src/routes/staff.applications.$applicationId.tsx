import { createFileRoute } from '@tanstack/react-router'
import WorkflowCaseDetail from '@/screens/staff/WorkflowCaseDetail'
export const Route=createFileRoute('/staff/applications/$applicationId')({component:ApplicationCase})
function ApplicationCase(){const{applicationId}=Route.useParams();return <WorkflowCaseDetail applicationId={applicationId} workflowType="APPLICATION"/>}
