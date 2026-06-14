import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import { resourceApi } from '../api/resourceApi';
import StatusBadge from '../components/StatusBadge';
import { buildBookingReferenceMap } from '../utils/bookingReference';
import toast from 'react-hot-toast';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
  isValid,
  isAfter,
} from 'date-fns';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Filter,
  Clock3,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

function toDate(value) {
  if (!value) return null;
  const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(parsed) ? parsed : null;
}

function normalizeBooking(booking, resourceMap) {
  const start = toDate(booking.startTime || booking.start || booking.startAt);
  const end = toDate(booking.endTime || booking.end || booking.endAt);
  const resourceId = booking.resourceId || booking.resource?.id || booking.resource?._id || null;

  return {
    ...booking,
    id: booking.id || booking._id,
    status: booking.status || 'PENDING',
    start,
    end,
    resourceId,
    resourceName: booking.resourceName || booking.resource?.name || resourceMap.get(resourceId) || 'Unknown Resource',
  };
}

export default function ResourceCalendarPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('ALL');
  const [bookings, setBookings] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const resourceMap = useMemo(
    () => new Map(resources.map((resource) => [resource.id || resource._id, resource.name || 'Untitled Resource'])),
    [resources],
  );

  const selectedResourceName = useMemo(() => {
    if (selectedResourceId === 'ALL') return 'All Resources';
    return resourceMap.get(selectedResourceId) || 'Unknown Resource';
  }, [selectedResourceId, resourceMap]);

  const loadResources = useCallback(async () => {
    setLoadingResources(true);
    try {
      const response = await resourceApi.getAll();
      const items = Array.isArray(response.data) ? response.data : [];
      setResources(items);
      if (!items.length) {
        setSelectedResourceId('ALL');
      } else if (selectedResourceId !== 'ALL' && !items.some((resource) => (resource.id || resource._id) === selectedResourceId)) {
        setSelectedResourceId('ALL');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load resources.');
      setResources([]);
      setSelectedResourceId('ALL');
    } finally {
      setLoadingResources(false);
    }
  }, [selectedResourceId]);

  const loadBookings = useCallback(async () => {
    if (!resources.length && selectedResourceId === 'ALL') {
      setBookings([]);
      return;
    }

    setLoadingBookings(true);
    try {
      let merged = [];

      if (selectedResourceId === 'ALL') {
        const requests = resources.map((resource) => {
          const id = resource.id || resource._id;
          return bookingApi.getByResource(id);
        });

        const settled = await Promise.allSettled(requests);
        const successful = settled
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => (Array.isArray(result.value.data) ? result.value.data : []));

        merged = successful;

        const failedCount = settled.filter((result) => result.status === 'rejected').length;
        if (failedCount > 0) {
          toast.error(`Some resource bookings could not be loaded (${failedCount}).`);
        }
      } else {
        const response = await bookingApi.getByResource(selectedResourceId);
        merged = Array.isArray(response.data) ? response.data : [];
      }

      const normalized = merged
        .map((booking) => normalizeBooking(booking, resourceMap))
        .filter((booking) => booking.id && booking.start && booking.end);

      setBookings(normalized);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load resource bookings.');
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [resources, selectedResourceId, resourceMap]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = [];
  let cursor = calendarStart;
  while (cursor <= calendarEnd) {
    calendarDays.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (statusFilter !== 'ALL' && booking.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        booking.userName,
        booking.resourceName,
        booking.purpose,
        booking.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [bookings, statusFilter, search]);

  const bookingsByDayKey = useMemo(() => {
    const map = new Map();
    for (const booking of filteredBookings) {
      const key = format(booking.start, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(booking);
    }

    for (const [, dayBookings] of map) {
      dayBookings.sort((a, b) => a.start.getTime() - b.start.getTime());
    }

    return map;
  }, [filteredBookings]);

  const selectedDayBookings = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return bookingsByDayKey.get(key) || [];
  }, [selectedDay, bookingsByDayKey]);

  const monthBookings = useMemo(
    () => filteredBookings.filter((booking) => isSameMonth(booking.start, currentDate)),
    [filteredBookings, currentDate],
  );

  const summary = useMemo(
    () => ({
      total: monthBookings.length,
      pending: monthBookings.filter((booking) => booking.status === 'PENDING').length,
      approved: monthBookings.filter((booking) => booking.status === 'APPROVED').length,
    }),
    [monthBookings],
  );

  const bookingReferences = useMemo(() => buildBookingReferenceMap(filteredBookings), [filteredBookings]);

  const canQuickBook = selectedResourceId !== 'ALL' && selectedDay && isAfter(selectedDay, addDays(new Date(), -1));

  return (
    <div className="min-h-screen py-8 px-4 page-enter">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}
            >
              <CalendarDays size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Resource Booking Calendar
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Fully synced with live resource and booking data
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              loadResources();
              loadBookings();
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            style={{
              border: '1px solid rgba(148, 163, 184, 0.28)',
              background: 'rgba(255,255,255,0.85)',
              color: 'var(--text-primary)',
            }}
          >
            <RefreshCw size={15} />
            Refresh Data
          </button>
        </div>

        <div className="glass-card p-4 md:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <label className="lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={12} className="inline mr-1" /> Resource
              </span>
              <select
                value={selectedResourceId}
                onChange={(event) => {
                  setSelectedResourceId(event.target.value);
                  setSelectedDay(null);
                }}
                disabled={loadingResources}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <option value="ALL">All Resources</option>
                {resources.map((resource) => (
                  <option key={resource.id || resource._id} value={resource.id || resource._id}>
                    {resource.name || 'Unnamed Resource'}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <Filter size={12} className="inline mr-1" /> Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                {STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All statuses' : status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                Search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Purpose, user, resource..."
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="text-center">
                <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {selectedResourceName}
                </p>
              </div>

              <button
                onClick={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(249,115,22,0.09)', border: '1px solid rgba(249,115,22,0.18)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total (month)</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{summary.total}</p>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: 'var(--status-pending-bg)', border: '1px solid var(--status-pending-border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pending</p>
                <p className="text-lg font-bold" style={{ color: 'var(--status-pending)' }}>{summary.pending}</p>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: 'var(--status-approved-bg)', border: '1px solid var(--status-approved-border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Approved</p>
                <p className="text-lg font-bold" style={{ color: 'var(--status-approved)' }}>{summary.approved}</p>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
                <div key={dayName} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--text-secondary)' }}>
                  {dayName}
                </div>
              ))}
            </div>

            {loadingBookings ? (
              <div className="h-72 flex items-center justify-center">
                <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent-mid)', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayBookings = bookingsByDayKey.get(key) || [];
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDay && isSameDay(day, selectedDay);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className="min-h-[92px] rounded-xl p-2 text-left transition-all"
                      style={{
                        background: isSelected
                          ? 'rgba(249,115,22,0.14)'
                          : isToday
                            ? 'rgba(249,115,22,0.08)'
                            : 'rgba(255,255,255,0.72)',
                        border: isSelected
                          ? '1px solid rgba(249,115,22,0.36)'
                          : '1px solid rgba(148, 163, 184, 0.2)',
                        opacity: isCurrentMonth ? 1 : 0.45,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: isToday ? 'var(--primary-hover)' : 'var(--text-secondary)' }}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayBookings.length > 0 && (
                          <span className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                            {dayBookings.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayBookings.slice(0, 3).map((booking) => (
                          <div
                            key={booking.id}
                            className="px-1.5 py-0.5 rounded text-[10px] truncate font-semibold"
                            style={{
                              background:
                                booking.status === 'APPROVED'
                                  ? 'var(--status-approved-bg)'
                                  : booking.status === 'REJECTED'
                                    ? 'var(--status-rejected-bg)'
                                    : booking.status === 'CANCELLED'
                                      ? 'var(--status-cancelled-bg)'
                                      : 'var(--status-pending-bg)',
                              color:
                                booking.status === 'APPROVED'
                                  ? 'var(--status-approved)'
                                  : booking.status === 'REJECTED'
                                    ? 'var(--status-rejected)'
                                    : booking.status === 'CANCELLED'
                                      ? 'var(--status-cancelled)'
                                      : 'var(--status-pending)',
                            }}
                          >
                            {format(booking.start, 'HH:mm')} {selectedResourceId === 'ALL' ? `• ${booking.resourceName}` : ''}
                          </div>
                        ))}
                        {dayBookings.length > 3 && (
                          <p className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            +{dayBookings.length - 3} more
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="glass-card p-5">
            {selectedDay ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {format(selectedDay, 'EEEE, MMM d')}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {selectedDayBookings.length} booking{selectedDayBookings.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  {canQuickBook && (
                    <button
                      onClick={() =>
                        navigate('/create-booking', {
                          state: {
                            selectedResourceId,
                            selectedResourceName,
                          },
                        })
                      }
                      className="px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                      style={{
                        background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                        color: '#fff',
                      }}
                    >
                      <PlusCircle size={14} />
                      Book
                    </button>
                  )}
                </div>

                {selectedDayBookings.length === 0 ? (
                  <div className="text-center py-10 rounded-xl" style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid var(--border)' }}>
                    <CalendarDays size={32} className="mx-auto mb-2" style={{ color: 'var(--muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      No bookings for this day.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                    {selectedDayBookings.map((booking) => (
                      <article
                        key={booking.id}
                        className="rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <StatusBadge status={booking.status} size="sm" />
                          <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {bookingReferences[booking.id] || booking.id}
                          </span>
                        </div>

                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {booking.resourceName}
                        </p>

                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          By {booking.userName || 'Unknown user'}
                        </p>

                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                          <Clock3 size={12} />
                          {format(booking.start, 'hh:mm a')} - {format(booking.end, 'hh:mm a')}
                        </p>

                        {booking.purpose ? (
                          <p className="text-xs mt-2" style={{ color: 'var(--text-primary)' }}>
                            {booking.purpose}
                          </p>
                        ) : null}

                        {booking.status === 'REJECTED' && booking.rejectionReason ? (
                          <p className="text-xs mt-2" style={{ color: 'var(--status-rejected)' }}>
                            Reason: {booking.rejectionReason}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <CalendarDays size={44} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Select a day
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Click a date to view detailed bookings
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
