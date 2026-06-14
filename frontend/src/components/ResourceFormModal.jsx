import { useEffect, useState } from 'react'
import { X, Save, PlusCircle, Upload, Eye } from 'lucide-react'
import { uploadResourceImage } from '../services/uploadService'

const TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const STATUSES = ['ACTIVE', 'OUT_OF_SERVICE']

const TYPE_TIME_RULES = {
  LECTURE_HALL: { from: '07:00', to: '20:00' },
  LAB: { from: '08:00', to: '18:00' },
  MEETING_ROOM: { from: '08:00', to: '17:00' },
  EQUIPMENT: { from: '06:00', to: '22:00' },
}

const GLOBAL_MIN_TIME = '06:00'
const GLOBAL_MAX_TIME = '22:00'

const defaultForm = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  location: '',
  description: '',
  status: 'ACTIVE',
  imageUrl: '',
  availableFrom: '',
  availableTo: '',
}

export default function ResourceFormModal({
  open,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
  readOnly = false,
}) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
  ...defaultForm,
  ...initialData,
  capacity: initialData.capacity?.toString() || '',
})
      setImagePreview(initialData.imageUrl || '')
    } else {
      setForm({ ...defaultForm })
      setImagePreview('')
    }

    setImageFile(null)
    setErrors({})
    setUploadingImage(false)
  }, [initialData, open])

  if (!open) return null

  const handleChange = (e) => {
    if (readOnly) return
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  if (readOnly) return

  const newErrors = {}
  if (!form.name?.trim()) newErrors.name = 'Name is required'
  if (!form.capacity) newErrors.capacity = 'Capacity is required'
  if (!form.location?.trim()) newErrors.location = 'Location is required'

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors)
    return
  }

  try {
    let finalImageUrl = form.imageUrl

    if (imageFile) {
      setUploadingImage(true)
      finalImageUrl = await uploadResourceImage(imageFile)
    }

    
    const payload = {
      name: form.name?.trim(),
      type: form.type,
      capacity: form.capacity ? Number(form.capacity) : null,
      location: form.location?.trim(),
      description: form.description?.trim() || null,
      status: form.status,
      imageUrl: finalImageUrl || null,
      availableFrom: form.availableFrom || null,
      availableTo: form.availableTo || null,
    }

    await onSubmit(payload)
  } catch (err) {
    console.error('Submit error:', err)
  } finally {
    setUploadingImage(false)
  }
}

  const inputStyle = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    color: '#111827',
    transition: 'all 0.2s ease',
  }

  const focusStyle = {
    borderColor: '#f97316',
    boxShadow: '0 0 0 3px rgba(249,115,22,0.1)',
    outline: 'none',
  }

  const errorInputStyle = {
    ...inputStyle,
    border: '1px solid #ef4444',
    backgroundColor: '#fef2f2',
  }

  const getFieldStyle = (field) =>
    errors[field] ? errorInputStyle : inputStyle

  // ✅ ADDED ONLY THIS LINE (no other changes)
  const currentRule = TYPE_TIME_RULES[form.type]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center px-4 py-6">
        <div
          className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto bg-white shadow-xl"
          style={{ border: '1px solid #f3f4f6' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {readOnly ? 'View Resource' : initialData ? 'Edit Resource' : 'Create Resource'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {readOnly ? 'View all resource details' : 'Manage resource details and availability'}
              </p>
            </div>

            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">

              {/* Name Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name *</label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  placeholder="e.g., Main Lecture Hall, Chemistry Lab"
                  className="px-4 py-3 rounded-xl outline-none w-full transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  style={getFieldStyle('name')}
                  onFocus={(e) => e.target.style.borderColor = '#f97316'}
                  onBlur={(e) => {
                    if (!errors.name) e.target.style.borderColor = '#e5e7eb'
                  }}
                  readOnly={readOnly}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Type Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select 
                  name="type" 
                  value={form.type} 
                  onChange={handleChange}
                  className="px-4 py-3 rounded-xl outline-none w-full transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  style={inputStyle}
                  disabled={readOnly}
                >
                  {TYPES.map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>

                {/* ADDED TIME WINDOW INFO ONLY */}
                <p className="text-xs text-gray-500 mt-1">
                  Allowed: {currentRule.from} - {currentRule.to} | Global: {GLOBAL_MIN_TIME} - {GLOBAL_MAX_TIME}
                </p>
              </div>

              {/* Capacity Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input 
                  name="capacity" 
                  type="number" 
                  value={form.capacity} 
                  onChange={handleChange}
                  placeholder="Number of people"
                  className="px-4 py-3 rounded-xl outline-none w-full transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  style={getFieldStyle('capacity')}
                  readOnly={readOnly}
                />
                {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
              </div>

              {/* Status Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleChange}
                  className="px-4 py-3 rounded-xl outline-none w-full transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  style={inputStyle}
                  disabled={readOnly}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Location Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input 
                  name="location" 
                  value={form.location} 
                  onChange={handleChange}
                  placeholder="Building, Floor, Room number"
                  className="px-4 py-3 rounded-xl outline-none w-full transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  style={getFieldStyle('location')}
                  readOnly={readOnly}
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>

              {/* Image URL Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input 
                  name="imageUrl" 
                  value={form.imageUrl} 
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="px-4 py-3 rounded-xl outline-none w-full transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  style={inputStyle}
                  readOnly={readOnly}
                />
              </div>

              {/* Image Upload */}
              {!readOnly && (
                <label
                  className="md:col-span-2 flex items-center justify-center gap-2 px-4 py-4 rounded-xl cursor-pointer transition-all hover:bg-orange-50"
                  style={{
                    backgroundColor: '#fef3c7',
                    border: '1px dashed #f97316',
                    color: '#ea580c',
                  }}
                >
                  <Upload size={16} />
                  <span className="text-sm font-medium">Upload Image</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        setImageFile(file)
                        setImagePreview(URL.createObjectURL(file))
                      }
                    }} 
                  />
                </label>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="md:col-span-2 relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="rounded-xl h-56 w-full object-cover border border-gray-200"
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                        setForm(prev => ({ ...prev, imageUrl: null }))
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Time Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                <input 
                  type="time" 
                  name="availableFrom" 
                  value={form.availableFrom}
                  onChange={handleChange}
                  className="px-4 py-3 rounded-xl outline-none w-full transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  style={inputStyle}
                  readOnly={readOnly}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available To</label>
                <input 
                  type="time" 
                  name="availableTo" 
                  value={form.availableTo}
                  onChange={handleChange}
                  className="px-4 py-3 rounded-xl outline-none w-full transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  style={inputStyle}
                  readOnly={readOnly}
                />
              </div>

              {/* Description Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange}
                  placeholder="Describe the resource, its features, and any special notes..."
                  rows={4}
                  className="px-4 py-3 rounded-xl outline-none w-full transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
                  style={inputStyle}
                  readOnly={readOnly}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={onClose} 
                type="button"
                className="px-5 py-2.5 rounded-xl font-medium transition-all hover:bg-gray-100 text-gray-700"
                style={{
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                }}
              >
                Cancel
              </button>

              {!readOnly && (
                <button 
                  type="submit"
                  disabled={uploadingImage}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 transition-all hover:shadow-lg hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
                  }}
                >
                  {initialData ? <Save size={18} /> : <PlusCircle size={18} />}
                  {uploadingImage ? 'Uploading...' : (initialData ? 'Update' : 'Create')}
                </button>
              )}

              {readOnly && (
                <div 
                  className="px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium"
                  style={{
                    backgroundColor: '#fff7ed',
                    color: '#ea580c',
                    border: '1px solid #fed7aa',
                  }}
                >
                  <Eye size={18} />
                  View Only Mode
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}