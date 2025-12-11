import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'

import express from 'express'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

// 上传目录
const UPLOAD_DIR = path.resolve(__dirname, 'upload')

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR)
}

// 修改multer配置
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const fileHash = req.query.fileHash as string
    const chunkDir = path.resolve(UPLOAD_DIR, fileHash)
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir)
    }
    cb(null, chunkDir)
  },
  filename: (req, _file, cb) => {
    const query = req.query
    // 使用fileHash和index作为文件名  分片
    cb(null, `${query.fileHash}-${query.index}`)
  },
})

// 创建一个普通上传中间件来解析字段
const upload = multer({
  storage,
})

// 格式化文件大小的辅助函数
function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

// 设置静态资源目录，添加 MIME 类型支持
app.use('/assets', express.static(path.join(__dirname, 'upload'), {
  setHeaders: (res, filePath) => {
    // 根据文件扩展名设置正确的 MIME 类型
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/mp4', // 将 MOV 文件也设置为 mp4 类型以提高兼容性
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.mpeg': 'video/mpeg',
      '.mpg': 'video/mpeg',
      '.m4v': 'video/x-m4v',
      '.3gp': 'video/3gpp',
      '.ogv': 'video/ogg',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      '.wma': 'audio/x-ms-wma',
      '.aiff': 'audio/aiff',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    }

    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext])
    }
  },
}))

// 设置 Pug 模板引擎
app.set('view engine', 'pug')
// 设置模板目录
app.set('views', path.join(__dirname, ''))

// 首页路由
app.get('/', (req, res) => {
  res.render('home', { title: '文件上传服务', message: '欢迎使用文件分片上传服务!' })
})

// 资源页面路由 - 显示所有上传的文件
app.get('/assets', (req, res) => {
  try {
    // 读取上传目录中的所有文件
    const files = fs.readdirSync(UPLOAD_DIR)

    // 过滤出非分片目录（完整文件）
    const mergedFiles = files.filter((file) => {
      // 排除只包含哈希值的目录（分片目录）
      return !file.match(/^[a-f0-9]{32}$/) && !fs.statSync(path.join(UPLOAD_DIR, file)).isDirectory()
    })

    // 获取文件详细信息
    const fileList = mergedFiles.map((file) => {
      const filePath = path.join(UPLOAD_DIR, file)
      const stat = fs.statSync(filePath)
      return {
        name: file,
        size: stat.size,
        formattedSize: formatFileSize(stat.size), // 添加格式化后的文件大小
        modified: stat.mtime,
        url: `/assets/${file}`,
        // 判断文件类型以支持预览 - 扩展更多格式
        isImage: /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file),
        isVideo: /\.(mp4|avi|wmv|flv|webm|mkv|mpeg|mpg|m4v|3gp|ogv)$/i.test(file),
        isAudio: /\.(mp3|wav|ogg|m4a|aac|flac|wma|aiff)$/i.test(file),
        isText: /\.(txt|md|json|xml|log|css|js|html|csv)$/i.test(file),
      }
    })

    res.render('assets', {
      title: '资源列表',
      message: '切片上传的文件',
      files: fileList,
    })
  }
  catch (err) {
    console.error('读取文件列表失败:', err)
    res.status(500).render('assets', {
      title: '资源列表',
      message: '读取文件列表失败',
      files: [],
    })
  }
})

// 上传分片
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({
    code: 200,
    success: true,
    message: '分片上传成功',
  })
})

// 合并分片
app.post('/upload/merge', async (req, res) => {
  const { fileHash, fileName, total } = req.body
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}-${fileName}`)
  const chunkDir = path.resolve(UPLOAD_DIR, fileHash)

  try {
    // 检查分片是否完整
    let chunks = fs.readdirSync(chunkDir)
    if (chunks.length !== total) {
      return res.status(400).json({
        success: false,
        message: '分片数量不匹配',
      })
    }

    // 按照索引排序
    chunks = chunks.sort((a: string = '', b: string = '') => {
      const aIndex = Number.parseInt(a.split('-').pop() || '0')
      const bIndex = Number.parseInt(b.split('-').pop() || '0')
      return aIndex - bIndex
    })

    // 创建写入流
    const writeStream = fs.createWriteStream(filePath)

    // 顺序合并文件
    for (const chunk of chunks) {
      const chunkPath = path.resolve(chunkDir, chunk)
      const chunkData = fs.readFileSync(chunkPath)
      writeStream.write(chunkData)
    }

    // 关闭写入流
    writeStream.end()

    // 等待写入完成
    await new Promise((resolve) => {
      writeStream.on('finish', resolve)
    })

    // 删除临时分片目录
    fs.rmSync(chunkDir, { recursive: true, force: true })

    res.json({
      code: 200,
      success: true,
      message: '合并成功',
      url: `/assets/${fileHash}-${fileName}`,
    })
  }
  catch (err) {
    console.error('合并失败:', err)
    res.status(500).json({
      code: 500,
      success: false,
      message: '合并失败',
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

// 获取已上传的分片信息（用于断点续传）
app.get('/upload/chunks', (req, res) => {
  const { fileHash } = req.query as { fileHash: string }

  if (!fileHash) {
    return res.status(400).json({
      success: false,
      message: '缺少fileHash参数',
    })
  }

  const chunkDir = path.resolve(UPLOAD_DIR, fileHash)

  try {
    if (!fs.existsSync(chunkDir)) {
      return res.json({
        success: true,
        data: [],
      })
    }

    const chunks = fs.readdirSync(chunkDir)
    const uploadedChunks = chunks.map((chunk) => {
      const index = Number.parseInt(chunk.split('-').pop() || '0')
      return { index }
    })

    res.json({
      success: true,
      data: uploadedChunks,
    })
  }
  catch (err) {
    res.status(500).json({
      success: false,
      message: '获取分片信息失败',
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

// 启动服务器
const PORT = 3000
app.listen(PORT, () => {
  console.log(`服务器已启动，访问 http://localhost:${PORT}`)
  console.log(`资源页面访问 http://localhost:${PORT}/assets`)
})
