import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'

interface ExportRequest {
  upload_id: string
  filename: string
}

export const useExportPDF = () => {
  return useMutation({
    mutationFn: async ({ upload_id, filename }: ExportRequest) => {
      const response = await apiClient.post(
        ENDPOINTS.QUICK.EXPORT,
        { upload_id, filename },
        {
          responseType: 'blob', // Important for file download
        }
      )
      return response.data
    },
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${variables.filename}_analysis.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}
