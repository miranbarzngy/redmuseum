'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-client'

export default function SlidesManagement() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      setLoading(false)
      return
    }

    try {
      // Fetch ALL slides (including inactive ones)
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .order('slide_number', { ascending: true })

      if (error) {
        console.error('Supabase error:', error.message)
        throw error
      }
      console.log('Fetched slides from DB:', data?.length || 0, data)
      setSlides(data || [])
    } catch (error) {
      console.error('Error fetching slides:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteSlide = async (id) => {
    if (!confirm('Are you sure you want to delete this slide?')) return

    try {
      const { error } = await supabase
        .from('slides')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchSlides()
    } catch (error) {
      alert('Error deleting slide: ' + error.message)
    }
  }

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('slides')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchSlides()
    } catch (error) {
      alert('Error updating slide: ' + error.message)
    }
  }

  const filteredSlides = slides.filter(slide =>
    slide.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Slides Management</h1>
        <Link
          href="/admin/slides/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>➕</span> Add New Slide
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search slides..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Slides Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Background</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSlides.map((slide) => (
              <tr key={slide.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{slide.slide_number}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{slide.title}</div>
                  <div className="text-sm text-gray-500">{slide.title_kr}</div>
                </td>
                <td className="px-6 py-4">
                  {slide.background_image && (
                    <img
                      src={slide.background_image}
                      alt={slide.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(slide.id, slide.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      slide.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {slide.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/slides/${slide.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteSlide(slide.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSlides.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No slides found
          </div>
        )}
      </div>
    </div>
  )
}
