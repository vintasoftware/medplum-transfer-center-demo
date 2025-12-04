import { Code, Divider, Group, NavLink, Stack, Text } from '@mantine/core';
import { useMedplum } from '@medplum/react';
import { Icon, IconAmbulance, IconDashboard, IconHospital, IconLogout, IconStethoscope } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

import classes from './Navbar.module.css';

interface MenuItem {
  link: string;
  label: string;
  icon: Icon;
}

const menu: MenuItem[] = [
  { link: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { link: '/transfers', label: 'Transfer Center', icon: IconAmbulance },
];

const adminMenu: MenuItem[] = [
  { link: '/physicians', label: 'Physicians', icon: IconStethoscope },
  { link: '/Location', label: 'Locations', icon: IconHospital },
];

const logoutMenu: MenuItem = { link: '/signout', label: 'Logout', icon: IconLogout };

export default function Navbar() {
  const { pathname } = useLocation();
  const medplum = useMedplum();
  const isProjectAdmin = medplum.isProjectAdmin();
  const activeItem =
    menu.find((item) => pathname.startsWith(item.link)) || adminMenu.find((item) => pathname.startsWith(item.link));

  const links = menu.map((item) => renderLink(item));

  const adminLinks = adminMenu.map((item) => renderLink(item));

  function renderLink(item: MenuItem): JSX.Element {
    return (
      <NavLink
        className={classes.link}
        component={Link}
        active={item.link === activeItem?.link || undefined}
        to={item.link}
        key={item.label}
        label={item.label}
        leftSection={<item.icon className={classes.linkIcon} stroke={1.5} />}
      />
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Text>Transfer Center</Text>
        <Code fw={700}>Alpha (v1.0.1)</Code>
      </Group>
      {links}
      <Divider />
      {isProjectAdmin ? adminLinks : null}
      <Divider />
      {renderLink(logoutMenu)}
    </Stack>
  );
}
