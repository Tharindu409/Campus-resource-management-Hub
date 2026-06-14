import React from 'react';
import { MapPin, Clock, User } from 'lucide-react';
import { TicketStatusBadge } from './TicketStatusBadge';
import { PriorityBadge } from './PriorityBadge';

export const TicketCard = ({ ticket, onClick }) => {
  const createdAt = ticket?.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A';

  return (
    <div
      onClick={onClick}
      className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:glass-panel-strong hover:-translate-y-1 cursor-pointer group flex flex-col"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
            {ticket?.category || 'Uncategorized'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono tracking-wider opacity-80">#{String(ticket?.id ?? '').slice(0, 8)}</p>
        </div>
        <TicketStatusBadge status={ticket?.status} />
      </div>

      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 leading-relaxed flex-grow font-light">
        {ticket?.description}
      </p>

      <div className="grid grid-cols-2 gap-4 pt-5 border-t border-[var(--border)] mt-auto">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          <MapPin size={12} className="text-[var(--primary)]" />
          <span className="truncate">{ticket?.location || 'Unknown location'}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          <Clock size={12} className="text-[var(--primary-light)]" />
          <span>{createdAt}</span>
        </div>
        <div className="flex items-center">
          <PriorityBadge priority={ticket?.priority} />
        </div>
        {ticket?.assignedTechnician && (
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <User size={12} className="text-[var(--primary)]" />
            <span className="truncate">{ticket.assignedTechnician}</span>
          </div>
        )}
      </div>
    </div>
  );
};
