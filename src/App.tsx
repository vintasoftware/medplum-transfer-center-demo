import { ErrorBoundary, Loading, useMedplum, useMedplumProfile } from '@medplum/react';
import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AssignToRoomPage } from '@/pages/AssignToRoomPage';
import { CreateLocationPage } from '@/pages/CreateLocationPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EditLocationPage } from '@/pages/EditLocationPage';
import { EditPractitionerPage } from '@/pages/EditPractitionerPage';
import { LocationsPage } from '@/pages/LocationPage';
import { NewPatientPage } from '@/pages/NewPatientPage';
import { NewPhysicianPage } from '@/pages/NewPhysicianPage';
import { PhysiciansPage } from '@/pages/PhysiciansPage';
import { QuestionnaireResponsePage } from '@/pages/QuestionnaireResponsePage';
import { ResourcePage } from '@/pages/ResourcePage';
import { Root } from '@/pages/Root';
import { ServiceRequestPage } from '@/pages/ServiceRequestPage';
import { SignInPage } from '@/pages/SignInPage';
import { SignOutPage } from '@/pages/SignOutPage';
import { SupplementaryQuestionnairePage } from '@/pages/SupplementaryQuestionnairePage';
import { TransferPage } from '@/pages/TransferPage';
import { ViewQuestionnairePage } from '@/pages/ViewQuestionnairePage';

function App(): JSX.Element | null {
  const medplum = useMedplum();
  const profile = useMedplumProfile();

  if (medplum.isLoading()) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={profile ? <Root /> : <Navigate to="/signin" replace />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<DashboardPage />}>
              <Route path="ServiceRequest/:id" element={<AssignToRoomPage />} />
            </Route>
            <Route path="transfers" element={<TransferPage />} />
            <Route path="transfers/new" element={<NewPatientPage />} />
            <Route path="Location" element={<LocationsPage />} />
            <Route path="Location/new" element={<CreateLocationPage />} />
            <Route path="Location/:id/new" element={<CreateLocationPage />} />
            <Route path="Location/:id/edit" element={<EditLocationPage />} />
            <Route path="Location/:id/rooms" element={<LocationsPage />} />
            <Route path="physicians" element={<PhysiciansPage />} />
            <Route path="physicians/new" element={<NewPhysicianPage />} />
            <Route path="Practitioner/:id/edit" element={<EditPractitionerPage />} />
            <Route path="Practitioner/:id/questionnaire" element={<ViewQuestionnairePage />} />
            <Route path="QuestionnaireResponse/:id" element={<QuestionnaireResponsePage />} />
            <Route path=":resourceType/:id/*" element={<ResourcePage />} />
            <Route path="ServiceRequest/:id/accepting-physician" element={<SupplementaryQuestionnairePage />} />
            <Route path="ServiceRequest/:id/physician-supplement" element={<SupplementaryQuestionnairePage />} />
            <Route path="ServiceRequest/:id/*" element={<ServiceRequestPage />} />
            <Route path=":resourceType/:id" element={<ResourcePage />} />
            <Route path=":resourceType/:id/_history/:versionId" element={<ResourcePage />} />
          </Route>

          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signout" element={<SignOutPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
