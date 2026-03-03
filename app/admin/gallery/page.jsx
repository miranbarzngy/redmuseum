'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'

const categories = [
  { id: 'visitor', name: 'Visitor Touring', folder: 'Vistor Touring' },
  { id: 'activity', name: 'Activity', folder: 'Activity' },
  { id: 'delegation', name: 'Official Delegation Visit', folder: 'official delegation visit' },
  { id: 'donation', name: 'Donation', folder: 'donation' },
]

// Helper function to normalize paths
const normalizePath = (path) => {
  if (!path) return null
  // If already a full URL (http/https), don't modify
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // If already has leading slash, return as is
  if (path.startsWith('/')) return path
  // Otherwise add leading slash for relative paths
  return `/${path}`
}

export default function GalleryManagement() {
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('visitor')
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    image_url: '',
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    display_order: 0
  })


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

  // Handle file upload to Supabase Storage
  const handleFileUpload = async (file) => {
    if (!file) return null
    
    setUploading(true)
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `gallery/${selectedCategory}/${fileName}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('museum-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('museum-images')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      console.log('Uploaded to:', publicUrl)
      
      return publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'display_order' ? parseInt(value) || 0 : value
    }))
  }

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // First, try to upload to Supabase Storage
    const uploadedUrl = await handleFileUpload(file)
    
    if (uploadedUrl) {
      setFormData(prev => ({
        ...prev,
        image_url: uploadedUrl
      }))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!formData.image_url) {
      alert('Please select or upload an image')
      return
    }

    // Ensure display_order is a number
    const displayOrder = parseInt(formData.display_order) || 0

    const data = {
      category: selectedCategory,
      image_url: formData.image_url,
      title: formData.title || null,
      title_ar: formData.title_ar || null,
      description: formData.description || null,
      description_ar: formData.description_ar || null,
      display_order: displayOrder,
      is_active: true
    }


    try {
      if (editingItem) {
        // Update existing record
        const { error } = await supabase
          .from('gallery')
          .update(data)
          .eq('id', editingItem.id)
        
        if (error) throw error
        console.log('Image updated successfully')
      } else {
        // Insert new record
        const { error } = await supabase
          .from('gallery')
          .insert([data])
        
        if (error) throw error
        console.log('Image added successfully')
      }
      
      // Reset form and refresh list
      setEditingItem(null)
      setIsAdding(false)
      setFormData({ 
        image_url: '', 
        title: '', 
        description: '', 
        display_order: 0 
      })
      
      // Refresh gallery list
      fetchGallery()
    } catch (error) {
      alert('Error saving: ' + error.message)
    }
  }

  // Handle edit button click
  const handleEdit = (item) => {
    setEditingItem(item)
    setIsAdding(true)
    setFormData({
      image_url: item.image_url || '',
      title: item.title || '',
      title_ar: item.title_ar || '',
      description: item.description || '',
      description_ar: item.description_ar || '',
      display_order: item.display_order || 0
    })
  }

  // Handle cancel
  const handleCancel = () => {
    setEditingItem(null)
    setIsAdding(false)
    setFormData({ 
      image_url: '', 
      title: '', 
      title_ar: '',
      description: '', 
      description_ar: '',
      display_order: 0 
    })
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
              setFormData({ 
                image_url: '', 
                title: '', 
                description: '', 
                display_order: 0 
              })
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
            setFormData({ 
              image_url: '', 
              title: '', 
              description: '', 
              display_order: filteredImages.length + 1 
            })
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
            {/* Category Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="Enter image URL or upload a file"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  📤 Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && (
                <p className="text-blue-600 mt-2">Uploading...</p>
              )}
              {(formData.image_url) && (
                <img
                  src={normalizePath(formData.image_url)}
                  alt="Preview"
                  className="mt-2 h-32 w-auto rounded border object-cover"
                  onError={(e) => {
                    console.log('Preview image failed to load')
                    e.target.style.display = 'none'
                  }}
                />
              )}
            </div>

            {/* Title - English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter image title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Title - Arabic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (Arabic)</label>
              <input
                type="text"
                name="title_ar"
                value={formData.title_ar}
                onChange={handleInputChange}
                placeholder="العنوان بالعربية"
                dir="rtl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                style={{ fontFamily: 'Cairo, Tahoma, sans-serif' }}
              />
            </div>

            {/* Description - English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter image description"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Description - Arabic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
              <textarea
                name="description_ar"
                value={formData.description_ar}
                onChange={handleInputChange}
                placeholder="الوصف بالعربية"
                rows="2"
                dir="rtl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                style={{ fontFamily: 'Cairo, Tahoma, sans-serif' }}
              />
            </div>


            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                name="display_order"
                value={formData.display_order}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
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
                src={normalizePath(img.image_url)}
                alt={img.title || 'Gallery image'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Use a valid fallback image
                  e.target.src = '/assets/images/bg-1.jpg'
                }}
              />
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm truncate">{img.title || 'Untitled'}</h3>
              <p className="text-xs text-gray-500">Order: {img.display_order}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(img)}
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
