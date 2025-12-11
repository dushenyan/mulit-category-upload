const UPLOAD_URL = 'http://localhost:3000/upload?'
const MERGE_URL = 'http://localhost:3000/upload/merge'

export interface UploadOption {
  file: File
  chunks: { index: number, file: Blob }[]
  fileHash: string
}

export interface UploadResult {
  success: boolean
  message?: string
  error?: any
}

export interface MergeResult {
  success: boolean
  message?: string
  data?: any
  error?: any
}

export function useUpload(option: UploadOption) {
  const { file, chunks, fileHash } = option

  /**
   * 上传分片
   * @param existingChunks 已上传的分片
   * @returns 上传结果
   */
  async function uploadChunks(existingChunks: { index: number }[] = []): Promise<UploadResult> {
    const uploadedChunkIndexes = existingChunks.map(c => c.index)

    // 过滤掉已上传的分片
    const chunksToUpload = chunks.filter(chunk => !uploadedChunkIndexes.includes(chunk.index))

    // 逐个上传分片
    for (let i = 0; i < chunksToUpload.length; i++) {
      const chunk = chunksToUpload[i]

      // 检查分片是否存在
      if (!chunk || !chunk.file) {
        console.warn(`跳过空分片: ${chunk?.index}`)
        continue
      }

      const formData = new FormData()
      formData.append('file', chunk.file)

      const searchParams = new URLSearchParams()
      searchParams.append('index', chunk.index.toString())
      searchParams.append('fileHash', fileHash)

      try {
        const response = await fetch(
          UPLOAD_URL + searchParams.toString(),
          {
            method: 'POST',
            body: formData,
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }
      catch (err) {
        console.error(`上传分片 ${chunk.index} 失败:`, err)
        return {
          success: false,
          error: err,
          message: `上传分片 ${chunk.index} 失败`,
        }
      }
    }

    return {
      success: true,
      message: `成功上传 ${chunksToUpload.length} 个分片`,
    }
  }

  /**
   * 合并请求
   * @returns 合并结果
   */
  async function mergeRequest(): Promise<MergeResult> {
    try {
      const response = await fetch(MERGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileHash,
          fileName: file.name,
          total: chunks.length,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        message: '文件合并成功',
        data: result,
      }
    }
    catch (err) {
      console.error('合并失败:', err)
      return {
        success: false,
        error: err,
        message: '文件合并失败',
      }
    }
  }

  return {
    uploadChunks,
    mergeRequest,
  }
}
