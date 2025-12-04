import { Grid, GridCol, Loader } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { normalizeErrorString, resolveId } from '@medplum/core';
import { Patient, ServiceRequest } from '@medplum/fhirtypes';
import { Document, PatientSummary, useMedplum } from '@medplum/react';
import { IconCircleOff } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ServiceRequestDetails } from '../components/PatientDetails/PatientDetails';
import { ServiceRequestActions } from '@/components/actions/ServiceRequestActions';

export function ServiceRequestPage(): JSX.Element {
  const medplum = useMedplum();
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | undefined>();
  const [patient, setPatient] = useState<Patient>();

  useEffect(() => {
    medplum
      .readResource('ServiceRequest', id)
      .then(setServiceRequest)
      .catch((err) => {
        showNotification({
          icon: <IconCircleOff />,
          title: 'Error',
          message: normalizeErrorString(err),
        });
      });
  }, [id, medplum]);

  useEffect(() => {
    if (!serviceRequest) {
      return;
    }
    if (!serviceRequest.subject) {
      showNotification({
        color: 'red',
        message: 'Invalid service request. Patient is missing from subject field',
        autoClose: false,
      });
      return;
    }
    const patientId = resolveId(serviceRequest.subject);
    if (!patientId) {
      showNotification({ color: 'red', message: 'Invalid reference for patient in service request', autoClose: false });
      return;
    }
    medplum
      .readResource('Patient', patientId)
      .then(setPatient)
      .catch((err) => {
        showNotification({
          icon: <IconCircleOff />,
          title: 'Error',
          message: normalizeErrorString(err),
        });
      });
  }, [serviceRequest, medplum]);

  if (!serviceRequest || !patient) {
    return <Loader />;
  }

  return (
    <Grid>
      <GridCol span={4}>
        <PatientSummary patient={patient} />
      </GridCol>
      <GridCol span={5}>
        <ServiceRequestDetails patient={patient} onChange={setServiceRequest} />
      </GridCol>
      <GridCol span={3}>
        <Document p="xs">
          <ServiceRequestActions
            serviceRequest={serviceRequest}
            onChange={(serviceRequest) => {
              setServiceRequest(serviceRequest);
              navigate(`/ServiceRequest/${serviceRequest.id}/notes`);
            }}
          />
        </Document>
      </GridCol>
    </Grid>
  );
}
