'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Search,
  GripVertical,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { supabase } from '../../lib/supabase-client'
import VisibilityToggle from '../components/VisibilityToggle'

function SortableRow({ slide, onDelete, onToggleActive, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: isDragging ? 'relative' : 'static',
  }

  return (
    <tr ref={setNodeRef} style={style} className="group hover:bg-blue-50/30 transition-colors bg-white">
      {/* Drag handle */}
      <td className="pl-4 pr-2 py-4 w-8">
        <button
          {...attributes}
          {...listeners}
          disabled={disabled}
          className={`p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
          title={disabled ? 'Clear search to reorder' : 'Drag to reorder'}
        >
          <GripVertical size={16} />
        </button>
      </td>

      {/* Thumbnail + title */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          {slide.background_image ? (
            <img
              src={slide.background_image}
              alt={slide.title}
              className="w-16 h-11 object-cover rounded-xl border border-gray-100 shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-16 h-11 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
              <Search size={14} className="text-gray-300" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-tight">{slide.title}</p>
            {slide.title_kr && (
              <p className="text-xs text-gray-400 mt-0.5">{slide.title_kr}</p>
            )}
          </div>
        </div>
      </td>

      {/* Status badge */}
      <td className="px-4 py-4 w-32">
        <button
          onClick={() => onToggleActive(slide.id, slide.is_active)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            slide.is_active
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {slide.is_active
            ? <><Eye size={11} /> Active</>
            : <><EyeOff size={11} /> Inactive</>
          }
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-4 w-28">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/slides/${slide.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Pencil size={11} />
            Edit
          </Link>
          <button
            onClick={() => onDelete(slide.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 size={11} />
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function SlidesManagement() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { fetchSlides() }, [])

  const fetchSlides = async () => {
    if (!supabase) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .order('slide_number', { ascending: true })
      if (error) throw error
      setSlides(data || [])
    } catch (error) {
      alert('Error fetching slides: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = slides.findIndex(s => s.id === active.id)
    const newIndex = slides.findIndex(s => s.id === over.id)
    const reordered = arrayMove(slides, oldIndex, newIndex)

    setSlides(reordered)
    setSaving(true)
    try {
      const phase1 = reordered.map((slide, i) =>
        supabase.from('slides').update({ slide_number: i + 10001 }).eq('id', slide.id)
      )
      const r1 = await Promise.all(phase1)
      const e1 = r1.find(r => r.error)
      if (e1) throw e1.error

      const phase2 = reordered.map((slide, i) =>
        supabase.from('slides').update({ slide_number: i + 1 }).eq('id', slide.id)
      )
      const r2 = await Promise.all(phase2)
      const e2 = r2.find(r => r.error)
      if (e2) throw e2.error
    } catch (error) {
      alert('Error saving order: ' + error.message)
      fetchSlides()
    } finally {
      setSaving(false)
    }
  }

  const deleteSlide = async (id) => {
    if (!confirm('Are you sure you want to delete this slide?')) return
    try {
      const { error } = await supabase.from('slides').delete().eq('id', id)
      if (error) throw error
      fetchSlides()
    } catch (error) {
      alert('Error deleting slide: ' + error.message)
    }
  }

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from('slides').update({ is_active: !currentStatus }).eq('id', id)
      if (error) throw error
      setSlides(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s))
    } catch (error) {
      alert('Error updating slide: ' + error.message)
    }
  }

  const isFiltering = searchTerm.trim() !== ''
  const filteredSlides = isFiltering
    ? slides.filter(s => s.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : slides

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Slides Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{slides.length} slides total</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin text-blue-500" />
              Saving order…
            </span>
          )}
          <Link
            href="/admin/slides/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl shadow-lg shadow-blue-900/30 transition-all"
          >
            <Plus size={16} />
            Add New Slide
          </Link>
        </div>
      </div>

      {/* Visibility toggle */}
      <div className="mb-5">
        <VisibilityToggle settingKey="show_slides" label="Slides / Homepage Slider" />
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search slides…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-80 pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors"
        />
        {isFiltering && (
          <p className="absolute left-0 -bottom-5 text-xs text-amber-600">Clear search to enable drag-and-drop reordering</p>
        )}
      </div>

      {/* Table */}
      <div className={`${isFiltering ? 'mt-7' : ''}`}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="pl-4 pr-2 py-3 w-8" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Slide</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-50">
                  {filteredSlides.map(slide => (
                    <SortableRow
                      key={slide.id}
                      slide={slide}
                      onDelete={deleteSlide}
                      onToggleActive={toggleActive}
                      disabled={isFiltering}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>

            {filteredSlides.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Search size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No slides found</p>
              </div>
            )}
          </div>
        </DndContext>
      </div>
    </div>
  )
}
