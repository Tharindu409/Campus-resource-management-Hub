import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  PlusCircle,
  Boxes,
  Grid2X2,
  List,
  Filter,
  MapPin,
  Users,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { resourceApi } from '../api/resourceApi'
import ResourceCard from '../components/ResourceCard'
import ResourceFormModal from '../components/ResourceFormModal'

const FILTER_TYPES = ['ALL', 'LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const FILTER_STATUS = ['ALL', 'ACTIVE', 'OUT_OF_SERVICE']

export default function ResourcePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin =
    Array.isArray(user?.roles) && user.roles.includes('ROLE_ADMIN')

  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [locationFilter, setLocationFilter] = useState('')
  const [minCapacityFilter, setMinCapacityFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [viewingResource, setViewingResource] = useState(null)
  const [layout, setLayout] = useState('grid')

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}

      if (typeFilter !== 'ALL') params.type = typeFilter
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (locationFilter.trim()) params.location = locationFilter.trim()
      if (search.trim()) params.q = search.trim()
      if (minCapacityFilter !== '') params.minCapacity = Number(minCapacityFilter)

      const res = await resourceApi.getAll(params)
      setResources(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load resources.')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter, locationFilter, search, minCapacityFilter])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchResources()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchResources])

  const handleCreate = async (payload) => {
    try {
      setSaving(true)
      await resourceApi.create(payload)
      toast.success('Resource created successfully.')
      setModalOpen(false)
      setEditingResource(null)
      fetchResources()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create resource.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (payload) => {
    const resourceId = editingResource?.id || editingResource?._id
    if (!resourceId) return

    try {
      setSaving(true)
      await resourceApi.update(resourceId, payload)
      toast.success('Resource updated successfully.')
      setModalOpen(false)
      setEditingResource(null)
      fetchResources()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update resource.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (resource) => {
    const resourceId = resource?.id || resource?._id
    if (!resourceId) return
    if (!window.confirm(`Delete "${resource.name}"?`)) return

    try {
      await resourceApi.deleteById(resourceId)
      toast.success('Resource deleted successfully.')
      fetchResources()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete resource.')
    }
  }

  const openCreateModal = () => {
    setViewingResource(null)
    setEditingResource(null)
    setModalOpen(true)
  }

  const openEditModal = (resource) => {
    setViewingResource(null)
    setEditingResource(resource)
    setModalOpen(true)
  }

  const openViewModal = (resource) => {
    setEditingResource(null)
    setViewingResource(resource)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingResource(null)
    setViewingResource(null)
  }

  const openBookingForm = (resource) => {
    const resourceId = resource?.id || resource?._id
    if (!resourceId) {
      toast.error('Unable to book this resource.')
      return
    }

    navigate('/create-booking', {
      state: {
        selectedResourceId: resourceId,
        selectedResourceName: resource?.name || '',
      },
    })
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
              }}
            >
              <Boxes size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
              <p className="text-sm uppercase tracking-[0.18em] font-medium text-orange-600">
                Browse and manage campus facilities and assets
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchResources}
              className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:bg-orange-50 text-orange-600"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            {isAdmin && (
              <button
                onClick={openCreateModal}
                className="px-5 py-3 rounded-2xl text-sm font-semibold text-white flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-orange-500/30 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  boxShadow: '0 4px 12px 0 rgba(249,115,22,0.25)',
                }}
              >
                <PlusCircle size={16} />
                New Resource
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters Panel - Light Theme */}
        <div className="rounded-2xl mb-6 p-5 bg-white shadow-sm border border-gray-200">
          {/* Search Row */}
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, type, location, or description..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 border border-gray-200 bg-gray-50 text-gray-900"
            />
          </div>

          {/* Filter Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Type Filter */}
            <div className="relative">
              <Filter
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer transition-all focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 border border-gray-200 bg-gray-50 text-gray-900"
              >
                {FILTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'All Types' : type.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer transition-all focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 border border-gray-200 bg-gray-50 text-gray-900"
              >
                {FILTER_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All Statuses' : status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
              />
            </div>

            {/* Location Filter */}
            <div className="relative">
              <MapPin
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500"
              />
              <input
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Location"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 border border-gray-200 bg-gray-50 text-gray-900"
              />
            </div>

            {/* Capacity Filter */}
            <div className="relative">
              <Users
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500"
              />
              <input
                type="number"
                min="0"
                value={minCapacityFilter}
                onChange={(e) => setMinCapacityFilter(e.target.value)}
                placeholder="Min capacity"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 border border-gray-200 bg-gray-50 text-gray-900"
              />
            </div>

            {/* Layout Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLayout('grid')}
                className={`flex-1 rounded-xl flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200 ${
                  layout === 'grid'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <Grid2X2 size={16} />
                Grid
              </button>

              <button
                type="button"
                onClick={() => setLayout('list')}
                className={`flex-1 rounded-xl flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200 ${
                  layout === 'list'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <List size={16} />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Light Theme */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-2xl p-4 text-center bg-white shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
              <p className="text-2xl font-bold text-orange-600">
                {resources.length}
              </p>
              <p className="text-xs uppercase tracking-wide font-medium text-gray-500">
                Total Resources
              </p>
            </div>
            <div className="rounded-2xl p-4 text-center bg-white shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
              <p className="text-2xl font-bold text-green-600">
                {resources.filter((r) => r.status === 'ACTIVE').length}
              </p>
              <p className="text-xs uppercase tracking-wide font-medium text-gray-500">
                Active
              </p>
            </div>
            <div className="rounded-2xl p-4 text-center bg-white shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
              <p className="text-2xl font-bold text-red-500">
                {resources.filter((r) => r.status === 'OUT_OF_SERVICE').length}
              </p>
              <p className="text-xs uppercase tracking-wide font-medium text-gray-500">
                Out of Service
              </p>
            </div>
            <div className="rounded-2xl p-4 text-center bg-white shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
              <p className="text-2xl font-bold text-orange-600">
                {resources.filter((r) => r.status === 'ACTIVE').length}
              </p>
              <p className="text-xs uppercase tracking-wide font-medium text-gray-500">
                Available Now
              </p>
            </div>
          </div>
        )}

        {/* Resources Content */}
        {loading ? (
          <div className="rounded-2xl p-10 text-center bg-white shadow-sm border border-gray-200">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin text-orange-500" />
              <p className="text-gray-500">Loading resources...</p>
            </div>
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-2xl p-12 text-center bg-white shadow-sm border border-gray-200">
            <Boxes size={40} className="mx-auto mb-3 opacity-50 text-orange-400" />
            <p className="text-gray-500">No resources found matching your criteria.</p>
            {(search || typeFilter !== 'ALL' || statusFilter !== 'ALL' || locationFilter || minCapacityFilter) && (
              <button
                onClick={() => {
                  setSearch('')
                  setTypeFilter('ALL')
                  setStatusFilter('ALL')
                  setLocationFilter('')
                  setMinCapacityFilter('')
                }}
                className="mt-4 text-sm underline text-orange-600 hover:text-orange-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id || resource._id}
                resource={resource}
                isAdmin={isAdmin}
                layout="grid"
                onView={openViewModal}
                onBook={openBookingForm}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id || resource._id}
                resource={resource}
                isAdmin={isAdmin}
                layout="list"
                onView={openViewModal}
                onBook={openBookingForm}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ResourceFormModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={editingResource ? handleUpdate : handleCreate}
        initialData={editingResource || viewingResource}
        loading={saving}
        readOnly={Boolean(viewingResource)}
      />
    </div>
  )
}