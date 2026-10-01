import React, { useEffect, useMemo, useState } from 'react';
import { Shield, RefreshCcw, Search, UserCheck, Wrench, Trash2, CheckCircle2, Clock3, AlertTriangle, XCircle } from 'lucide-react';
import { TicketStatusBadge } from '../components/TicketStatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ticketService } from '../api/ticketService';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const PRIVILEGED_ROLES = ['ADMIN', 'STAFF', 'TECHNICIAN'];

function formatTicketDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const getAllowedStatusOptions = (ticketStatus, role) => {
  const normalizedStatus = String(ticketStatus || 'OPEN').toUpperCase();
  const normalizedRole = String(role || 'USER').toUpperCase();

  if (normalizedStatus === 'OPEN') {
    return normalizedRole === 'ADMIN' ? ['IN_PROGRESS', 'REJECTED'] : ['IN_PROGRESS'];
  }

  if (normalizedStatus === 'IN_PROGRESS') {
    return normalizedRole === 'ADMIN' ? ['RESOLVED', 'REJECTED'] : ['RESOLVED'];
  }

  if (normalizedStatus === 'RESOLVED') {
    return normalizedRole === 'ADMIN' ? ['CLOSED', 'REJECTED'] : ['CLOSED'];
  }

  return [];
};

export const AdminPanelPage = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [technician, setTechnician] = useState('');
  const [technicianOptions, setTechnicianOptions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userDisplayMap, setUserDisplayMap] = useState({});
  const { user } = useAuth();

  const currentRole = useMemo(() => {
    if (!user?.roles?.length) return 'USER';
    if (user.roles.includes('ROLE_ADMIN')) return 'ADMIN';
    if (user.roles.includes('ROLE_STAFF')) return 'STAFF';
    if (user.roles.includes('ROLE_TECHNICIAN')) return 'TECHNICIAN';
    return 'USER';
  }, [user]);
  const canManage = PRIVILEGED_ROLES.includes(currentRole);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [tickets, selectedTicketId],
  );

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getAllTickets();
      setTickets(data || []);
      if (!selectedTicketId && data?.length) {
        setSelectedTicketId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load all tickets.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDisplayMap = async () => {
    try {
      const response = await authApi.getAllUsers();
      const users = Array.isArray(response?.data) ? response.data : [];
      const nextMap = {};

      users.forEach((user) => {
        const id = String(user?.id || '').trim();
        if (!id) return;

        const display = String(
          user?.name || user?.githubUsername || user?.email || id
        ).trim();

        nextMap[id] = display || id;
      });

      setUserDisplayMap(nextMap);
    } catch {
      setUserDisplayMap({});
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await authApi.getTechnicians();
      const technicians = Array.isArray(response?.data) ? response.data : [];
      setTechnicianOptions(technicians);
    } catch {
      setTechnicianOptions([]);
    }
  };

  useEffect(() => {
    loadTickets();
    loadUserDisplayMap();
    loadTechnicians();
  }, []);

  const getCreatedByDisplay = (createdBy) => {
    const key = String(createdBy || '').trim();
    if (!key) return 'Unknown';
    return userDisplayMap[key] || key;
  };

  const getTechnicianDisplay = (technicianOption) => {
    const name = String(technicianOption?.name || '').trim();
    const username = String(technicianOption?.githubUsername || '').trim();
    const id = String(technicianOption?.id || '').trim();

    if (name && id) {
      return `${name} (${id})`;
    }

    return name || username || id || 'Unknown Technician';
  };

  useEffect(() => {
    if (!selectedTicket) {
      setTechnician('');
      return;
    }

    setTechnician(String(selectedTicket.assignedTechnician || '').trim());

    const allowed = getAllowedStatusOptions(selectedTicket.status, currentRole);
    setSelectedStatus((current) => (allowed.includes(current) ? current : allowed[0] || ''));
  }, [selectedTicket, currentRole]);

  const refreshSelected = async () => {
    if (!selectedTicketId) {
      return;
    }

    await loadTickets();
  };

  const handleAssign = async () => {
    if (!selectedTicket || !technician.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      await ticketService.assignTechnician(selectedTicket.id, technician.trim(), currentRole);
      setTechnician('');
      await loadTickets();
    } catch (err) {
      console.error('Failed to assign technician:', err);
      const backendMessage = err?.response?.data?.message || err?.response?.data?.detail || err?.response?.data?.error;
      setError(backendMessage || 'Failed to assign technician.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedTicket) {
      return;
    }

    const allowed = getAllowedStatusOptions(selectedTicket.status, currentRole);
    if (!allowed.includes(selectedStatus)) {
      setError('That status is not allowed from the ticket current state.');
      return;
    }

    if (selectedStatus === 'REJECTED' && !rejectionReason.trim()) {
      setError('Rejection reason is required when rejecting a ticket.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await ticketService.updateStatus(
        selectedTicket.id,
        selectedStatus,
        currentRole,
        resolutionNotes,
        rejectionReason,
      );
      setResolutionNotes('');
      setRejectionReason('');
      await loadTickets();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      const backendMessage = err?.response?.data?.message || err?.response?.data?.detail || err?.response?.data?.error;
      setError(backendMessage || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) {
      return;
    }

    const confirmDelete = window.confirm(
      `Delete ticket "${selectedTicket.category || 'Ticket'}" from ${selectedTicket.location || 'unknown location'}? This cannot be undone.`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      await ticketService.deleteTicket(selectedTicket.id, currentRole);
      const remainingTickets = tickets.filter((ticket) => ticket.id !== selectedTicket.id);
      setTickets(remainingTickets);
      setSelectedTicketId(remainingTickets[0]?.id || '');
      await loadTickets();
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      const backendMessage = err?.response?.data?.message || err?.response?.data?.detail || err?.response?.data?.error;
      setError(backendMessage || 'Failed to delete ticket.');
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const needle = search.toLowerCase();
    const statusMatches = statusFilter === 'ALL' || String(ticket.status || '').toUpperCase() === statusFilter;
    return (
      statusMatches &&
      (
        String(ticket.category || '').toLowerCase().includes(needle) ||
        String(ticket.location || '').toLowerCase().includes(needle) ||
        String(ticket.description || '').toLowerCase().includes(needle) ||
        String(ticket.createdBy || '').toLowerCase().includes(needle) ||
        String(getCreatedByDisplay(ticket.createdBy)).toLowerCase().includes(needle) ||
        String(ticket.priority || '').toLowerCase().includes(needle) ||
        String(ticket.assignedTechnician || '').toLowerCase().includes(needle)
      )
    );
  });

  useEffect(() => {
    if (filteredTickets.some((ticket) => ticket.id === selectedTicketId)) return;
    setSelectedTicketId(filteredTickets[0]?.id || '');
  }, [filteredTickets, selectedTicketId]);

  const statusTotals = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        const key = String(ticket.status || 'OPEN').toUpperCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0, REJECTED: 0 },
    );
  }, [tickets]);

  const statusCards = [
    { status: 'ALL', label: 'All tickets', value: tickets.length, icon: <Shield size={16} />, color: 'var(--text-primary)', bg: 'var(--bg-section)' },
    { status: 'OPEN', label: 'Open', value: statusTotals.OPEN, icon: <Clock3 size={16} />, color: 'var(--status-pending)', bg: 'var(--status-pending-bg)' },
    { status: 'IN_PROGRESS', label: 'In progress', value: statusTotals.IN_PROGRESS, icon: <Wrench size={16} />, color: 'var(--primary)', bg: 'rgba(249,115,22,0.1)' },
    { status: 'RESOLVED', label: 'Resolved', value: statusTotals.RESOLVED, icon: <CheckCircle2 size={16} />, color: 'var(--status-approved)', bg: 'var(--status-approved-bg)' },
    { status: 'CLOSED', label: 'Closed', value: statusTotals.CLOSED, icon: <CheckCircle2 size={16} />, color: 'var(--text-secondary)', bg: 'var(--bg-section)' },
    { status: 'REJECTED', label: 'Rejected', value: statusTotals.REJECTED, icon: <XCircle size={16} />, color: 'var(--status-rejected)', bg: 'var(--status-rejected-bg)' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <section className="rounded-3xl border p-4 md:p-6" style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(249,250,251,0.94))' }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ borderColor: 'rgba(99, 102, 241, 0.22)', color: 'var(--accent-indigo)', background: 'rgba(99, 102, 241, 0.06)' }}>
              <Shield size={10} /> Admin Ticket Control
            </p>
            <h1 className="mt-2 text-2xl font-black md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#C4B5FD]">Incident Operations Desk</h1>
            
          </div>

          <button
            type="button"
            onClick={refreshSelected}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-secondary)' }}
          >
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-6">
          {statusCards.map((card) => (
            <button
              key={card.status}
              type="button"
              onClick={() => setStatusFilter(card.status)}
              aria-pressed={statusFilter === card.status}
              className="flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-orange-300"
              style={{
                borderColor: statusFilter === card.status ? 'var(--primary)' : 'var(--border)',
                background: statusFilter === card.status ? 'rgba(249,115,22,0.07)' : 'rgba(255,255,255,0.92)',
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold leading-none" style={{ color: 'var(--text-secondary)' }}>{card.label}</p>
                <p className="mt-1 text-lg font-black leading-none" style={{ color: card.color }}>{card.value}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: 'rgba(239,68,68,0.38)', background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.65fr)]">
        <div className="flex h-[min(75vh,52rem)] min-h-[24rem] flex-col rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.96)' }}>
          <div className="mb-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Ticket queue</h2>
              <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>{filteredTickets.length} of {tickets.length}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                <Search size={18} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search tickets"
                  placeholder="Search tickets, location, requester, priority..."
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-2xl" style={{ background: 'var(--bg-section)' }} />
              ))}
            </div>
          ) : (
            <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1.5">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  aria-pressed={selectedTicketId === ticket.id}
                  className={`group w-full rounded-xl border p-3.5 text-left transition-colors ${
                    selectedTicketId === ticket.id ? 'border-orange-400 bg-orange-50' : 'border-[var(--border)] bg-white hover:bg-[var(--bg-section)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ticket.category || 'General issue'}</p>
                      <p className="mt-1 truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{ticket.location || 'No location provided'}</p>
                    </div>
                    <TicketStatusBadge status={ticket.status} />
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-5" style={{ color: 'var(--text-secondary)' }}>{ticket.description || 'No description provided.'}</p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatTicketDate(ticket.createdAt)}</span>
                  </div>
                  <div className="mt-2 flex min-w-0 items-center justify-between gap-3 text-xs">
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>By {getCreatedByDisplay(ticket.createdBy)}</span>
                    <span className="max-w-[50%] truncate text-right" style={{ color: 'var(--text-secondary)' }}>
                      {ticket.assignedTechnician ? `Assigned: ${userDisplayMap[ticket.assignedTechnician] || ticket.assignedTechnician}` : 'Unassigned'}
                    </span>
                  </div>
                </button>
              ))}
              {filteredTickets.length === 0 && (
                <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No tickets match these filters.</p>
                  {(search || statusFilter !== 'ALL') && (
                    <button type="button" onClick={() => { setSearch(''); setStatusFilter('ALL'); }} className="mt-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {!selectedTicket ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border p-12 text-center" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.94)', color: 'var(--text-secondary)' }}>
              <div className="mb-4 rounded-full p-4" style={{ background: 'var(--bg-section)' }}>
                 <Shield size={32} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <p className="text-lg font-semibold tracking-wide">Select a ticket to manage it.</p>
            </div>
          ) : (
            <>
              <div className="rounded-3xl border p-8" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                <div className="flex flex-col gap-5 border-b pb-6 md:flex-row md:items-start md:justify-between" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="mb-1 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Selected Ticket</p>
                    <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {selectedTicket.category || 'Ticket'}
                    </h2>
                    <p className="mt-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{selectedTicket.location || 'No location provided'}</p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <TicketStatusBadge status={selectedTicket.status} />
                    <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-section)' }}>
                      {selectedTicket.priority ? selectedTicket.priority.replace('_', ' ') : 'Priority N/A'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-3xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Created By</p>
                    <p className="mt-2 text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{getCreatedByDisplay(selectedTicket.createdBy)}</p>
                  </div>
                  <div className="rounded-3xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Technician</p>
                    <p className="mt-2 text-sm font-semibold truncate" style={{ color: 'var(--primary)' }}>{selectedTicket.assignedTechnician ? (userDisplayMap[selectedTicket.assignedTechnician] || selectedTicket.assignedTechnician) : 'Unassigned'}</p>
                  </div>
                  <div className="rounded-3xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Contact</p>
                    <p className="mt-2 text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{selectedTicket.preferredContact || 'N/A'}</p>
                  </div>
                  <div className="rounded-3xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Last Updated</p>
                    <p className="mt-2 text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{selectedTicket.updatedAt ? new Date(selectedTicket.updatedAt).toLocaleString() : 'Unknown'}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                  <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Issue Summary</p>
                  <p className="mt-4 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>{selectedTicket.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-3xl border p-8" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                  <h3 className="mb-6 flex items-center gap-3 border-b pb-5 text-xs font-black uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <UserCheck size={18} style={{ color: 'var(--status-approved)' }} />
                    Assign Technician
                  </h3>
                  <div className="space-y-4">
                    <select
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      disabled={!canManage || saving}
                      className="w-full cursor-pointer rounded-2xl border px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                    >
                      <option value="">Select technician</option>
                      {technicianOptions.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {getTechnicianDisplay(tech)}
                        </option>
                      ))}
                    </select>

                    {technicianOptions.length === 0 && (
                      <p className="text-xs font-semibold" style={{ color: 'var(--status-pending)' }}>
                        No technicians found in database. Add users with ROLE_TECHNICIAN.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleAssign}
                      disabled={!canManage || saving || !technician.trim() || technicianOptions.length === 0}
                      className="w-full rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, var(--status-approved), #0f766e)' }}
                    >
                      {saving ? 'Saving...' : 'Assign Technician'}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border p-8" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                  <h3 className="mb-6 flex items-center gap-3 border-b pb-5 text-xs font-black uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <Wrench size={18} style={{ color: 'var(--primary)' }} />
                    Update Status
                  </h3>
                  <div className="space-y-4">
                    <p className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)', background: 'var(--bg-section)' }}>
                      <AlertTriangle size={12} style={{ color: 'var(--status-pending)' }} />
                      Allowed transitions: {getAllowedStatusOptions(selectedTicket.status, currentRole).join(', ') || 'none'}
                    </p>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={!canManage || saving}
                      className="w-full cursor-pointer rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-wider outline-none disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                    >
                      {getAllowedStatusOptions(selectedTicket.status, currentRole).map((status) => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Resolution notes"
                      disabled={!canManage || saving}
                      rows={3}
                      className="w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                    />
                    {selectedStatus === 'REJECTED' && (
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Rejection reason"
                        disabled={!canManage || saving}
                        rows={3}
                        className="w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none disabled:opacity-50"
                        style={{ borderColor: 'rgba(239,68,68,0.38)', background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={!canManage || saving || !selectedStatus}
                      className="w-full rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
                    >
                      {saving ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border p-8" style={{ borderColor: 'rgba(239,68,68,0.36)', background: 'rgba(239,68,68,0.08)' }}>
                <h3 className="mb-4 flex items-center gap-3 text-[11px] font-black uppercase tracking-wider" style={{ color: '#dc2626' }}>
                  <Trash2 size={16} />
                  Admin Delete
                </h3>
                <p className="mb-6 text-sm" style={{ color: '#b91c1c' }}>
                  Delete this ticket permanently. This action is limited to ADMIN and cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  disabled={currentRole !== 'ADMIN' || saving}
                  className="w-full rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 sm:w-auto"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                >
                  {saving ? 'Deleting...' : 'Delete Ticket'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
