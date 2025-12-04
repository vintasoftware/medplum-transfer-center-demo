import classes from '@/components/BedStatsCard/BedStatsCard.module.css';
import Surface from '@/components/Surface';
import { ActionIcon, Badge, Button, Group, Modal, Paper, PaperProps, ScrollArea, Table, Text } from '@mantine/core';
import { Location } from '@medplum/fhirtypes';
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBedFilled,
  IconBedOff,
  IconCoin,
  IconDiscount2,
  IconReceipt2,
  IconUserPlus,
} from '@tabler/icons-react';
import { useState } from 'react';

type BedStatsCardProps = {
  data: Location;
  // data: { id: number; name: string; phone: string; numBeds: number; numTotalBeds: number };
  locationDetails: { [key: string]: Location[] };
} & PaperProps;

const icons = {
  user: IconUserPlus,
  discount: IconDiscount2,
  receipt: IconReceipt2,
  coin: IconCoin,
  bed: IconBedFilled,
  bedOff: IconBedOff,
};

const BedStatsCard = ({ data, locationDetails, ...others }: BedStatsCardProps) => {
  const [opened, setOpened] = useState(false);
  const { id, name } = data;

  let sortedDetails: Location[] = [];
  if (id !== undefined) {
    sortedDetails = locationDetails[id]?.slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')) ?? [];
  }

  const availableBeds = sortedDetails.reduce((prevVal, currentVal) => {
    return prevVal + (currentVal?.operationalStatus?.code !== 'O' ? 1 : 0);
  }, 0);
  const numTotalBeds = sortedDetails.length;

  // TODO:  Fix hard coded value for diff, ext, and icon
  const diff = Math.round((availableBeds / numTotalBeds) * 100);
  const icon = 'bed';
  const DiffIcon = diff > 0 ? IconArrowUpRight : IconArrowDownRight;
  const Icon = icons[icon];

  return (
    <>
      <Surface component={Paper} {...others}>
        <Group justify="space-between">
          {name && (
            <Badge variant="filled" radius="sm">
              {name}
            </Badge>
          )}
          <ActionIcon variant="outline" onClick={() => setOpened(true)} title="See rooms">
            <Icon className={classes.icon} size="1.4rem" stroke={1.5} />
          </ActionIcon>
        </Group>

        <Group align="flex-end" gap="xs" mt={15}>
          <Text className={classes.value}>
            {availableBeds} of {numTotalBeds}
          </Text>
          <Text c={diff > 0 ? 'teal' : 'red'} fz="sm" fw={500} className={classes.diff}>
            <span>{!isNaN(diff) ? diff : '0'}%</span>
            <DiffIcon size="1rem" stroke={1.5} />
          </Text>
        </Group>

        <Group align="flex-end" gap="xs" mt={5} color="red">
          <Text fz="xs" c="dimmed" mt={7}>
            ext: {data.telecom?.find((val) => val.system === 'phone')?.value ?? 'Unknown'}
          </Text>
        </Group>
      </Surface>
      <Modal opened={opened} onClose={() => setOpened(false)} title={name}>
        <div className={classes.tableOuterWrapper}>
          <ScrollArea h={400}>
            <div className={classes.tableInnerWrapper}>
              {sortedDetails ? (
                <Table>
                  <Table.Thead className={classes.tableHeader}>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {sortedDetails.map((detail: Location) => (
                      <Table.Tr key={detail.name}>
                        <Table.Td>{detail.name}</Table.Td>
                        <Table.Td>{detail.description}</Table.Td>
                        <Table.Td>{detail.operationalStatus?.display ?? 'Unknown'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <p>No details available.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <Button onClick={() => setOpened(false)}>OK</Button>
      </Modal>
    </>
  );
};

export default BedStatsCard;
