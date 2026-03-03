'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase-client'
import Link from 'next/link'

// Default categories as fallback
const defaultCategories = [
  { id: 'documents', name_en: 'Documents', name_ku: 'بەڵگەنامەکان', slug: 'documents', display_order: 1 },
  { id: 'letters', name_en: 'Letters', name_ku: 'نامەکان', slug: 'letters', display_order: 2 },
  { id: 'photos', name_en: 'Photos', name_ku: 'وێنە کۆنەکان', slug: 'photos', display_order: 3 },
]

export default function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name_en: '',
    name_ku: '',
    slug: '',
    display_order: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      setCategories(defaultCategories)
      setLoading(false)
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
      } else {
        setCategories(defaultCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories(defaultCategories)
    } finally {
      setLoading(false)
    }
  }

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'name_en' && !editingCategory) {
      // Auto-generate slug from English name
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }))
    } else if (name === 'name_ku' && !formData.name_en) {
      // If no English name, use Kurdish for slug
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'display_order' ? parseInt(value) || 0 : value
      }))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!formData.name_en || !formData.name_ku || !formData.slug) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)

    const data = {
      name_en: formData.name_en,
      name_ku: formData.name_ku,
      slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      display_order: parseInt(formData.display_order) || 0
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('archive_categories')
          .update(data)
          .eq('id', editingCategory.id)
        
        if (error) throw error
        console.log('Category updated successfully')
      } else {
        const { error } = await supabase
          .from('archive_categories')
          .insert([data])
        
        if (error) throw error
        console.log('Category added successfully')
      }
      
      setEditingCategory(null)
      setIsAdding(false)
      setFormData({ 
        name_en: '',
        name_ku: '',
        slug: '',
        display_order: 0 
      })
      
      fetchCategories()
    } catch (error) {
      alert('Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setIsAdding(true)
    setFormData({
      name_en: category.name_en || '',
      name_ku: category.name_ku || '',
      slug: category.slug || '',
      display_order: category.display_order || 0
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category? Archive items in this category will not be deleted but will need to be reassigned.')) return

    try {
      const { error } = await supabase
        .from('archive_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchCategories()
    } catch (error) {
      alert('Error deleting category: ' + error.message)
    }
  }

  const handleCancel = () => {
    setEditingCategory(null)
    setIsAdding(false)
    setFormData({ 
      name_en: '',
      name_ku: '',
      slug: '',
      display_order: 0 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/archive"
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold">Archive Categories</h1>
        </div>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingCategory(null)
            setFormData({ 
              name_en: '',
              name_ku: '',
              slug: '',
              display_order: categories.length + 1 
            })
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Name English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                placeholder="e.g., Videos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Name Kurdish */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>
                ناوی پۆلێن (کوردی) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name_ku"
                value={formData.name_ku}
                onChange={handleInputChange}
                placeholder="وەکوو ڤیدیۆکان"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}
                dir="rtl"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL-friendly identifier) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="e.g., videos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Used in URLs: /archive?category=videos
              </p>
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
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
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

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name (English)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name (کوردی)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.display_order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {category.name_en}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }} dir="rtl">
                  {category.name_ku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {category.slug}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No categories found. Click "Add New Category" to create one.
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Categories will appear as filter buttons on the public archive page</li>
          <li>• Use the UniSalar font for Kurdish text to ensure proper display</li>
          <li>• The "All" (هەموو) filter is always shown by default</li>
          <li>• Deleting a category won't delete archive items, but they'll need reassignment</li>
        </ul>
      </div>
    </div>
  )
}
