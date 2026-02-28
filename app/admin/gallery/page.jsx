'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'

const categories = [
  { id: 'visitor', name: 'Visitor Touring', folder: 'Vistor Touring' },
  { id: 'activity', name: 'Activity', folder: 'Activity' },
  { id: 'delegation', name: 'Official Delegation Visit', folder: 'official delegation visit' },
  { id: 'donation', name: 'Donation', folder: 'donation' },
]

export default function GalleryManagement() {
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('visitor')
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      console.log('Gallery fetched:', data?.length || 0)
      setGallery(data || [])
    } catch (error) {
      console.error('Error fetching gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteImage = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchGallery()
    } catch (error) {
      alert('Error deleting image: ' + error.message)
    }
  }

  const [formData, setFormData] = useState({
    image_url: '',
    title: '',
    description: '',
    display_order: 0
  })

  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!formData.image_url) {
      alert('Please enter or upload an image URL')
      return
    }

    const data = {
      category: selectedCategory,
      image_url: formData.image_url,
      title: formData.title,
      description: formData.description,
      display_order: parseInt(formData.display_order) || 0,
      is_active: true
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('gallery')
          .update(data)
          .eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('gallery')
          .insert([data])
        if (error) throw error
      }
      setEditingItem(null)
      setIsAdding(false)
      setFormData({ image_url: '', title: '', description: '', display_order: 0 })
      fetchGallery()
    } catch (error) {
      alert('Error saving: ' + error.message)
    }
  }

  const filteredImages = gallery.filter(img => img.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gallery Management</h1>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id)
              setEditingItem(null)
              setIsAdding(false)
            }}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingItem(null)
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          ➕ Add New Image
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingItem) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingItem ? 'Edit Image' : 'Add New Image'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="image_url"
                  value={editingItem ? editingItem.image_url : formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="/assets/images/..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    // Open file picker
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // For now, just use object URL as placeholder
                        // In production, upload to Supabase Storage
                        const url = URL.createObjectURL(file)
                        setFormData({...formData, image_url: url})
                      }
                    }
                    input.click()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📤 Upload
                </button>
              </div>
              {(editingItem?.image_url || formData.image_url) && (
                <img
                  src={editingItem ? editingItem.image_url : formData.image_url}
                  alt="Preview"
                  className="mt-2 h-20 w-auto rounded border"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editingItem ? editingItem.title : formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={editingItem ? editingItem.display_order : (formData.display_order || filteredImages.length + 1)}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={editingItem ? editingItem.description : formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null)
                  setIsAdding(false)
                  setFormData({ image_url: '', title: '', description: '', display_order: 0 })
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map((img) => (
          <div key={img.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="relative aspect-square">
              <img
                src={img.image_url}
                alt={img.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/assets/images/placeholder.jpg'
                }}
              />
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm truncate">{img.title || 'Untitled'}</h3>
              <p className="text-xs text-gray-500">Order: {img.display_order}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setEditingItem(img)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteImage(img.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No images in this category. Click "Add New Image" to add one.
        </div>
      )}
    </div>
  )
}
