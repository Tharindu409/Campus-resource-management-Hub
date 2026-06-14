import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Send, MapPin, Phone, Info, Tag, Sparkles } from 'lucide-react';
import { AttachmentUpload } from '../components/AttachmentUpload';
import { API_BASE_URL } from '../api/httpClient';
import { getCurrentUserId, setCurrentUserId, ticketService } from '../api/ticketService';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Classroom Equipment',
  'Lab Computers',
  'Projectors/AV',
  'Electrical/Lighting',
  'Plumbing',
  'Furniture',
  'Wi-Fi/Network',
  'Other'
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const DESCRIPTION_MIN_LENGTH = 15;
const DESCRIPTION_MAX_LENGTH = 1000;
const LOCATION_MIN_LENGTH = 3;
const LOCATION_MAX_LENGTH = 120;
const CONTACT_MAX_LENGTH = 120;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s()\-]{7,20}$/;

export const CreateTicketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploadInfo, setUploadInfo] = useState('');
  const [currentUser, setCurrentUser] = useState(getCurrentUserId() || '');
  const [testUserInput, setTestUserInput] = useState(getCurrentUserId() || '');
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    priority: 'MEDIUM',
    location: '',
    contact: ''
  });

  useEffect(() => {
    // Keep legacy ticket flows working while preferring authenticated user identity.
    if (user?.id) {
      setCurrentUserId(user.id);
      setCurrentUser(user.id);
      setTestUserInput(user.id);
      return;
    }

    setCurrentUser(getCurrentUserId() || '');
  }, [user]);

  const displayUserName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return currentUser;
  }, [user, currentUser]);

  const applyTestUser = () => {
    if (!setCurrentUserId(testUserInput)) {
      setError('Enter a valid user id before continuing.');
      return;
    }

    setCurrentUser(getCurrentUserId() || '');
    setError('');
  };

  const validateField = (fieldName, fieldValue) => {
    const value = String(fieldValue ?? '').trim();

    if (fieldName === 'category') {
      if (!value) return 'Category is required.';
      if (!CATEGORIES.includes(value)) return 'Please select a valid category.';
      return '';
    }

    if (fieldName === 'priority') {
      if (!value) return 'Priority is required.';
      if (!PRIORITIES.includes(value)) return 'Please select a valid priority.';
      return '';
    }

    if (fieldName === 'location') {
      if (!value) return 'Location is required.';
      if (value.length < LOCATION_MIN_LENGTH) return `Location must be at least ${LOCATION_MIN_LENGTH} characters.`;
      if (value.length > LOCATION_MAX_LENGTH) return `Location must be ${LOCATION_MAX_LENGTH} characters or less.`;
      return '';
    }

    if (fieldName === 'description') {
      if (!value) return 'Description is required.';
      if (value.length < DESCRIPTION_MIN_LENGTH) return `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters.`;
      if (value.length > DESCRIPTION_MAX_LENGTH) return `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less.`;
      return '';
    }

    if (fieldName === 'contact') {
      if (!value) return 'Preferred contact is required.';
      if (value.length > CONTACT_MAX_LENGTH) return `Preferred contact must be ${CONTACT_MAX_LENGTH} characters or less.`;
      if (!EMAIL_REGEX.test(value) && !PHONE_REGEX.test(value)) {
        return 'Enter a valid email address or phone number.';
      }
      return '';
    }

    return '';
  };

  const validateForm = () => {
    const errors = {
      category: validateField('category', formData.category),
      priority: validateField('priority', formData.priority),
      location: validateField('location', formData.location),
      description: validateField('description', formData.description),
      contact: validateField('contact', formData.contact),
    };
    

    const hasErrors = Object.values(errors).some(Boolean);
    setFieldErrors(errors);

    return !hasErrors;
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setFieldErrors((prev) => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploadInfo('');

    if (!validateForm()) {
      setError('Please correct the highlighted fields before submitting.');
      return;
    }

    setLoading(true);

    const currentUserId = user?.id || getCurrentUserId();
    if (!currentUserId) {
      setError('No current user found. Set localStorage currentUser, userId, or username.');
      setLoading(false);
      return;
    }

    try {
      const trimmedDescription = formData.description.trim();
      const trimmedLocation = formData.location.trim();
      const trimmedContact = formData.contact.trim();

      const payload = {
        title: `${formData.category} issue`,
        category: formData.category,
        description: trimmedDescription,
        priority: formData.priority,
        location: trimmedLocation,
        preferredContact: trimmedContact,
        createdBy: currentUserId,
      };

      const ticket = await ticketService.createTicket(payload);

      if (files.length > 0) {
        const uploadResults = await Promise.allSettled(
          files.map((file) => ticketService.uploadAttachments(ticket.id, file)),
        );
        const successCount = uploadResults.filter((result) => result.status === 'fulfilled').length;
        const failedCount = uploadResults.length - successCount;

        if (failedCount === 0) {
          setUploadInfo(`${successCount} image file(s) uploaded successfully.`);
        } else {
          setUploadInfo(`${successCount} image(s) uploaded, ${failedCount} failed.`);
        }
      }

      navigate('/my-tickets');
    } catch (err) {
      console.error('Failed to create ticket:', err);
      const responseData = err?.response?.data;
      const backendMessage =
        (typeof responseData === 'string' && responseData) ||
        responseData?.message ||
        responseData?.error ||
        '';

      if (!err?.response) {
        setError(`Cannot reach backend API. Make sure backend is running on ${API_BASE_URL}.`);
      } else {
        setError(backendMessage || `Failed to create ticket (HTTP ${err.response.status}).`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 relative page-enter">
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.08)_0%,_rgba(249,115,22,0)_70%)] opacity-60 blur-3xl shadow-none" />
      
      <button
        type="button"
        onClick={() => navigate('/my-tickets')}
        className="group mb-8 inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:glass-panel-strong border border-white/10 relative z-10"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to tickets
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] relative z-10">
        <aside className="glass-panel-strong rounded-3xl p-8 shadow-xl backdrop-blur-md flex flex-col justify-between" style={{ background: 'rgba(255, 255, 255, 0.7)', border: '1px solid var(--border)' }}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-6 w-fit" style={{ borderColor: 'rgba(249,115,22,0.35)', background: 'rgba(249,115,22,0.12)', color: 'var(--primary)' }}>
              <Sparkles size={12} style={{ color: 'var(--primary)' }} />
              Incident Desk
            </p>
            <h1 className="text-4xl font-extrabold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-600 md:text-5xl">Create Ticket</h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
              Report maintenance issues with clear details so technicians can respond faster and accurately.
            </p>
          </div>

          <div className="mt-12 grid gap-4">
            <div className="glass-panel rounded-xl p-5 border-l-[3px] border-l-orange-500 relative overflow-hidden group" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeftWidth: '3px' }}>
              <div className="absolute right-[-10px] top-[-10px] opacity-5 group-hover:opacity-10 transition-opacity">
                <Info size={100} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>Current User</p>
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{displayUserName || 'Not set yet'}</p>
              {currentUser && (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: 'var(--muted)' }}>ID: {currentUser}</p>
              )}
            </div>
            <div className="glass-panel rounded-xl p-5 border-l-[3px] border-l-rose-500 relative overflow-hidden group" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeftWidth: '3px' }}>
              <div className="absolute right-[-10px] top-[-10px] opacity-5 group-hover:opacity-10 transition-opacity">
                 <Tag size={100} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>Attachment Limit</p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Up to 3 images per ticket</p>
            </div>
            <div className="glass-panel rounded-xl p-5 border-l-[3px] border-l-indigo-600 relative overflow-hidden group" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeftWidth: '3px' }}>
              <div className="absolute right-[-10px] top-[-10px] opacity-5 group-hover:opacity-10 transition-opacity">
                 <Send size={100} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>Workflow</p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Open - In Progress - Resolved - Closed</p>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {!currentUser && (
            <div className="glass-panel border-amber-500/30 bg-amber-500/10 p-6 rounded-2xl backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Testing Mode User Setup</p>
              <p className="mt-1 text-sm text-amber-700/80">Login module is not connected yet. Set a temporary user id to test ticket creation.</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="glass-panel border-rose-500/30 bg-rose-500/10 p-5 rounded-2xl text-sm font-semibold text-rose-300 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="glass-panel rounded-3xl p-6 shadow-xl backdrop-blur-md md:p-8 border border-white/10" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--border)' }}>
              <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-5" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Tag size={16} style={{ color: 'var(--primary)' }} />
                  Issue Details
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Step 1 of 2</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                    Category
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-3.5 text-sm font-medium outline-none cursor-pointer appearance-none transition-all border"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>Select a category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{cat}</option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <p className="text-xs font-semibold text-rose-300">{fieldErrors.category}</p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                    Priority
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-3.5 text-sm font-medium outline-none cursor-pointer appearance-none transition-all border"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {PRIORITIES.map(prio => (
                      <option key={prio} value={prio} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{prio}</option>
                    ))}
                  </select>
                  {fieldErrors.priority && (
                    <p className="text-xs font-semibold text-rose-300">{fieldErrors.priority}</p>
                  )}
                </div>

                <div className="space-y-2.5 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                    <MapPin size={12} style={{ color: 'var(--primary)' }} />
                    Location
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Building A, Room 302"
                    value={formData.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    maxLength={LOCATION_MAX_LENGTH}
                    className="w-full glass-input rounded-xl px-4 py-3.5 text-sm outline-none font-medium transition-all border"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  {fieldErrors.location && (
                    <p className="text-xs font-semibold text-rose-500">{fieldErrors.location}</p>
                  )}
                </div>

                <div className="space-y-2.5 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                    <Info size={12} style={{ color: 'var(--accent-mid)' }} />
                    Description
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe the issue in detail..."
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className="w-full resize-none glass-input rounded-xl px-4 py-3.5 text-sm outline-none font-medium transition-all border"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  {fieldErrors.description && (
                    <p className="text-xs font-semibold text-rose-500">{fieldErrors.description}</p>
                  )}
                  <p className="text-right text-[10px] font-bold uppercase tracking-widest pt-1" style={{ color: 'var(--muted)' }}>
                    {formData.description.length} characters
                  </p>
                </div>

                <div className="space-y-2.5 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                    <Phone size={12} style={{ color: 'var(--status-approved)' }} />
                    Preferred Contact
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Email or phone number"
                    value={formData.contact}
                    onChange={(e) => handleFieldChange('contact', e.target.value)}
                    maxLength={CONTACT_MAX_LENGTH}
                    className="w-full glass-input rounded-xl px-4 py-3.5 text-sm outline-none font-medium transition-all border"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  {fieldErrors.contact && (
                    <p className="text-xs font-semibold text-rose-500">{fieldErrors.contact}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 shadow-xl backdrop-blur-md md:p-8 flex flex-col gap-6" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Info size={16} style={{ color: 'var(--primary)' }} />
                  Attachments
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Step 2 of 2</p>
              </div>

              <AttachmentUpload files={files} setFiles={setFiles} />
              
              {uploadInfo && (
                <div className="glass-panel border-emerald-500/30 bg-emerald-500/10 px-4 py-3 rounded-xl border">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {uploadInfo}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl px-6 py-4.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition-all shadow-lg hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:scale-100"
              style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))', boxShadow: '0 10px 20px rgba(249, 115, 22, 0.2)' }}
            >
              {loading ? 'Submitting...' : (
                <span className="inline-flex items-center justify-center gap-2">
                  <Send size={16} />
                  Submit Ticket
                </span>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
