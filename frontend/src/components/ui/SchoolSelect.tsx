import { useState, useEffect } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon, MapPinIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

interface School {
  _id: string
  name: string
  district: string
  sector: string
  phone?: string
  email?: string
}

interface SchoolSelectProps {
  value?: string
  onChange: (schoolId: string, school: School) => void
  onClear?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
}

export function SchoolSelect({ 
  value, 
  onChange, 
  onClear,
  placeholder = "Search and select your school...", 
  disabled = false,
  className = "",
  error
}: SchoolSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [filteredSchools, setFilteredSchools] = useState<School[]>([])
  const [allSchools, setAllSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)

  // Load schools on component mount
  useEffect(() => {
    const loadSchools = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getAllSchools()
        if (response.success) {
          setAllSchools(response.data)
        }
      } catch (error) {
        console.error('Failed to load schools:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSchools()
  }, [])

  // Filter schools based on search
  useEffect(() => {
    let filtered = allSchools

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = allSchools.filter(school => 
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.sector.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredSchools(filtered)
  }, [searchQuery, allSchools])

  // Set selected school when value changes
  useEffect(() => {
    if (value) {
      const school = allSchools.find(s => s._id === value)
      if (school) {
        setSelectedSchool(school)
      } else {
        setSelectedSchool(null)
      }
    } else {
      setSelectedSchool(null)
    }
  }, [value, allSchools])

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school)
    onChange(school._id, school)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = () => {
    setSelectedSchool(null)
    setSearchQuery('')
    setIsOpen(false)
    if (onClear) {
      onClear()
    } else {
      onChange('', {} as School)
    }
  }

  const getSchoolDisplayName = (school: School) => {
    return `${school.name} - ${school.district}, ${school.sector}`
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 text-left border rounded-md shadow-sm
            ${error ? 'border-red-300 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'}
            ${disabled ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
            focus:outline-none focus:ring-1 focus:ring-primary-500
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="h-4 w-4 text-neutral-400" />
              <span className={selectedSchool ? 'text-neutral-900' : 'text-neutral-500'}>
                {selectedSchool ? getSchoolDisplayName(selectedSchool) : placeholder}
              </span>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {selectedSchool && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Search Header */}
          <div className="p-3 border-b border-neutral-200 bg-neutral-50">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          </div>

          {/* School List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredSchools.length === 0 ? (
              <div className="p-4 text-center text-neutral-500">
                No schools found matching your criteria
              </div>
            ) : (
              filteredSchools.map((school) => (
                <button
                  key={school._id}
                  type="button"
                  onClick={() => handleSchoolSelect(school)}
                  className="w-full px-4 py-3 text-left hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none border-b border-neutral-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {school.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPinIcon className="h-3 w-3 text-neutral-400" />
                        <p className="text-xs text-neutral-500">
                          {school.district}, {school.sector}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer with stats */}
          <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500">
            Showing {filteredSchools.length} of {allSchools.length} schools
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
