import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { getCurrentUserId, setCurrentUserId, ticketService } from '../api/ticketService';
import { TicketCard } from '../components/ticketCard';

export const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [testUserInput, setTestUserInput] = useState(getCurrentUserId() || '');
  const [identityVersion, setIdentityVersion] = useState(0);

  useEffect(() => {
    const fetchTickets = async () => {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        setError('No current user found. Set localStorage currentUser, userId, or username.');
        return;
      }

      try {
        const data = await ticketService.getMyTickets(currentUserId);
        setTickets(data);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
        setError('Failed to fetch tickets. Check backend availability and user identity.');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [identityVersion]);

  const applyTestUser = () => {
    if (!setCurrentUserId(testUserInput)) {
      setError('Enter a valid user id before continuing.');
      return;
    }

    setError('');
    setLoading(true);
    setIdentityVersion((prev) => prev + 1);
  };

  const filteredTickets = tickets.filter((t) => 
    String(t.category || '').toLowerCase().includes(search.toLowerCase()) ||
    String(t.description || '').toLowerCase().includes(search.toLowerCase()) ||
    String(t.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 page-enter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-600">Incident Tickets</h1>
          <p className="mt-2 font-bold uppercase text-[10px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>Track and manage your reported issues.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/create-ticket')}
            className="text-white font-bold px-8 py-3.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-3 uppercase tracking-wider text-xs"
            style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))', boxShadow: '0 10px 24px rgba(249, 115, 22, 0.28)' }}
          >
            <Plus size={20} />
            New Ticket
          </button>
        </div>
      </div>

      {!getCurrentUserId() && (
        <div className="mb-6 glass-panel border-amber-500/30 bg-amber-500/10 p-6 rounded-2xl backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Testing Mode User Setup</p>
          <p className="mt-1 text-sm text-amber-700/80">Login module is not connected yet. Set a temporary user id to load tickets.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={testUserInput}
              onChange={(e) => setTestUserInput(e.target.value)}
              placeholder="e.g. wd23-student"
              className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={applyTestUser}
              className="bg-amber-500 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
            >
              Use This User
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 mb-10 flex flex-col md:flex-row gap-4 shadow-lg backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search tickets by category, location, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 glass-input rounded-xl text-sm outline-none transition-all font-medium border"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-2">
          <button className="p-3.5 glass-panel rounded-xl text-slate-400 hover:glass-panel-strong transition-all" style={{ border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <div className="h-full w-px mx-1" style={{ background: 'var(--border)' }} />
          <button className="p-3.5 rounded-xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))', boxShadow: '0 8px 18px rgba(249, 115, 22, 0.24)' }}>
            <LayoutGrid size={18} />
          </button>
          <button className="p-3.5 glass-panel rounded-xl transition-all" style={{ border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            <List size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 glass-panel animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-24 glass-card rounded-2xl border-dashed border-rose-500/30 backdrop-blur-md">
          <h3 className="text-xl font-bold uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Unable to load tickets</h3>
          <p className="mt-3 max-w-lg mx-auto font-medium" style={{ color: 'var(--status-rejected)' }}>{error}</p>
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTickets.map((ticket) => (
            <TicketCard 
              onClick={() => navigate(`/tickets/${ticket.id}`)}
              key={ticket.id} 
              ticket={ticket} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-card rounded-2xl border-dashed border-white/20 backdrop-blur-md">
          <div className="w-20 h-20 glass-panel-strong rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Search size={32} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>No tickets found</h3>
          <p className="mt-3 max-w-xs mx-auto font-medium" style={{ color: 'var(--text-secondary)' }}>
            {search ? "We couldn't find any tickets matching your search criteria." : "You haven't reported any incidents yet."}
          </p>
          {!search && (
            <button
              onClick={() => navigate('/create-ticket')}
              className="mt-8 font-bold uppercase tracking-widest text-xs transition-colors px-6 py-3 rounded-xl"
              style={{ color: 'var(--primary)', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)' }}
            >
              Report your first incident
            </button>
          )}
        </div>
      )}
    </div>
  );
};
