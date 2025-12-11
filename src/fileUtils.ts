import SparkMD5 from 'spark-md5'

/**
 * 生成文件hash
 * @param file 文件
 * @returns 文件hash
 */
export function genrateFileHash(file: File) {
  return new Promise((resolve) => {
    const spark = new SparkMD5.ArrayBuffer()
    const reader = new FileReader()
    const size = file.size
    const offset = 2 * 1024 * 1024

    // 读取文件前2M，中间2M，最后2M的内容来计算hash
    const chunks = [
      file.slice(0, offset),
      file.slice(size / 2 - offset / 2, size / 2 + offset / 2),
      file.slice(size - offset, size),
    ]

    let currentChunkIndex = 0
    reader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer)
      currentChunkIndex++
      if (currentChunkIndex < chunks.length) {
        reader.readAsArrayBuffer(chunks[currentChunkIndex] as Blob)
      }
      else {
        resolve(spark.end())
      }
    }

    reader.readAsArrayBuffer(chunks[currentChunkIndex] as Blob)
  })
}

/**
 * 创建文件分片
 * @param file 文件
 * @param offset 分片大小
 * @returns 分片数组
 */
export function createChunks(file: File, offset: number) {
  const chunks = []
  let start = 0
  while (start < file.size) {
    chunks.push({
      index: chunks.length,
      file: file.slice(start, start + offset),
    })
    start += offset
  }

  return chunks
}
