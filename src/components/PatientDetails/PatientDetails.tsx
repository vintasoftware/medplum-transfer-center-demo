import { Container, Loader, Tabs } from '@mantine/core';
import { Patient, QuestionnaireResponse, ServiceRequest } from '@medplum/fhirtypes';
import { DefaultResourceTimeline, Document, ResourceTable, useMedplum, useResource } from '@medplum/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PatientHeader } from '@/components/PatientHeader/PatientHeader';
import { QuestionnaireResponseViewer } from '@/components/QuestionnaireResponseViewer';
import { NotesTab } from './NotesTab';
import { TasksTab } from './TasksTab';

interface PatientDetailsProps {
  patient: Patient;
  onChange: (serviceRequest: ServiceRequest) => void;
}

export function ServiceRequestDetails(props: PatientDetailsProps): JSX.Element {
  const { patient } = props;
  const { id } = useParams();
  const medplum = useMedplum();
  const navigate = useNavigate();
  // const profile = useMedplumProfile() as Practitioner;
  const serviceRequest = useResource<ServiceRequest>({ reference: `ServiceRequest/${id}` });

  const [intakeResponse, setIntakeResponse] = useState<QuestionnaireResponse>();
  const [supplementaryResponse, setSupplementaryResponse] = useState<QuestionnaireResponse>();

  useEffect(() => {
    function loadSupportingInfo() {
      if (!serviceRequest) {
        setIntakeResponse(undefined);
        setSupplementaryResponse(undefined);
        return;
      }
      if (!serviceRequest.supportingInfo) {
        return;
      }
      if (serviceRequest.supportingInfo?.[0]) {
        medplum
          .readReference(serviceRequest.supportingInfo?.[0])
          .then((response) => setIntakeResponse(response as QuestionnaireResponse))
          .catch(console.error);
      }
      if (serviceRequest.supportingInfo?.[1]) {
        medplum
          .readReference(serviceRequest.supportingInfo?.[1])
          .then((response) => setSupplementaryResponse(response as QuestionnaireResponse))
          .catch(console.error);
      }
    }
    loadSupportingInfo();
  }, [serviceRequest, medplum]);

  const tabs = ['Details', 'History', 'Tasks', 'Notes'];
  if (intakeResponse) {
    tabs.push('Intake');
  }
  if (supplementaryResponse) {
    tabs.push('Supplementary');
  }
  const tab = window.location.pathname.split('/').pop();
  const currentTab = tab && tabs.map((t) => t.toLowerCase()).includes(tab) ? tab : tabs[0].toLowerCase();

  function handleTabChange(newTab: string | null): void {
    navigate(`/ServiceRequest/${id}/${newTab ?? ''}`);
  }

  if (!serviceRequest) {
    return <Loader />;
  }

  return (
    <Document>
      <PatientHeader patient={patient} />
      <Tabs value={currentTab.toLowerCase()} onChange={handleTabChange}>
        <Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Tab value={tab.toLowerCase()} key={tab}>
              {tab}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value="details">
          <Container p="md">
            <ResourceTable ignoreMissingValues value={serviceRequest} />
          </Container>
        </Tabs.Panel>
        <Tabs.Panel value="history">
          {/* Does not show note field as it has its own dedicated tab */}
          <DefaultResourceTimeline resource={{ ...serviceRequest, note: undefined }} />
        </Tabs.Panel>
        {intakeResponse && (
          <Tabs.Panel value="intake">
            <QuestionnaireResponseViewer response={intakeResponse} />
          </Tabs.Panel>
        )}
        {supplementaryResponse && (
          <Tabs.Panel value="supplementary">
            <QuestionnaireResponseViewer response={supplementaryResponse} />
          </Tabs.Panel>
        )}
        <Tabs.Panel value="tasks">
          <TasksTab serviceRequest={serviceRequest} />
        </Tabs.Panel>
        <Tabs.Panel value="notes">
          <Container p="md">
            <NotesTab serviceRequest={serviceRequest} />
          </Container>
        </Tabs.Panel>
      </Tabs>
    </Document>
  );
}
