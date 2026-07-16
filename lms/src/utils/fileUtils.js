// 文件处理工具函数
const VITE_COURSE_API_DOMAIN = import.meta.env.VITE_COURSE_API_DOMAIN_NAME;

/**
 * 从内容项数组中收集文件ID
 * @param {Array} items - 内容项数组
 * @returns {Array<string>} 文件ID数组
 */
export const collectFileIds = (items) => {
  if (!items || items.length === 0) return [];
  
  return items
    .filter(item => item.type === "file" && item.fileId)
    .map(item => item.fileId);
};

/**
 * 创建默认的文件元数据（用于错误处理）
 * @param {string} fileId - 文件ID
 * @returns {Object} 默认文件元数据
 */
export const createDefaultFileMetadata = (fileId) => ({
  data: {
    name: "Unknown file",
    size: 0,
    category: "file",
    path: null
  }
});

/**
 * 构建文件对象
 * @param {Object} item - 原始内容项
 * @param {Object} metadata - 文件元数据
 * @param {string} token - 访问令牌
 * @param {boolean} loadFileContent - 是否加载文件内容
 * @returns {Object} 构建的文件对象
 */
export const buildFileObject = (item, metadata, token, loadFileContent = false) => {
  return {
    id: item.id,
    type: "file",
    fileId: item.fileId,
    name: metadata.data.name || "Untitled file",
    path: metadata.data.path || null,
    size: metadata.data.size || 0,
    badgeType: metadata.data.category,
    // 延迟加载：只在需要时才生成下载链接
    downloadUrl: loadFileContent 
      ? `${VITE_COURSE_API_DOMAIN}/diskFiles/download/${item.fileId}?token=${token}`
      : null,
    // 提供延迟加载函数
    loadContent: () => ({
      downloadUrl: `${VITE_COURSE_API_DOMAIN}/diskFiles/download/${item.fileId}?token=${token}`
    })
  };
};

/**
 * 生成缓存键
 * @param {string} prefix - 前缀
 * @param {string} id - ID
 * @returns {string} 缓存键
 */
export const getCacheKey = (prefix, id) => `${prefix}-${id}`;

/**
 * 统一的文件处理日志
 * @param {string} action - 操作类型
 * @param {number} count - 文件数量
 * @param {string} details - 详细信息
 */
export const logFileAction = (action, count, details = '') => {
  const emoji = {
    'preload': '📁',
    'cache': '📦',
    'fetch': '🌐',
    'complete': '✅',
    'error': '❌'
  }[action] || '📄';
  
  console.log(`${emoji} ${action} ${count} 个文件${details ? ` - ${details}` : ''}`);
};
