import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { bookingApi } from '../api/bookingApi';
import { resourceApi } from '../api/resourceApi';
import toast from 'react-hot-toast';
import { PlusCircle, Calendar, Clock, MapPin, FileText, ChevronRight } from 'lucide-react';
import { toUserBookingReference } from '../utils/bookingReference';

const MIN_PURPOSE_LENGTH = 10;
const MAX_PURPOSE_LENGTH = 300;
const MAX_BOOKING_DURATION_HOURS = 8;
const MIN_ADVANCE_MINUTES = 15;
const MIN_BOOKING_DURATION_MINUTES = 30;
const MAX_BOOKING_WINDOW_DAYS = 90;
const BUSINESS_HOUR_START = 7;
const BUSINESS_HOUR_END = 22;

function toDate(value) {
  if (typeof value === 'string') {
    // Parse datetime-local values as local time to avoid browser-dependent parsing.
    const localMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (localMatch) {
      const [, y, mo, d, h, mi, s = '0'] = localMatch;
      const localDate = new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(mi),
        Number(s)
      );

      if (!Number.isNaN(localDate.getTime())) {
        return localDate;
      }
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toLocalDateTimeInputValue(date) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';

  const offsetMs = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getDurationHours(start, end) {
  if (!start || !end) return 0;
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function getDurationMinutes(start, end) {
  if (!start || !end) return 0;
  return (end.getTime() - start.getTime()) / (1000 * 60);
}

function isWithinBusinessHours(start, end) {
  if (!start || !end) return false;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const openMinutes = BUSINESS_HOUR_START * 60;
  const closeMinutes = BUSINESS_HOUR_END * 60;

  return startMinutes >= openMinutes && endMinutes <= closeMinutes;
}

function hasTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function getFirstErrorMessage(errors) {
  return Object.values(errors).find(Boolean);
}

// Validation rules keep booking requests consistent before API submission.
function validateBookingForm(form, resources) {
  const errors = {};
  const now = new Date();
  const minStart = new Date(now.getTime() + MIN_ADVANCE_MINUTES * 60 * 1000);
  const maxStart = new Date(now.getTime() + MAX_BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const start = toDate(form.startTime);
  const end = toDate(form.endTime);
  const purpose = String(form.purpose || '').trim();
  const selectedResource = resources.find((resource) => (resource.id || resource._id) === form.resourceId);

  if (!form.resourceId) {
    errors.resourceId = 'Please select a resource.';
  } else if (!selectedResource) {
    errors.resourceId = 'Selected resource is no longer available. Please reselect.';
  } else if (String(selectedResource.status || '').toUpperCase() === 'OUT_OF_SERVICE') {
    errors.resourceId = 'This resource is currently out of service.';
  }

  if (!form.startTime) {
    errors.startTime = 'Start time is required.';
  } else if (!start) {
    errors.startTime = 'Please provide a valid start time.';
  } else if (start < minStart) {
    errors.startTime = `Bookings must be made at least ${MIN_ADVANCE_MINUTES} minutes in advance.`;
  } else if (start > maxStart) {
    errors.startTime = `Bookings can only be created up to ${MAX_BOOKING_WINDOW_DAYS} days ahead.`;
  }

  if (!form.endTime) {
    errors.endTime = 'End time is required.';
  } else if (!end) {
    errors.endTime = 'Please provide a valid end time.';
  }

  if (start && end && end <= start) {
    errors.endTime = 'End time must be after start time.';
  }

  if (start && end) {
    const durationMinutes = getDurationMinutes(start, end);
    const durationHours = getDurationHours(start, end);

    if (durationMinutes < MIN_BOOKING_DURATION_MINUTES) {
      errors.endTime = `Booking must be at least ${MIN_BOOKING_DURATION_MINUTES} minutes.`;
    }

    if (durationHours > MAX_BOOKING_DURATION_HOURS) {
      errors.endTime = `Booking duration cannot exceed ${MAX_BOOKING_DURATION_HOURS} hours.`;
    }

    if (!isWithinBusinessHours(start, end)) {
      errors.endTime = `Bookings must be within ${BUSINESS_HOUR_START}:00 to ${BUSINESS_HOUR_END}:00.`;
    }
  }

  if (!purpose) {
    errors.purpose = 'Purpose is required.';
  } else if (purpose.length < MIN_PURPOSE_LENGTH) {
    errors.purpose = `Purpose must be at least ${MIN_PURPOSE_LENGTH} characters.`;
  } else if (purpose.length > MAX_PURPOSE_LENGTH) {
    errors.purpose = `Purpose must be less than ${MAX_PURPOSE_LENGTH + 1} characters.`;
  }

  return errors;
}

async function validateResourceAvailability(form) {
  const start = toDate(form.startTime);
  const end = toDate(form.endTime);
  if (!form.resourceId || !start || !end) {
    return '';
  }

  try {
    const res = await bookingApi.getByResource(form.resourceId);
    const existingBookings = Array.isArray(res.data) ? res.data : [];
    const conflicting = existingBookings.some((booking) => {
      const status = String(booking.status || '').toUpperCase();
      if (['REJECTED', 'CANCELLED'].includes(status)) {
        return false;
      }

      const existingStart = toDate(booking.startTime);
      const existingEnd = toDate(booking.endTime);
      if (!existingStart || !existingEnd) {
        return false;
      }

      return hasTimeOverlap(start, end, existingStart, existingEnd);
    });

    return conflicting ? 'Selected time overlaps with an existing booking for this resource.' : '';
  } catch {
    return 'Could not verify resource availability. Please try again.';
  }
}

export default function CreateBookingPage() {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const now = new Date();
  const today = toLocalDateTimeInputValue(now);

  const [form, setForm] = useState({
    resourceId: '',
    resourceName: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [nextBookingSequence, setNextBookingSequence] = useState(1);
  const [errors, setErrors] = useState({});

  const selectedResourceId = location?.state?.selectedResourceId;
  const selectedResourceName = location?.state?.selectedResourceName;

  useEffect(() => {
    const loadResources = async () => {
      setResourcesLoading(true);
      try {
        const res = await resourceApi.getAll();
        const allResources = Array.isArray(res.data) ? res.data : [];
        setResources(allResources);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load resources.');
        setResources([]);
      } finally {
        setResourcesLoading(false);
      }
    };

    loadResources();
  }, []);

  useEffect(() => {
    const loadMyBookings = async () => {
      if (!currentUser.userId) return;
      try {
        const res = await bookingApi.getMyBookings(currentUser.userId);
        const total = Array.isArray(res.data) ? res.data.length : 0;
        setNextBookingSequence(total + 1);
      } catch {
        setNextBookingSequence(1);
      }
    };

    loadMyBookings();
  }, [currentUser.userId]);

  useEffect(() => {
    if (!resources.length) return;

    if (selectedResourceId) {
      const selected = resources.find((r) => (r.id || r._id) === selectedResourceId);
      if (selected) {
        setForm((prev) => ({
          ...prev,
          resourceId: selected.id || selected._id,
          resourceName: selected.name || selectedResourceName || '',
        }));
        return;
      }
    }

    if (form.resourceId) {
      const current = resources.find((r) => (r.id || r._id) === form.resourceId);
      if (!current) {
        setForm((prev) => ({
          ...prev,
          resourceId: '',
          resourceName: '',
        }));
      }
    }
  }, [resources, selectedResourceId, selectedResourceName]);

  const handleResourceChange = (e) => {
    const selected = resources.find(r => (r.id || r._id) === e.target.value);
    setForm(prev => ({
      ...prev,
      resourceId: (selected?.id || selected?._id) || '',
      resourceName: selected?.name || '',
    }));
    setErrors(prev => ({ ...prev, resourceId: '' }));
  };

  const handleStartTimeChange = (value) => {
    setForm(prev => {
      const nextForm = { ...prev, startTime: value };
      const start = toDate(value);
      const end = toDate(prev.endTime);

      if (start && (!end || end <= start)) {
        const suggestedEnd = new Date(start.getTime() + 60 * 60 * 1000);
        nextForm.endTime = toLocalDateTimeInputValue(suggestedEnd);
      }

      return nextForm;
    });
    setErrors(prev => ({ ...prev, startTime: '', endTime: '' }));
  };

  const handleEndTimeChange = (value) => {
    setForm(prev => ({ ...prev, endTime: value }));
    setErrors(prev => ({ ...prev, endTime: '' }));
  };

  const handlePurposeChange = (value) => {
    setForm(prev => ({ ...prev, purpose: value }));
    setErrors(prev => ({ ...prev, purpose: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateBookingForm(form, resources);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error(getFirstErrorMessage(validationErrors) || 'Please fix form errors.');
      return;
    }

    const availabilityError = await validateResourceAvailability(form);
    if (availabilityError) {
      const mergedErrors = { ...validationErrors, endTime: availabilityError };
      setErrors(mergedErrors);
      toast.error(availabilityError);
      return;
    }

    setLoading(true);
    try {
      const start = toDate(form.startTime);
      const end = toDate(form.endTime);

      await bookingApi.create({
        ...form,
        purpose: form.purpose.trim(),
        userId: currentUser.userId,
        userName: currentUser.userName,
        startTime: start ? start.getTime() : form.startTime,
        endTime: end ? end.getTime() : form.endTime,
      });
      toast.success('Booking created successfully! Awaiting approval.');
      navigate('/my-bookings');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create booking.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 page-enter">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}>
              <PlusCircle size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>New Booking</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reserve a resource for your event</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          {/* Resource Selector */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <MapPin size={14} style={{ color: 'var(--accent-mid)' }} /> Resource
            </label>
            <select
              value={form.resourceId}
              onChange={handleResourceChange}
              disabled={resourcesLoading}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              required
            >
              <option
                value=""
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
              >
                {resourcesLoading ? 'Loading resources...' : 'Select a resource...'}
              </option>
              {resources.map(r => (
                <option
                  key={r.id || r._id}
                  value={r.id || r._id}
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  {r.name}
                </option>
              ))}
            </select>
            {errors.resourceId ? (
              <p className="text-xs mt-1.5" style={{ color: 'var(--status-rejected)' }}>
                {errors.resourceId}
              </p>
            ) : null}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Calendar size={14} style={{ color: 'var(--accent-mid)' }} /> Start Time
              </label>
              <input
                type="datetime-local"
                value={form.startTime}
                min={today}
                onChange={e => handleStartTimeChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                required
              />
              {errors.startTime ? (
                <p className="text-xs mt-1.5" style={{ color: 'var(--status-rejected)' }}>
                  {errors.startTime}
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Clock size={14} style={{ color: 'var(--accent-mid)' }} /> End Time
              </label>
              <input
                type="datetime-local"
                value={form.endTime}
                min={form.startTime || today}
                onChange={e => handleEndTimeChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: 'transparent', border: '1px solid rgba(15,23,42,0.06)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-mid)'}
                onBlur={e => e.target.style.borderColor = 'rgba(15,23,42,0.06)'}
                required
              />
              {errors.endTime ? (
                <p className="text-xs mt-1.5" style={{ color: 'var(--status-rejected)' }}>
                  {errors.endTime}
                </p>
              ) : null}
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText size={14} style={{ color: 'var(--accent-mid)' }} /> Purpose
            </label>
            <textarea
              value={form.purpose}
              onChange={e => handlePurposeChange(e.target.value)}
              rows={4}
              placeholder="Describe the purpose of this booking..."
              className="w-full px-4 py-3 rounded-xl text-sm placeholder:text-secondary outline-none resize-none transition-all duration-200"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              required
            />
            <div className="flex items-center justify-between mt-1.5">
              {errors.purpose ? (
                <p className="text-xs" style={{ color: 'var(--status-rejected)' }}>
                  {errors.purpose}
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Min {MIN_PURPOSE_LENGTH} chars, max {MAX_PURPOSE_LENGTH}, clear purpose.
                </p>
              )}
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {form.purpose.length}/{MAX_PURPOSE_LENGTH}
              </p>
            </div>
          </div>

          {/* User info preview */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--status-approved-bg)', border: '1px solid var(--status-approved-border)', color: 'var(--status-approved)' }}>
            <p className="text-xs">
              Booking as: <span className="font-medium">{currentUser.userName}</span>
            </p>
            <p className="text-xs mt-1">
              Booking Ref (preview):{' '}
              <span className="font-mono text-xs font-semibold">
                {toUserBookingReference(currentUser.userName || currentUser.userId, nextBookingSequence)}
              </span>
            </p>
          </div>

          {/* Submit */}
         <button
  type="submit"
  disabled={loading}
  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-black transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
  style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}
>
  {loading ? (
    <>
      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
      Submitting...
    </>
  ) : (
    <>
      <PlusCircle size={18} />
      Submit Booking
      <ChevronRight size={16} />
    </>
  )}
</button>
        </form>
      </div>
    </div>
  );
}
