import { NavLink, Outlet } from 'react-router-dom';
import { Barcode, ClipboardList, Cpu, LayoutDashboard, LogOut, Package, ScanLine, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
    isActive ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--ink)]'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[var(--sidebar)] p-4 pb-24 backdrop-blur lg:border-b-0 lg:border-r">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand)]">Office Hardware</p>
          <h1 className="mt-1 text-xl font-semibold text-[var(--ink)]">Asset Control</h1>
        </div>

        <nav className="flex flex-wrap gap-2 lg:flex-col">
          <NavLink to="/" end className={linkClass}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/issue" className={linkClass}>
            <Cpu size={16} /> Issue Hardware Components
          </NavLink>
          <NavLink to="/inventory" end className={linkClass}>
            <Package size={16} /> Inventory
          </NavLink>
          <NavLink to="/employees" className={linkClass}>
            <Users size={16} /> Employees
          </NavLink>
          <NavLink to="/scans" className={linkClass}>
            <ScanLine size={16} /> Inventory Scanning
          </NavLink>
          <NavLink to="/barcodes" className={linkClass}>
            <Barcode size={16} /> Barcode Management
          </NavLink>
          <NavLink to="/audit-logs" className={linkClass}>
            <ClipboardList size={16} /> Audit Logs
          </NavLink>
        </nav>

        <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Shield size={16} className="text-[var(--brand)]" />
            {user?.fullName}
          </div>
          <p className="text-xs text-[var(--muted)]">{user?.role}</p>
          <button
            onClick={logout}
            className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--danger)] hover:underline"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
