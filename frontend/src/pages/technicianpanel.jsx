import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardList, RefreshCcw, ShieldCheck, UserCheck, Wrench } from 'lucide-react';
import { TicketStatusBadge } from '../components/TicketStatusBadge';
import { ticketService } from '../api/ticketService';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const TECH_ROLES = ['ADMIN', 'STAFF', 'TECHNICIAN'];

const getAllowedStatusOptions = (ticketStatus) => {
  const normalizedStatus = String(ticketStatus || 'OPEN').toUpperCase();

  if (normalizedStatus === 'OPEN') {
    return ['IN_PROGRESS'];
  }

  if (normalizedStatus === 'IN_PROGRESS') {
    return ['RESOLVED'];
  }

  if (normalizedStatus === 'RESOLVED') {
    return ['CLOSED'];
  }

  return [];
};

export const TechnicianPanelPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTicketId, setSavingTicketId] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [userDisplayMap, setUserDisplayMap] = useState({});
  const activeIdentity = user?.id || '';

  const currentRole = useMemo(() => {
    if (!user?.roles?.length) return 'USER';
    if (user.roles.includes('ROLE_ADMIN')) return 'ADMIN';
    if (user.roles.includes('ROLE_STAFF')) return 'STAFF';
    if (user.roles.includes('ROLE_TECHNICIAN')) return 'TECHNICIAN';
    return 'USER';
  }, [user]);

  const isAssignedToCurrentTechnician = (ticket) => {
    const assigned = String(ticket?.assignedTechnician || '').trim().toLowerCase();
    const active = String(activeIdentity || '').trim().toLowerCase();
    return Boolean(assigned) && Boolean(active) && assigned === active;
  };

  const canManage = TECH_ROLES.includes(currentRole);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getAllTickets();
      setTickets(data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load tickets for technician workspace.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDisplayMap = async () => {
    try {
      const [usersResponse, techniciansResponse] = await Promise.all([
        authApi.getAllUsers(),
        authApi.getTechnicians()
      ]);
      
      const users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
      const technicians = Array.isArray(techniciansResponse?.data) ? techniciansResponse.data : [];
      const nextMap = {};

      users.forEach((userEntry) => {
        const id = String(userEntry?.id || '').trim();
        if (!id) return;

        const display = String(
          userEntry?.name || userEntry?.githubUsername || userEntry?.email || id,
        ).trim();

        nextMap[id] = display || id;
      });

      // Also add technicians to the map
      technicians.forEach((tech) => {
        const id = String(tech?.id || '').trim();
        if (id && !nextMap[id]) {
          const display = String(
            tech?.name || tech?.githubUsername || tech?.email || id,
          ).trim();
          nextMap[id] = display || id;
        }
      });

      setUserDisplayMap(nextMap);
    } catch {
      setUserDisplayMap({});
    }
  };

  useEffect(() => {
    loadTickets();
    loadUserDisplayMap();
  }, []);

  const updateTicketInState = (updatedTicket) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === updatedTicket.id ? { ...ticket, ...updatedTicket } : ticket)));
  };

  const getCreatedByDisplay = (createdBy) => {
    const key = String(createdBy || '').trim();
    if (!key) return 'Unknown';
    return userDisplayMap[key] || key;
  };

  const handleClaim = async (ticket) => {
    if (!canManage) {
      return;
    }

    try {
      setSavingTicketId(ticket.id);
      setError('');
      const updated = await ticketService.assignTechnician(ticket.id, activeIdentity, currentRole);
      updateTicketInState(updated || { ...ticket, assignedTechnician: activeIdentity });
    } catch (err) {
      console.error('Failed to claim ticket:', err);
      const backendMessage = err?.response?.data?.message || err?.response?.data?.detail || err?.response?.data?.error;
      setError(backendMessage || 'Failed to claim ticket.');
    } finally {
      setSavingTicketId('');
    }
  };

  const handleNextStatus = async (ticket) => {
    if (!canManage) {
      return;
    }

    const next = getAllowedStatusOptions(ticket.status)[0];
    if (!next) {
      return;
    }

    let resolutionNotes = '';
    if (next === 'RESOLVED' || next === 'CLOSED') {
      const notesInput = window.prompt('Enter resolution notes for this ticket:');
      const normalizedNotes = String(notesInput || '').trim();

      if (!normalizedNotes) {
        setError('Resolution notes are required when moving a ticket to RESOLVED/CLOSED.');
        return;
      }

      resolutionNotes = normalizedNotes;
    }

    try {
      setSavingTicketId(ticket.id);
      setError('');
      const updated = await ticketService.updateStatus(ticket.id, next, currentRole, resolutionNotes);
      updateTicketInState(updated || { ...ticket, status: next });
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      const backendMessage = err?.response?.data?.message || err?.response?.data?.detail || err?.response?.data?.error;
      setError(backendMessage || 'Failed to update ticket status.');
    } finally {
      setSavingTicketId('');
    }
  };

  const filteredTickets = useMemo(() => {
    const needle = search.toLowerCase();
    const base = tickets.filter((ticket) => isAssignedToCurrentTechnician(ticket));

    return base.filter((ticket) => (
      String(ticket.category || '').toLowerCase().includes(needle)
      || String(ticket.location || '').toLowerCase().includes(needle)
      || String(ticket.description || '').toLowerCase().includes(needle)
      || String(ticket.createdBy || '').toLowerCase().includes(needle)
      || String(getCreatedByDisplay(ticket.createdBy)).toLowerCase().includes(needle)
    ));
  }, [tickets, search, activeIdentity, userDisplayMap]);

  const assignedToMe = filteredTickets;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 relative page-enter">
      <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.1)_0%,_rgba(249,115,22,0)_70%)] opacity-60 blur-3xl shadow-none" />
      
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between relative z-10">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
            <Wrench size={12} style={{ color: 'var(--accent-indigo)' }} />
            Technician Workspace
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-rose-500">Action Queue</h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Focused board for your assigned work and available tickets.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadTickets}
            className="flex items-center gap-2 glass-panel px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 border"
            style={{ color: 'var(--text-primary)', borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
          >
            <RefreshCcw size={14} style={{ color: 'var(--primary)' }} />
            Refresh Queue
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 glass-panel border-rose-500/30 bg-rose-500/10 p-5 rounded-2xl text-sm font-semibold text-rose-300">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-panel-strong rounded-3xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--border)' }}>
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <UserCheck size={80} style={{ color: 'var(--primary)' }} />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest relative z-10" style={{ color: 'var(--text-secondary)' }}>Logged in Technician</p>
          <p className="mt-1 text-base font-bold relative z-10 truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || getCreatedByDisplay(activeIdentity)}</p>
        </div>
        <div className="glass-panel-strong rounded-3xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--border)' }}>
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ClipboardList size={80} style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest relative z-10" style={{ color: 'var(--text-secondary)' }}>Assigned to me</p>
          <p className="mt-1 text-3xl font-black relative z-10" style={{ color: 'var(--accent-indigo)' }}>{assignedToMe.length}</p>
        </div>
      </div>

      <div className="mb-6 glass-panel rounded-2xl p-3 shadow-lg backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid var(--border)' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by category, location, or creator..."
          className="w-full glass-input rounded-xl px-5 py-3 text-sm outline-none font-medium border"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-56 animate-pulse glass-panel rounded-2xl" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border-dashed" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', borderStyle: 'dashed' }}>
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(249, 115, 22, 0.05)' }}>
             <CheckCircle2 size={24} style={{ color: 'var(--muted)' }} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Queue is clear</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => {
            const mine = isAssignedToCurrentTechnician(ticket);
            const canAdvance = mine && getAllowedStatusOptions(ticket.status).length > 0;
            const nextStatus = getAllowedStatusOptions(ticket.status)[0];
            const isSaving = savingTicketId === ticket.id;

            return (
              <div key={ticket.id} className="glass-panel p-5 shadow-lg rounded-3xl flex flex-col group hover:scale-[1.01] transition-all duration-300 relative overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.7)', border: '1px solid var(--border)' }}>
                {mine && (
                  <div className="absolute top-0 right-0 h-1.5 w-full" style={{ background: 'linear-gradient(90deg, var(--accent-start), var(--accent-end))' }} />
                )}
                
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                       <span className="text-[9px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--text-secondary)' }}>{ticket.category || 'Ticket'}</span>
                       {mine && (
                         <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full" style={{ background: 'var(--status-approved-bg)', color: 'var(--status-approved)', border: '1px solid var(--status-approved-border)' }}>
                           <ShieldCheck size={8} /> Your Ticket
                         </span>
                       )}
                    </div>
                    <h3 className="text-base font-extrabold uppercase tracking-tight truncate group-hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{ticket.location || 'No location'}</h3>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </div>

                <p className="line-clamp-2 text-xs font-medium leading-relaxed flex-grow opacity-80" style={{ color: 'var(--text-secondary)' }}>{ticket.description || 'No description provided.'}</p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-[9px] font-bold uppercase tracking-wider border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p style={{ color: 'var(--muted)' }}>From</p>
                    <p className="mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{getCreatedByDisplay(ticket.createdBy)}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: 'var(--muted)' }}>Assigned To</p>
                    <p className="mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{ticket.assignedTechnician ? (userDisplayMap[ticket.assignedTechnician] || 'Technician') : 'Unassigned'}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 pt-2">
                  {!mine && !ticket.assignedTechnician && (
                    <button
                      type="button"
                      disabled={!canManage || isSaving}
                      onClick={() => handleClaim(ticket)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, var(--status-approved), #059669)' }}
                    >
                      <UserCheck size={12} />
                      {isSaving ? '...' : 'Claim'}
                    </button>
                  )}

                  {canAdvance && (
                    <button
                      type="button"
                      disabled={!canManage || isSaving}
                      onClick={() => handleNextStatus(ticket)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}
                    >
                      <RefreshCcw size={12} />
                      {isSaving ? '...' : nextStatus.replace('_', ' ')}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl glass-panel px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all hover:glass-panel-strong border"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
                  >
                    <ClipboardList size={12} />
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
