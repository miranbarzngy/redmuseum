'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'
import Link from 'next/link'

// Default categories as fallback
const defaultCategories = [
  { id: 'documents', name_en: 'Documents', name_ku: 'بەڵگەنامەکان' },
  { id: 'letters', name_en: 'Letters', name_ku: 'نامەکان' },
  { id: 'photos', name_en: 'Photos', name_ku: 'وێنە کۆنەکان' },
]

// Helper function to normalize paths
const normalizePath = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `/${path}`
}

// Map old category strings to slugs for backward compatibility
const categoryStringToSlug = {
  'Documents': 'documents',
  'Letters': 'letters',
  'Photos': 'photos'
}

export default function ArchiveManagement() {
  const [categories, setCategories] = useState([])
  const [archive, setArchive] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title_en: '',
    title_ku: '',
    title_ar: '',
    description_en: '',
    description_ku: '',
    description_ar: '',
    category_id: '',
    image_url: '',
    file_url: '',
    display_order: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      setCategories(defaultCategories)
      return
    }

    try {
      const { data, error } = await supabase
        .from('archive_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      
      if (data && data.length > 0) {
        setCategories(data)
        setSelectedCategory(data[0].id)
      } else {
        setCategories(defaultCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories(defaultCategories)
    }
  }

  useEffect(() => {
    if (selectedCategory) {
      fetchArchive()
    }
  }, [selectedCategory])

  const fetchArchive = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      setLoading(false)
      return
    }

    try {
      // Fetch ALL records without any filter - show both active and inactive
      const { data, error } = await supabase
        .from('digital_archive')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      console.log('Archive fetched:', data?.length || 0)
      setArchive(data || [])
    } catch (error) {
      console.error('Error fetching archive:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('digital_archive')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchArchive()
    } catch (error) {
      alert('Error deleting item: ' + error.message)
    }
  }

  // Handle file upload to Supabase Storage
  const handleFileUpload = async (file, type = 'image') => {
    if (!file) return null
    
    setUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const folder = type === 'image' ? 'archive-images' : 'archive-files'
      const filePath = `${folder}/${fileName}`
      
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

  // Handle image selection
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadedUrl = await handleFileUpload(file, 'image')
    
    if (uploadedUrl) {
      setFormData(prev => ({
        ...prev,
        image_url: uploadedUrl
      }))
    }
  }

  // Handle file (PDF) selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadedUrl = await handleFileUpload(file, 'file')
    
    if (uploadedUrl) {
      setFormData(prev => ({
        ...prev,
        file_url: uploadedUrl
      }))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!formData.image_url) {
      alert('Please select or upload an image')
      return
    }

    if (!formData.category_id) {
      alert('Please select a category')
      return
    }

    const displayOrder = parseInt(formData.display_order) || 0

    // Find the category to get its slug for backward compatibility
    const selectedCat = categories.find(c => c.id === formData.category_id)
    const categorySlug = selectedCat ? selectedCat.slug : ''

    const data = {
      title_en: formData.title_en || null,
      title_ku: formData.title_ku || null,
      title_ar: formData.title_ar || null,
      description_en: formData.description_en || null,
      description_ku: formData.description_ku || null,
      description_ar: formData.description_ar || null,
      category_id: formData.category_id,
      category: categorySlug, // Keep for backward compatibility
      image_url: formData.image_url,
      file_url: formData.file_url || null,
      display_order: displayOrder,
      is_active: true
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('digital_archive')
          .update(data)
          .eq('id', editingItem.id)
        
        if (error) throw error
        console.log('Item updated successfully')
      } else {
        const { error } = await supabase
          .from('digital_archive')
          .insert([data])
        
        if (error) throw error
        console.log('Item added successfully')
      }
      
      setEditingItem(null)
      setIsAdding(false)
      setFormData({ 
        title_en: '',
        title_ku: '',
        title_ar: '',
        description_en: '',
        description_ku: '',
        description_ar: '',
        category_id: '',
        image_url: '',
        file_url: '',
        display_order: 0 
      })
      
      fetchArchive()
    } catch (error) {
      alert('Error saving: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setIsAdding(true)
    
    // Handle both old category field and new category_id
    let categoryId = item.category_id
    if (!categoryId && item.category) {
      // Try to find category by slug or map from old category string
      const slug = categoryStringToSlug[item.category] || item.category.toLowerCase()
      const cat = categories.find(c => c.slug === slug || c.id === slug)
      if (cat) {
        categoryId = cat.id
      }
    }
    
    setFormData({
      title_en: item.title_en || '',
      title_ku: item.title_ku || '',
      title_ar: item.title_ar || '',
      description_en: item.description_en || '',
      description_ku: item.description_ku || '',
      description_ar: item.description_ar || '',
      category_id: categoryId || '',
      image_url: item.image_url || '',
      file_url: item.file_url || '',
      display_order: item.display_order || 0
    })
  }

  const handleCancel = () => {
    setEditingItem(null)
    setIsAdding(false)
    setFormData({ 
      title_en: '',
      title_ku: '',
      title_ar: '',
      description_en: '',
      description_ku: '',
      description_ar: '',
      category_id: '',
      image_url: '',
      file_url: '',
      display_order: 0 
    })
  }

  // Get category by ID
  const getCategoryById = (categoryId) => {
    if (!categoryId) return null
    return categories.find(c => c.id === categoryId)
  }

  // Filter items based on selected category
  const filteredItems = archive.filter(item => {
    // First check category_id, then fall back to old category field
    if (selectedCategory) {
      if (item.category_id === selectedCategory) return true
      // Backward compatibility: check old category field
      const cat = getCategoryById(selectedCategory)
      if (cat && item.category && (item.category.toLowerCase() === cat.slug || item.category.toLowerCase() === cat.id)) {
        return true
      }
      return false
    }
    return true
  })

  // Get category display name
  const getCategoryName = (item) => {
    if (item.category_id) {
      const cat = getCategoryById(item.category_id)
      if (cat) return cat.name_en
    }
    // Fallback to old category field
    if (item.category) {
      const slug = item.category.toLowerCase()
      const cat = categories.find(c => c.slug === slug)
      if (cat) return cat.name_en
      return item.category
    }
    return 'Unknown'
  }

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
        <h1 className="text-3xl font-bold">Digital Archive Management</h1>
        <Link
          href="/admin/archive/categories"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Manage Categories
        </Link>
      </div>

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
                title_en: '',
                title_ku: '',
                description_en: '',
                description_ku: '',
                category_id: cat.id,
                image_url: '',
                file_url: '',
                display_order: 0 
              })
            }}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cat.name_en} / {cat.name_ku}
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
              title_en: '',
              title_ku: '',
              description_en: '',
              description_ku: '',
              category_id: selectedCategory,
              image_url: '',
              file_url: '',
              display_order: filteredItems.length + 1 
            })
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          ➕ Add New Archive Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingItem) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingItem ? 'Edit Archive Item' : 'Add New Archive Item'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_en} / {cat.name_ku}
                  </option>
                ))}
              </select>
            </div>

            {/* Title English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
              <input
                type="text"
                name="title_en"
                value={formData.title_en}
                onChange={handleInputChange}
                placeholder="Enter title in English"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Title Kurdish */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>Title (کوردی)</label>
              <input
                type="text"
                name="title_ku"
                value={formData.title_ku}
                onChange={handleInputChange}
                placeholder="ناونان لە کوردی"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}
                dir="rtl"
              />
            </div>

            {/* Title Arabic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-arabic">العنوان (بالعربية)</label>
              <input
                type="text"
                name="title_ar"
                value={formData.title_ar}
                onChange={handleInputChange}
                placeholder="أدخل العنوان بالعربية"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-arabic"
                dir="rtl"
              />
            </div>

            {/* Description English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
              <textarea
                name="description_en"
                value={formData.description_en}
                onChange={handleInputChange}
                placeholder="Enter description in English"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Description Kurdish */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>Description (کوردی)</label>
              <textarea
                name="description_ku"
                value={formData.description_ku}
                onChange={handleInputChange}
                placeholder="وەسفکردن بە کوردی"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}
                dir="rtl"
              />
            </div>

            {/* Description Arabic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-arabic">الوصف (بالعربية)</label>
              <textarea
                name="description_ar"
                value={formData.description_ar}
                onChange={handleInputChange}
                placeholder="أدخل الوصف بالعربية"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-arabic"
                dir="rtl"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archive Image</label>
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
                  📤 Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
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

            {/* File (PDF) Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF/File (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="file_url"
                  value={formData.file_url}
                  onChange={handleInputChange}
                  placeholder="Enter file URL or upload a PDF"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
                  📄 Upload PDF
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              {formData.file_url && (
                <p className="text-green-600 mt-2">✓ File uploaded</p>
              )}
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

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Image container with object-contain to show full image */}
            <div className="relative h-48 bg-zinc-100 p-2 flex items-center justify-center">
              <img
                src={normalizePath(item.image_url)}
                alt={item.title_en || item.title_ku || 'Archive item'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = '/assets/images/bg-1.jpg'
                }}
              />
              <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                {getCategoryName(item)}
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm truncate">{item.title_en || item.title_ku || 'Untitled'}</h3>
              <p className="text-xs text-gray-500">Order: {item.display_order}</p>
              {item.file_url && (
                <span className="text-xs text-purple-600">📄 Has PDF</span>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items in this category. Click "Add New Archive Item" to add one.
        </div>
      )}
    </div>
  )
}
