import { BedStatsWidget } from '@/components/BedStatsWidget/BedStatsWidget';
import { FhirPathTable, FhirPathTableField } from '@/components/FhirPathTable/FhirPathTable';
import { StatusBadge, StatusBadgeProps } from '@/components/StatusBadge';
import { PAPER_PROPS } from '@/lib/common';
import { Button, Container, Paper, Stack, Table, TableTd, TableTh, Text, Title } from '@mantine/core';
import { PropertyType, formatDate } from '@medplum/core';
import { Bundle } from '@medplum/fhirtypes';
import { Loading, useMedplum } from '@medplum/react';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

const SAMPLE_CALL_RESULT_SYSTEM_STR = 'https://samplemed.com/fhir/CodeSystem/call-dispositions';

const serviceReqQuery = `{
  ResourceList: ServiceRequestList(code: "http://snomed.info/sct|19712007", authored: "gt1970-01-01", _sort: "-authored", _count: 4) {
    id,
    authoredOn,
    subject {
      display,
      reference
    },
    requester {
      display,
      reference,
      resource {
        ... on Practitioner {
          PractitionerRoleList(_reference: practitioner) {
            organization {
              display,
              reference
            }
          }
        }
      }
    }
    CommunicationRequestList(_reference: based_on) {
      id,
      CommunicationList(_reference: based_on) {
        statusReason {
          text
        }
      }
    }
  }
}`;

const RESULT_CODES = ['COMPLETE', 'DECLINED', 'HLOC', 'CANCELLED', 'CONSULT'] as const;
type ResultCode = (typeof RESULT_CODES)[number];

type ResultCodeCountDisplayProps = {
  code: ResultCode;
};

function ResultCodeCountDisplay(props: ResultCodeCountDisplayProps): JSX.Element {
  const medplum = useMedplum();
  const [count, setCount] = useState<number>();

  useEffect(() => {
    const { year: currentYear, month: currentMonth } = getMTD();
    medplum
      .search(
        'ServiceRequest',
        `authored=ge${currentYear}-${currentMonth}-01` +
          `&_has:CommunicationRequest:based-on:_has:Communication:based-on:_tag=${SAMPLE_CALL_RESULT_SYSTEM_STR}|${props.code}` +
          `&_summary=count`
      )
      .then((bundle: Bundle) => {
        setCount(bundle.total);
      })
      .catch(console.error);
  }, [medplum, props.code]);

  if (count === undefined) {
    return <Loading />;
  }

  return <p>{count}</p>;
}

function getMTD(): {
  year: number;
  month: string;
  monthName: string;
} {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });

  return {
    year: currentYear,
    month: currentMonth,
    monthName: currentMonthName,
  };
}

function getCodeDisplayString(code: ResultCode): string {
  switch (code) {
    case 'COMPLETE':
      return 'Completed';
    case 'CONSULT':
      return 'Consultation';
    case 'HLOC':
      return 'Higher Level of Care';
    case 'CANCELLED':
      return 'Cancellation';
    case 'DECLINED':
      return 'Declination';
    default:
      return 'Invalid code';
  }
}

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();

  const fields = useMemo<FhirPathTableField[]>(
    () => [
      {
        name: 'Patient',
        fhirPath: 'subject.display',
        propertyType: PropertyType.string,
      },
      {
        name: 'Date',
        fhirPath: 'authoredOn',
        propertyType: PropertyType.date,
        render: ({ value }) => (
          <Text>
            {formatDate(value as string | undefined, undefined, {
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })}
          </Text>
        ),
      },
      {
        name: 'Transfer from',
        fhirPath: 'requester.resource.PractitionerRoleList[0].organization.display',
        propertyType: PropertyType.string,
      },
      {
        name: 'Transfer doctor',
        fhirPath: 'requester.display',
        propertyType: PropertyType.string,
      },
      {
        name: 'State',
        fhirPath: 'CommunicationRequestList[0].CommunicationList[0].statusReason.text',
        propertyType: PropertyType.string,
        render: ({ value }) => <StatusBadge status={(value as StatusBadgeProps['status']) ?? 'In Progress'} />,
      },
      {
        name: '',
        fhirPath: 'id',
        propertyType: PropertyType.id,
        render: ({ value }) => <Button onClick={() => navigate(`ServiceRequest/${value as string}`)}>Edit</Button>,
      },
    ],
    [navigate]
  );

  const { year, monthName: currentMonthName } = getMTD();

  return (
    <Container fluid>
      <Stack gap="lg" mt={15}>
        <BedStatsWidget />
        <Paper {...PAPER_PROPS}>
          <FhirPathTable resourceType="ServiceRequest" query={serviceReqQuery} fields={fields} />
        </Paper>
        <Paper {...PAPER_PROPS}>
          <Stack>
            <Title>
              Transfer Resolutions - MTD ({currentMonthName} {year})
            </Title>
            <Table>
              <Table.Tbody>
                <Table.Tr>
                  {RESULT_CODES.map((code) => {
                    return <TableTh key={code}>{getCodeDisplayString(code)}</TableTh>;
                  })}
                </Table.Tr>
                <Table.Tr>
                  {RESULT_CODES.map((code) => {
                    return (
                      <TableTd key={code}>
                        <ResultCodeCountDisplay code={code} />
                      </TableTd>
                    );
                  })}
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Stack>
        </Paper>
      </Stack>
      <Outlet />
    </Container>
  );
}
