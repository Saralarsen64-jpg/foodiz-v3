import { Link, NavLink, Outlet } from 'react-router-dom';

const roleLabels = {
  client: 'Client',
  partner: 'Partner',
  courier: 'Courier',
  admin: 'Admin',
};

export function DashboardLayout({ role }) {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar premium-card">
        <Link className="brand-mark sidebar-brand" to="/">
          Foodiz
        </Link>
        <p className="eyebrow">Surface {roleLabels[role]}</p>
        <nav className="nav-stack">
          <NavLink to={`/${role}`} end>
            Vue principale
          </NavLink>
          <NavLink to="/auth">Auth</NavLink>
          <NavLink to="/client">Client</NavLink>
          <NavLink to="/partner">Partner</NavLink>
          <NavLink to="/courier">Courier</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </aside>

      <main className="dashboard-content">
        <header className="topbar premium-card">
          <div>
            <p className="eyebrow">Foodiz foundation</p>
            <h1>{roleLabels[role]} placeholder</h1>
          </div>
          <span className="status-pill">Ready</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
