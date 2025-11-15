import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { apiClient } from '@/lib/api'
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface SendMessageToParentModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function SendMessageToParentModal({
  onClose,
  onSuccess
}: SendMessageToParentModalProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [channel, setChannel] = useState<'SMS' | 'EMAIL' | 'BOTH'>('SMS')
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [type, setType] = useState<'GENERAL' | 'ABSENCE_ALERT' | 'PERFORMANCE_ALERT' | 'MEETING_REQUEST' | 'INTERVENTION' | 'EMERGENCY'>('GENERAL')
  const [language, setLanguage] = useState<'EN' | 'RW'>('RW')
  const queryClient = useQueryClient()

  // Fetch all students for selection
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-message'],
    queryFn: () => apiClient.getStudents({ limit: 1000 })
  })

  const students = studentsData?.data || []

  const sendBulkMessageMutation = useMutation({
    mutationFn: (data: any) => apiClient.sendBulkMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      onSuccess?.()
      onClose()
    }
  })

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(students.map((s: any) => s._id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student')
      return
    }

    if (!content.trim()) {
      alert('Please enter a message')
      return
    }

    sendBulkMessageMutation.mutate({
      studentIds: selectedStudentIds,
      content,
      subject: channel !== 'SMS' ? subject : undefined,
      channel,
      type,
      language
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Send Message to Parents/Guardians</CardTitle>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-neutral-700">
                  Select Students ({selectedStudentIds.length} selected)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="min-h-[44px]"
                >
                  {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="border border-neutral-300 rounded-md max-h-60 overflow-y-auto p-3">
                {studentsLoading ? (
                  <div className="text-center py-8 text-neutral-500">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">No students found</div>
                ) : (
                  <div className="space-y-2">
                    {students.map((student: any) => {
                      const guardian = student.guardianContacts?.[0]
                      const hasContact = guardian && (guardian.phone || guardian.email)
                      return (
                        <label
                          key={student._id}
                          className={`flex items-start space-x-3 p-2 rounded-md cursor-pointer hover:bg-neutral-50 ${
                            !hasContact ? 'opacity-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => handleStudentToggle(student._id)}
                            disabled={!hasContact}
                            className="mt-1 min-w-[20px] min-h-[20px]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-neutral-900">
                                {student.firstName} {student.lastName}
                              </span>
                              {!hasContact && (
                                <span className="text-xs text-red-600">(No contact info)</span>
                              )}
                            </div>
                            {guardian && (
                              <div className="text-xs text-neutral-600 mt-1">
                                <span>Guardian: {guardian.name || 'N/A'}</span>
                                {guardian.phone && <span className="ml-2">📱 {guardian.phone}</span>}
                                {guardian.email && <span className="ml-2">✉️ {guardian.email}</span>}
                              </div>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Message Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Message Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md min-h-[44px] text-sm sm:text-base"
              >
                <option value="GENERAL">General</option>
                <option value="ABSENCE_ALERT">Absence Alert</option>
                <option value="PERFORMANCE_ALERT">Performance Alert</option>
                <option value="MEETING_REQUEST">Meeting Request</option>
                <option value="INTERVENTION">Intervention</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'SMS' | 'EMAIL' | 'BOTH')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md min-h-[44px] text-sm sm:text-base"
              >
                <option value="SMS">SMS Only</option>
                <option value="EMAIL">Email Only</option>
                <option value="BOTH">SMS & Email</option>
              </select>
            </div>

            {/* Message Content */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Message Content {channel === 'SMS' && <span className="text-xs text-neutral-500">(Max 1600 characters)</span>}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm sm:text-base"
                placeholder="Enter your message here..."
                required
                maxLength={channel === 'SMS' ? 1600 : undefined}
              />
              {channel === 'SMS' && (
                <p className="text-xs text-neutral-500 mt-1">
                  {content.length} / 1600 characters
                </p>
              )}
            </div>

            {/* Email Subject */}
            {channel !== 'SMS' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md min-h-[44px] text-sm sm:text-base"
                  placeholder="Enter email subject..."
                />
              </div>
            )}

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'EN' | 'RW')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md min-h-[44px] text-sm sm:text-base"
              >
                <option value="RW">Kinyarwanda</option>
                <option value="EN">English</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={sendBulkMessageMutation.isPending || selectedStudentIds.length === 0}
                className="min-h-[44px]"
              >
                {sendBulkMessageMutation.isPending
                  ? 'Sending...'
                  : `Send to ${selectedStudentIds.length} Parent${selectedStudentIds.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

