<script lang="ts" setup>
import type { UploadFile, UploadInstance } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { genrateFileHash } from './fileUtils'
import { useUpload } from './useUpload'

// 引用元素
const uploadRef = ref<UploadInstance>()

// 响应式数据
const fileInfo = reactive({
  name: '',
  size: 0,
  type: '',
})

const chunkSize = 1 * 1024 * 1024 // 1MB
let fileHash = ''
let chunks: { index: number, file: Blob }[] = []
let file: File | null = null

// 上传状态
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref<'success' | 'exception' | ''>('')
const previewDialogVisible = ref(false)
const previewUrl = ref('')

// 格式化文件大小
function formatFileSize(size: number): string {
  if (size < 1024)
    return `${size} B`
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// 处理文件变化
function handleFileChange(uploadFile: UploadFile) {
  if (uploadFile.raw) {
    file = uploadFile.raw
    fileInfo.name = file.name
    fileInfo.size = file.size
    fileInfo.type = file.type

    // 生成文件预览URL（如果是图片）
    if (file.type.startsWith('image/')) {
      previewUrl.value = URL.createObjectURL(file)
    }

    // 生成文件hash
    genrateFileHash(file).then((hash: any) => {
      fileHash = hash
      console.log('文件hash:', fileHash)
    })
  }
}

// 分割文件
function createChunks(file: File, chunkSize: number) {
  const chunks = []
  let start = 0

  while (start < file.size) {
    chunks.push({
      index: chunks.length,
      file: file.slice(start, start + chunkSize),
    })
    start += chunkSize
  }

  return chunks
}

// 处理上传
async function handleUpload() {
  if (!file) {
    ElMessage.warning('请先选择文件')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = ''

  try {
    // 分割文件
    chunks = createChunks(file, chunkSize)

    // 使用上传hook
    const { uploadChunks, mergeRequest } = useUpload({ file, chunks, fileHash })

    // 上传所有分片并更新进度
    for (let i = 0; i < chunks.length; i++) {
      await uploadChunks()
      uploadProgress.value = Math.round(((i + 1) / chunks.length) * 100)
    }

    // 合并请求
    await mergeRequest()

    uploadProgress.value = 100
    uploadStatus.value = 'success'
    ElMessage.success('上传完成!')
  }
  catch (error) {
    console.error('上传失败:', error)
    uploadStatus.value = 'exception'
    ElMessage.error(`上传失败: ${(error as Error).message}`)
  }
  finally {
    isUploading.value = false
  }
}

// 重置上传
function resetUpload() {
  uploadRef.value?.clearFiles()
  fileInfo.name = ''
  fileInfo.size = 0
  fileInfo.type = ''
  file = null
  fileHash = ''
  chunks = []
  uploadProgress.value = 0
  uploadStatus.value = ''
  previewUrl.value = ''
}
</script>

<template>
  <div class="upload-container">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span>文件分片上传</span>
        </div>
      </template>

      <el-upload
        ref="uploadRef" class="upload-demo" drag action="#" :auto-upload="false" :on-change="handleFileChange"
        :show-file-list="false"
      >
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            请选择要上传的文件
          </div>
        </template>
      </el-upload>

      <div v-if="fileInfo.name" class="file-info">
        <el-descriptions title="文件信息" :column="1" border>
          <el-descriptions-item label="文件名">
            {{ fileInfo.name }}
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">
            {{ formatFileSize(fileInfo.size) }}
          </el-descriptions-item>
          <el-descriptions-item label="分片大小">
            {{ formatFileSize(chunkSize) }}
          </el-descriptions-item>
          <el-descriptions-item label="总分片数">
            {{ Math.ceil(fileInfo.size / chunkSize) }}
          </el-descriptions-item>
          <el-descriptions-item label="文件预览">
            <el-image
              :src="previewUrl" :preview-src-list="[previewUrl]" fit="cover" class="preview-image" alt="预览图片"
              style="width: 100px; height: 100px"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="uploadProgress > 0" class="progress-container">
        <el-progress :percentage="uploadProgress" :status="uploadStatus" />
      </div>

      <div class="button-group">
        <el-button
          type="primary" :disabled="!fileInfo.name || isUploading" :loading="isUploading"
          @click="handleUpload"
        >
          {{ isUploading ? '上传中...' : '开始上传' }}
        </el-button>
        <el-button @click="resetUpload">
          重置
        </el-button>
      </div>
    </el-card>

    <el-dialog v-model="previewDialogVisible" title="预览">
      <img v-if="previewUrl" :src="previewUrl" class="preview-image" alt="预览图片">
    </el-dialog>
  </div>
</template>

<style scoped>
.upload-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.upload-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-info {
  margin-top: 20px;
}

.progress-container {
  margin: 20px 0;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
}
</style>
