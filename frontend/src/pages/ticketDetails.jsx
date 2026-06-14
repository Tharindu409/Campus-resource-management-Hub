import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Calendar,
  MapPin,
  FileText,
  Image as ImageIcon,
  MessageCircleWarning,
  Wrench,
  Timer,
  Clock,
  X
} from 'lucide-react';
import { getCurrentUserId, getCurrentUserRole, ticketService } from '../api/ticketService';
import { authApi } from '../api/authApi';
import { API_BASE_URL } from '../api/httpClient';
import { useAuth } from '../context/AuthContext';
import { TicketStatusBadge } from '../components/TicketStatusBadge';
import { CommentSection } from '../components/commentSection';

const cn = (...values) => values.filter(Boolean).join(' ');

const UPDATE_STATUSES = ['IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const PRIVILEGED_ROLES = ['ADMIN', 'STAFF', 'TECHNICIAN'];

export const TicketDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [technician, setTechnician] = useState('');
  const [technicianOptions, setTechnicianOptions] = useState([]);
  const [userDisplayMap, setUserDisplayMap] = useState({});
  const [assigning, setAssigning] = useState(false);
  const [selectedModalImage, setSelectedModalImage] = useState(null);
  const currentUserId = user?.id || '';
  const currentUserRole = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    if (roles.includes('ROLE_ADMIN')) return 'ADMIN';
    if (roles.includes('ROLE_STAFF')) return 'STAFF';
    if (roles.includes('ROLE_TECHNICIAN')) return 'TECHNICIAN';
    if (roles.includes('ROLE_USER')) return 'USER';
    return getCurrentUserRole();
  }, [user]);
  const canManageTicket = PRIVILEGED_ROLES.includes(currentUserRole);
  const hasSidePanel = canManageTicket || Boolean(ticket?.assignedTechnician);
  const currentUserName = useMemo(() => {
    const candidate = user?.name || user?.githubUsername || user?.email || '';
    return String(candidate).trim();
  }, [user]);
  const currentUserIdentitySet = useMemo(() => {
    return new Set(
      [
        currentUserId,
        user?.id,
        user?.email,
        user?.githubUsername,
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    );
  }, [currentUserId, user]);
  const currentCommentIdentityId = user?.id || '';

  const createdByDisplayName = useMemo(() => {
    const createdBy = String(ticket?.createdBy || '').trim();
    if (!createdBy) {
      return 'N/A';
    }

    const mapped = String(userDisplayMap[createdBy] || '').trim();
    if (mapped) {
      return mapped;
    }

    if (currentUserIdentitySet.has(createdBy) && currentUserName) {
      return currentUserName;
    }

    return createdBy;
  }, [ticket?.createdBy, currentUserIdentitySet, currentUserName, userDisplayMap]);

  const mapCommentForUI = (comment) => ({
    id: String(comment.id),
    text: comment.content || '',
    authorName: comment.authorName || comment.authorId || 'Unknown',
    authorId: comment.authorId || '',
    createdAt: comment.createdAt || new Date().toISOString(),
    isOwner: Boolean(comment.isOwner),
  });

  const loadComments = useCallback(async (ticketId) => {
    const commentData = await ticketService.getTicketComments(ticketId);
    setComments((commentData || []).map(mapCommentForUI));
  }, []);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) {
        setError('Invalid ticket id.');
        setLoading(false);
        return;
      }

      try {
        const [ticketData, attachmentData] = await Promise.all([
          ticketService.getTicketById(id),
          ticketService.getTicketAttachments(id),
        ]);
        setTicket(ticketData);
        setAttachments(attachmentData || []);
        await loadComments(id);
      } catch (err) {
        console.error('Failed to fetch ticket:', err);
        setError('Failed to load ticket details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, loadComments]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await authApi.getAllUsers();
        const users = Array.isArray(response?.data) ? response.data : [];
        const nextMap = {};

        users.forEach((userEntry) => {
          const id = String(userEntry?.id || '').trim();
          if (!id) return;

          const display = String(
            userEntry?.name || userEntry?.githubUsername || userEntry?.email || id,
          ).trim();

          nextMap[id] = display || id;
        });

        setUserDisplayMap(nextMap);
      } catch {
        setUserDisplayMap({});
      }
    };

    loadUsers();

    const loadTechnicians = async () => {
      try {
        const response = await authApi.getTechnicians();
        const technicians = Array.isArray(response?.data) ? response.data : [];
        setTechnicianOptions(technicians);
        
        // Also add technicians to userDisplayMap for proper name resolution
        setUserDisplayMap((prevMap) => {
          const updatedMap = { ...prevMap };
          technicians.forEach((tech) => {
            const id = String(tech?.id || '').trim();
            if (id) {
              const display = String(
                tech?.name || tech?.githubUsername || tech?.email || id,
              ).trim();
              updatedMap[id] = display || id;
            }
          });
          return updatedMap;
        });
      } catch {
        setTechnicianOptions([]);
      }
    };

    loadTechnicians();
  }, []);

  useEffect(() => {
    if (!ticket) {
      setTechnician('');
      return;
    }

    setTechnician(String(ticket.assignedTechnician || '').trim());
  }, [ticket]);

  const getTechnicianDisplay = (technicianOption) => {
    const name = String(technicianOption?.name || '').trim();
    const username = String(technicianOption?.githubUsername || '').trim();
    const idValue = String(technicianOption?.id || '').trim();

    if (name && idValue) {
      return `${name} (${idValue})`;
    }

    return name || username || idValue || 'Unknown Technician';
  };

  const handleAddComment = async (text) => {
    if (!id) {
      return;
    }

    try {
      const actingIdentityId = String(getCurrentUserId() || user?.id || '').trim();
      const actingTech = technicianOptions.find(
        (tech) => String(tech?.id || '').trim() === actingIdentityId,
      );
      const actingIdentityName = String(
        actingTech?.name || actingTech?.githubUsername || currentUserName || actingIdentityId,
      ).trim();
      const actingIdentityRole = actingTech ? 'TECHNICIAN' : currentUserRole;

      await ticketService.addComment(id, text, {
        actorId: actingIdentityId,
        actorName: actingIdentityName,
        actorRole: actingIdentityRole,
      });
      await loadComments(id);
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!id) {
      return;
    }

    try {
      await ticketService.deleteComment(commentId);
      await loadComments(id);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment.');
    }
  };

  const handleUpdateComment = async (commentId, text) => {
    if (!id) {
      return;
    }

    try {
      const actingIdentityId = String(getCurrentUserId() || user?.id || '').trim();
      const actingTech = technicianOptions.find(
        (tech) => String(tech?.id || '').trim() === actingIdentityId,
      );
      const actingIdentityName = String(
        actingTech?.name || actingTech?.githubUsername || currentUserName || actingIdentityId,
      ).trim();
      const actingIdentityRole = actingTech ? 'TECHNICIAN' : currentUserRole;

      await ticketService.updateComment(commentId, text, {
        actorId: actingIdentityId,
        actorName: actingIdentityName,
        actorRole: actingIdentityRole,
      });
      await loadComments(id);
    } catch (err) {
      console.error('Failed to update comment:', err);
      setError('Failed to update comment.');
    }
  };

  const handleUpdateStatus = async () => {
    if (!id || !ticket || statusUpdating || !canManageTicket) {
      return;
    }

    if (selectedStatus === 'REJECTED' && !rejectionReason.trim()) {
      setError('Rejection reason is required when setting status to REJECTED.');
      return;
    }

    setStatusUpdating(true);
    setError('');
    try {
      const updated = await ticketService.updateStatus(
        id,
        selectedStatus,
        currentUserRole,
        resolutionNotes,
        rejectionReason,
      );
      setTicket(updated || { ...ticket, status: selectedStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      const backendMessage = err?.response?.data?.message || err?.response?.data?.error;
      setError(backendMessage || 'Failed to update ticket status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!id || !canManageTicket || !technician.trim()) {
      return;
    }

    setAssigning(true);
    setError('');
    try {
      const updated = await ticketService.assignTechnician(id, technician.trim(), currentUserRole);
      setTicket(updated || { ...ticket, assignedTechnician: technician.trim() });
      setTechnician('');
    } catch (err) {
      console.error('Failed to assign technician:', err);
      const backendMessage = err?.response?.data?.message || err?.response?.data?.error;
      setError(backendMessage || 'Failed to assign technician.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: 'var(--primary)' }} />
      </div>
    );
  }

  const getSlaTiming = (start, end) => {
    if (!start) return 'N/A';
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    const diff = e - s; 
    
    if (diff < 0) return '0m';
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center glass-panel mt-12 rounded-3xl border-dashed border-rose-500/30">
        <h2 className="text-2xl font-bold uppercase tracking-tight text-slate-100">{error}</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 rounded-xl bg-rose-500 text-white font-bold uppercase tracking-widest px-6 py-3 shadow-lg shadow-rose-500/20 hover:scale-105 transition-all text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black">Ticket not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 border border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-3 py-6 relative page-enter">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.1)_0%,_rgba(249,115,22,0)_70%)] opacity-60 blur-3xl shadow-none" />

      <button
        onClick={() => navigate(-1)}
        className="group mb-6 inline-flex items-center gap-2 transition-colors glass-panel px-3 py-1.5 rounded-lg border"
        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Back</span>
      </button>

      <div className={cn('grid grid-cols-1 gap-10 relative z-10', hasSidePanel ? 'lg:grid-cols-3' : 'max-w-4xl mx-auto')}>
        <div className={cn('space-y-6', hasSidePanel ? 'lg:col-span-2' : '')}>
          <div className="glass-panel rounded-3xl p-5 shadow-xl backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.7)', border: '1px solid var(--border)' }}>
            <div className="mb-4 flex items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h1 className="text-xl font-extrabold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-600">{ticket.category || 'Ticket'}</h1>
                <p className="text-[10px] font-bold font-mono tracking-wider" style={{ color: 'var(--muted)' }}>#{ticket.id}</p>
              </div>
              <div className="scale-125 origin-right">
                <TicketStatusBadge status={ticket.status} />
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-3 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <User size={12} style={{ color: 'var(--accent-indigo)' }} />
                <span>By: {createdByDisplayName}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <Calendar size={12} style={{ color: 'var(--accent-purple)' }} />
                <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <MapPin size={12} style={{ color: 'var(--accent-rose)' }} />
                <span className="max-w-[150px] truncate">{ticket.location || 'N/A'}</span>
              </div>
            </div>

            {/* Service-Level Agreement Timers (SLA) */}
            
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="glass-panel-strong p-4 rounded-2xl relative overflow-hidden group" style={{ background: 'var(--status-approved-bg)', border: '1px solid var(--status-approved-border)' }}>
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Clock size={60} style={{ color: 'var(--status-approved)' }} />
                </div>
                <div className="flex items-center justify-between relative z-10">
                   <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>Time to Response</p>
                      <h4 className="text-lg font-black" style={{ color: 'var(--status-approved)' }}>{getSlaTiming(ticket.createdAt, ticket.firstRespondedAt)}</h4>
                   </div>
                   <div className="p-2 rounded-xl border" style={{ background: 'var(--bg-primary)', borderColor: 'var(--status-approved-border)' }}>
                     <Timer size={14} style={{ color: 'var(--status-approved)' }} />
                   </div>
                </div>
                <p className="text-[8px] uppercase font-bold mt-1.5 relative z-10 tracking-wider" style={{ color: 'var(--status-approved)', opacity: 0.6 }}>
                  {ticket.firstRespondedAt ? 'Responded' : 'Awaiting Response'}
                </p>
              </div>

              <div className="glass-panel-strong p-4 rounded-2xl relative overflow-hidden group" style={{ background: 'rgba(249, 115, 22, 0.06)', border: '1px solid var(--border)' }}>
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CheckCircle2 size={60} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex items-center justify-between relative z-10">
                   <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>Time to Resolution</p>
                      <h4 className="text-lg font-black" style={{ color: 'var(--primary)' }}>{getSlaTiming(ticket.createdAt, ticket.resolvedAt)}</h4>
                   </div>
                   <div className="p-2 rounded-xl border" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
                     <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} />
                   </div>
                </div>
                <p className="text-[8px] uppercase font-bold mt-1.5 relative z-10 tracking-wider" style={{ color: 'var(--primary)', opacity: 0.6 }}>
                  {ticket.resolvedAt ? 'Resolved' : 'Ongoing'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                <FileText size={16} style={{ color: 'var(--primary)' }} />
                Description
              </h3>
              <p className="glass-panel p-4 rounded-2xl text-sm font-light leading-relaxed" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {ticket.description || 'No description provided.'}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="glass-panel p-4 rounded-2xl border-l-[3px]" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeftColor: 'var(--primary)', borderLeftWidth: '3px' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Preferred Contact</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{ticket.preferredContact || 'N/A'}</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border-l-[3px]" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeftColor: 'var(--status-approved)', borderLeftWidth: '3px' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Resolution Notes</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{ticket.resolutionNotes || 'N/A'}</p>
              </div>
            </div>

            {ticket.status === 'REJECTED' && (
              <div className="mt-6 border border-rose-500/30 bg-rose-500/10 p-5 rounded-2xl backdrop-blur-md">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-400">
                  <MessageCircleWarning size={14} />
                  Rejection Reason
                </p>
                <p className="mt-2 text-sm font-semibold text-rose-200">{ticket.rejectionReason || 'N/A'}</p>
              </div>
            )}

            <div className="mt-8">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                <ImageIcon size={14} style={{ color: 'var(--accent-cyan)' }} />
                Attachments ({attachments.length})
              </h3>

              {attachments.length === 0 ? (
                <p className="text-[10px] font-medium p-3 rounded-xl glass-panel" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--muted)' }}>No attachments uploaded for this ticket.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <button
                      key={attachment.id}
                      type="button"
                      onClick={() => setSelectedModalImage(attachment)}
                      className="group flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg border transition-all hover:glass-panel-strong hover:scale-105 active:scale-95"
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                    >
                      <div className="h-6 w-6 overflow-hidden rounded bg-slate-100 flex items-center justify-center border" style={{ borderColor: 'var(--border)' }}>
                        <img 
                          src={`${API_BASE_URL}/uploads/${attachment.fileName}`} 
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <ImageIcon size={10} className="text-cyan-500 absolute" />
                      </div>
                      <span className="truncate text-xs font-semibold max-w-[120px]" style={{ color: 'var(--text-primary)' }}>{attachment.fileName}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider bg-black/5 px-1.5 py-0.5 rounded" style={{ color: 'var(--text-secondary)' }}>
                        {attachment.fileType || 'IMG'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 border-t pt-10" style={{ borderColor: 'var(--border)' }}>
              <CommentSection
                comments={comments}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onUpdateComment={handleUpdateComment}
                currentUserId={currentCommentIdentityId || currentUserId}
                currentUserRole={currentUserRole}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {canManageTicket && (
            <>
              <div className="glass-panel-strong rounded-3xl p-5 shadow-2xl backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--border)' }}>
                <h3 className="mb-4 flex items-center gap-3 border-b pb-3 text-xs font-bold uppercase tracking-widest" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <Wrench size={18} style={{ color: 'var(--primary)' }} />
                  Technician Actions
                </h3>
                <div className="space-y-3">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={!canManageTicket || statusUpdating}
                    className="w-full glass-input rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all border"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {UPDATE_STATUSES.map((status) => (
                      <option key={status} value={status} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>

                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Resolution notes (for RESOLVED/CLOSED)"
                    disabled={!canManageTicket || statusUpdating}
                    rows={2}
                    className="w-full resize-none glass-input rounded-xl px-3 py-2.5 text-xs outline-none disabled:opacity-50 transition-all font-medium border"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />

                  {selectedStatus === 'REJECTED' && (
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Rejection reason (required)"
                      disabled={!canManageTicket || statusUpdating}
                      rows={2}
                      className="w-full resize-none bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2.5 text-xs outline-none text-rose-200 placeholder:text-rose-500/50 disabled:opacity-50 transition-all"
                    />
                  )}

                  <button
                    type="button"
                    disabled={!canManageTicket || statusUpdating}
                    onClick={handleUpdateStatus}
                    className={cn(
                      'w-full rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg',
                      (!canManageTicket || statusUpdating) ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:scale-[1.02] active:scale-95'
                    )}
                    style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))', boxShadow: (!canManageTicket || statusUpdating) ? 'none' : '0 10px 20px rgba(249, 115, 22, 0.2)' }}
                  >
                    {statusUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>

              {currentUserRole !== 'TECHNICIAN' && (
                <div className="glass-panel rounded-3xl p-5 shadow-xl backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--border)' }}>
                  <h3 className="mb-4 flex items-center gap-3 border-b pb-3 text-xs font-bold uppercase tracking-widest" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--status-approved)' }} />
                    Assign Technician
                  </h3>
                  <div className="space-y-3">
                    <select
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      disabled={!canManageTicket || assigning}
                      className="w-full glass-input rounded-xl px-4 py-3.5 text-sm font-medium outline-none disabled:opacity-50 transition-all cursor-pointer border"
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--muted)' }}>Select technician</option>
                      {technicianOptions.map((tech) => (
                        <option key={tech.id} value={tech.id} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                          {getTechnicianDisplay(tech)}
                        </option>
                      ))}
                    </select>

                    {technicianOptions.length === 0 && (
                      <p className="text-xs font-semibold text-amber-300">
                        No technicians found in database. Add users with ROLE_TECHNICIAN.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleAssignTechnician}
                      disabled={!canManageTicket || assigning || !technician.trim() || technicianOptions.length === 0}
                      className={cn(
                        'w-full rounded-xl px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg',
                        (!canManageTicket || assigning || !technician.trim() || technicianOptions.length === 0) ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:scale-[1.02] active:scale-95'
                      )}
                      style={{ background: 'linear-gradient(135deg, var(--status-approved), #0f766e)', boxShadow: (!canManageTicket || assigning || !technician.trim() || technicianOptions.length === 0) ? 'none' : '0 10px 20px rgba(16, 185, 129, 0.2)' }}
                    >
                      {assigning ? 'Assigning...' : 'Assign Technician'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {ticket.assignedTechnician && (
            <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl" style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}>
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Assigned Technician</p>
                   <p className="text-xl font-extrabold uppercase tracking-tight">{userDisplayMap[ticket.assignedTechnician] || ticket.assignedTechnician}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/30">
                  <User size={24} className="text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedModalImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-200"
          style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedModalImage(null)}
        >
          <div className="relative max-h-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl border" style={{ borderColor: 'rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedModalImage(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-110"
            >
              <X size={20} />
            </button>
            <img 
              src={`${API_BASE_URL}/uploads/${selectedModalImage.fileName}`} 
              alt={selectedModalImage.fileName}
              className="max-h-[85vh] w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/800x600?text=Image+Unavailable';
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
               <p className="text-sm font-bold text-white uppercase tracking-widest">{selectedModalImage.fileName}</p>
               <p className="mt-1 text-[10px] font-medium text-white/60">Ticket Attachment</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
