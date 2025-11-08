import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { apiClient } from '@/lib/api'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface SendAlertModalProps {
  studentId: string
  studentName: string
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  onClose: () => void
  onSuccess?: () => void
}

export function SendAlertModal({
  studentId,
  studentName,
  guardianName,
  guardianPhone,
  guardianEmail,
  onClose,
  onSuccess
}: SendAlertModalProps) {
  const [messageType, setMessageType] = useState<'custom' | 'template'>('custom')
  const [templateType, setTemplateType] = useState('absenceAlert')
  const [channel, setChannel] = useState<'SMS' | 'EMAIL' | 'BOTH'>('SMS')
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [language, setLanguage] = useState<'EN' | 'RW'>('RW')
  const queryClient = useQueryClient()

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => apiClient.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      onSuccess?.()
      onClose()
    }
  })

  const sendTemplateMutation = useMutation({
    mutationFn: (data: any) => apiClient.sendTemplateMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      onSuccess?.()
      onClose()
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (messageType === 'template') {
      sendTemplateMutation.mutate({
        studentId,
        templateType,
        channel,
        variables: {}
      })
    } else {
      if (!content.trim()) {
        alert('Please enter a message')
        return
      }

      sendMessageMutation.mutate({
        studentId,
        recipientType: 'GUARDIAN',
        recipientName: guardianName,
        recipientPhone: guardianPhone,
        recipientEmail: guardianEmail,
        channel,
        type: 'GENERAL',
        content,
        subject: channel !== 'SMS' ? subject : undefined,
        language
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Send Alert to Parent</CardTitle>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-neutral-600">
              <strong>Student:</strong> {studentName}
            </p>
            {guardianName && (
              <p className="text-sm text-neutral-600">
                <strong>Guardian:</strong> {guardianName}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Message Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="custom"
                    checked={messageType === 'custom'}
                    onChange={(e) => setMessageType(e.target.value as 'custom')}
                    className="mr-2"
                  />
                  Custom Message
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="template"
                    checked={messageType === 'template'}
                    onChange={(e) => setMessageType(e.target.value as 'template')}
                    className="mr-2"
                  />
                  Template Message
                </label>
              </div>
            </div>

            {messageType === 'template' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Template
                </label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                >
                  <option value="absenceAlert">Absence Alert</option>
                  <option value="performanceAlert">Performance Alert</option>
                  <option value="riskAlert">Risk Alert</option>
                  <option value="meetingInvitation">Meeting Invitation</option>
                </select>
              </div>
            )}

            {messageType === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Message Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    placeholder="Enter your message here..."
                    required
                  />
                </div>

                {channel !== 'SMS' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Subject (for Email)
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      placeholder="Enter email subject..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'EN' | 'RW')}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  >
                    <option value="RW">Kinyarwanda</option>
                    <option value="EN">English</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'SMS' | 'EMAIL' | 'BOTH')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="SMS">SMS Only</option>
                <option value="EMAIL">Email Only</option>
                <option value="BOTH">SMS & Email</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={sendMessageMutation.isPending || sendTemplateMutation.isPending}
              >
                {sendMessageMutation.isPending || sendTemplateMutation.isPending
                  ? 'Sending...'
                  : 'Send Alert'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

