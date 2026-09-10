import { useEffect, useState, type JSX } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  AppShell,
  Header,
  Sidebar,
  Footer,
  UserMenu,
  ColorSchemeToggle,
  Divider,
} from "@wso2/oxygen-ui";
import { LayoutDashboard, Plus, Tag } from "@wso2/oxygen-ui-icons-react";
import { currentUser, signOut } from "../auth";

function activeItemFor(pathname: string): string {
  if (pathname.startsWith("/add-expense")) return "add-expense";
  if (pathname.startsWith("/categories")) return "categories";
  return "dashboard";
}

export default function AppLayout(): JSX.Element {
  const { pathname } = useLocation();
  const active = activeItemFor(pathname);
  const [name, setName] = useState("Household Member");
  const [email, setEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    void currentUser().then((user) => {
      const profile = user?.profile;
      if (!profile) return;
      const displayName = (profile.name as string | undefined) ?? (profile.preferred_username as string | undefined) ?? (profile.email as string | undefined);
      if (displayName) setName(displayName);
      if (profile.email) setEmail(profile.email as string);
    });
  }, []);

  return (
    <AppShell>
      <AppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>Expense Tracker</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={name} />
              <UserMenu.Header name={name} email={email ?? ""} />
              <UserMenu.Logout onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </AppShell.Navbar>

      <AppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              <Sidebar.Item id="dashboard" link={<Link to="/" />}>
                <Sidebar.ItemIcon>
                  <LayoutDashboard />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>Dashboard</Sidebar.ItemLabel>
              </Sidebar.Item>
              <Sidebar.Item id="add-expense" link={<Link to="/add-expense" />}>
                <Sidebar.ItemIcon>
                  <Plus />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>Add Expense</Sidebar.ItemLabel>
              </Sidebar.Item>
              <Sidebar.Item id="categories" link={<Link to="/categories" />}>
                <Sidebar.ItemIcon>
                  <Tag />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>Categories</Sidebar.ItemLabel>
              </Sidebar.Item>
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </AppShell.Sidebar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </AppShell.Footer>
    </AppShell>
  );
}
