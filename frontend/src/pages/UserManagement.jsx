import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { Users, Shield, Wrench, User as UserIcon, RefreshCw, Search, Settings2, UserCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const { user: currentUser, isAdmin } = useAuth();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await authApi.getAllUsers();
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleToggle = async (userId, role, hasRole) => {
    const action = hasRole ? 'REMOVE' : 'ADD';
    try {
      await authApi.updateUserRole(userId, role, action);
      toast.success(`Role ${action === 'ADD' ? 'added' : 'removed'} successfully`);
      loadUsers(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || "Role update failed");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isAdmin()) {
      toast.error('Only admins can delete users.');
      return;
    }

    if (currentUser?.id === userId) {
      toast.error('You cannot delete your own account.');
      return;
    }

    const confirmDelete = window.confirm('Delete this user permanently? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await authApi.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const roleCounts = useMemo(() => {
    return users.reduce((acc, user) => {
      const roles = Array.isArray(user.roles) ? user.roles : [];
      if (roles.includes('ROLE_ADMIN')) acc.admin += 1;
      if (roles.includes('ROLE_TECHNICIAN')) acc.technician += 1;
      if (roles.includes('ROLE_USER')) acc.user += 1;
      return acc;
    }, { admin: 0, technician: 0, user: 0 });
  }, [users]);

  const filteredUsers = useMemo(() => {
    const needle = search.toLowerCase();
    return users.filter((user) => {
      const display = `${user.name || ''} ${user.email || ''} ${user.githubUsername || ''}`.toLowerCase();
      const roles = Array.isArray(user.roles) ? user.roles : [];
      const roleOk = roleFilter === 'ALL' || roles.includes(roleFilter);
      return roleOk && (needle === '' || display.includes(needle));
    });
  }, [users, search, roleFilter]);

  const roleFilters = [
    { label: 'All', value: 'ALL' },
    { label: 'Admins', value: 'ROLE_ADMIN' },
    { label: 'Technicians', value: 'ROLE_TECHNICIAN' },
    { label: 'Users', value: 'ROLE_USER' },
  ];

  if (loading) return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="mx-auto max-w-7xl rounded-3xl border p-10 text-center animate-pulse" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)', color: 'var(--text-secondary)' }}>
        Loading user governance data...
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 relative page-enter">
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.1)_0%,_rgba(249,115,22,0)_70%)] opacity-60 blur-3xl shadow-none" />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between relative z-10">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
            <Settings2 size={12} style={{ color: 'var(--primary)' }} />
            Access Governance
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">User Administration</h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Manage system accounts, role assignments, and privilege boundaries.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="flex items-center gap-2 glass-panel px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 border"
          style={{ color: 'var(--text-primary)', borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
        >
          <RefreshCw size={14} style={{ color: 'var(--primary)' }} />
          Refresh Registry
        </button>
      </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="glass-panel-strong rounded-3xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--border)' }}>
               <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Users size={80} style={{ color: 'var(--primary)' }} />
               </div>
               <p className="text-[9px] font-bold uppercase tracking-widest relative z-10" style={{ color: 'var(--text-secondary)' }}>Total Accounts</p>
               <p className="mt-1 text-3xl font-black relative z-10" style={{ color: 'var(--primary)' }}>{users.length}</p>
            </article>
            <article className="glass-panel-strong rounded-3xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--border)' }}>
               <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Shield size={80} style={{ color: 'var(--status-approved)' }} />
               </div>
               <p className="text-[9px] font-bold uppercase tracking-widest relative z-10" style={{ color: 'var(--text-secondary)' }}>Administrators</p>
               <p className="mt-1 text-3xl font-black relative z-10" style={{ color: 'var(--status-approved)' }}>{roleCounts.admin}</p>
            </article>
            <article className="glass-panel-strong rounded-3xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--border)' }}>
               <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Wrench size={80} style={{ color: 'var(--status-pending)' }} />
               </div>
               <p className="text-[9px] font-bold uppercase tracking-widest relative z-10" style={{ color: 'var(--text-secondary)' }}>Technicians</p>
               <p className="mt-1 text-3xl font-black relative z-10" style={{ color: 'var(--status-pending)' }}>{roleCounts.technician}</p>
            </article>
          </div>

        <section className="mt-6 rounded-3xl border p-5 shadow-xl backdrop-blur-md" style={{ borderColor: 'var(--border)', background: 'rgba(255, 255, 255, 0.7)' }}>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-lg">
              <Search size={16} className="absolute left-4 top-3" style={{ color: 'var(--muted)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts..."
                className="w-full rounded-xl border py-2.5 pl-11 pr-4 text-sm outline-none transition-all focus:border-orange-500"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {roleFilters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setRoleFilter(item.value)}
                  className="rounded-xl px-4 py-2 text-xs font-bold transition-all uppercase tracking-widest border"
                  style={{
                    background: roleFilter === item.value ? 'rgba(249,115,22,0.1)' : 'var(--bg-primary)',
                    color: roleFilter === item.value ? 'var(--primary)' : 'var(--text-secondary)',
                    borderColor: roleFilter === item.value ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  <th className="p-4 pl-0 text-[11px] font-black uppercase tracking-wider">User Details</th>
                  <th className="p-4 text-[11px] font-black uppercase tracking-wider">Provider</th>
                  <th className="p-4 text-[11px] font-black uppercase tracking-wider">Roles</th>
                  <th className="p-4 pr-0 text-right text-[11px] font-black uppercase tracking-wider">Manage Roles</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b transition-colors hover:bg-[rgba(249,115,22,0.04)]" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
                    <td className="p-4 pl-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} className="h-full w-full rounded-full object-cover" alt="" />
                          ) : (
                            <UserIcon size={14} style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name || 'No Name'}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email || user.githubUsername}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono uppercase" style={{ color: 'var(--text-secondary)' }}>{user.provider || 'LOCAL'}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles && user.roles.map(r => (
                          <span key={r} className="rounded-md border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: 'rgba(249,115,22,0.22)', background: 'rgba(249,115,22,0.1)', color: 'var(--primary)' }}>
                            {r.replace('ROLE_', '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 pr-0 text-right">
                      <div className="flex justify-end gap-2">
                        <RoleBtn
                          icon={<Shield size={12} />}
                          active={user.roles?.includes('ROLE_ADMIN')}
                          onClick={() => handleRoleToggle(user.id, 'ROLE_ADMIN', user.roles?.includes('ROLE_ADMIN'))}
                          label="Admin"
                        />
                        <RoleBtn
                          icon={<Wrench size={12} />}
                          active={user.roles?.includes('ROLE_TECHNICIAN')}
                          onClick={() => handleRoleToggle(user.id, 'ROLE_TECHNICIAN', user.roles?.includes('ROLE_TECHNICIAN'))}
                          label="Tech"
                        />
                        <RoleBtn
                          icon={<UserCheck size={12} />}
                          active={user.roles?.includes('ROLE_USER')}
                          onClick={() => handleRoleToggle(user.id, 'ROLE_USER', user.roles?.includes('ROLE_USER'))}
                          label="User"
                        />
                        {isAdmin() && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={currentUser?.id === user.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                            style={{
                              borderColor: 'var(--status-rejected-border)',
                              background: 'var(--status-rejected-bg)',
                              color: 'var(--status-rejected)',
                            }}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No users found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
    </div>
  );
}

const RoleBtn = ({ icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
      active ? 'hover:opacity-90' : 'hover:-translate-y-0.5'
    }`}
    style={
      active
        ? { background: 'rgba(16,185,129,0.16)', borderColor: 'rgba(16,185,129,0.32)', color: '#047857' }
        : { background: 'var(--bg-section)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
    }
  >
    {icon} {label}
  </button>
);
