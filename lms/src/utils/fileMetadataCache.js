// 文件元数据缓存工具
import { getCacheKey, createDefaultFileMetadata, logFileAction } from './fileUtils';

const VITE_COURSE_API_DOMAIN = import.meta.env.VITE_COURSE_API_DOMAIN_NAME;

// 全局文件元数据缓存
const fileMetadataCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

/**
 * 获取单个文件元数据（带缓存）
 * @param {string} fileId - 文件ID
 * @param {string} token - 访问令牌
 * @returns {Promise<Object>} 文件元数据
 */
export const getFileMetadata = async (fileId, token) => {
  const cacheKey = getCacheKey('file', fileId);
  const cached = fileMetadataCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  try {
    const response = await fetch(`${VITE_COURSE_API_DOMAIN}/diskFiles/selectById/${fileId}`, {
      headers: { token }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file metadata for ${fileId}`);
    }
    
    const metadata = await response.json();
    
    // 缓存元数据
    fileMetadataCache.set(cacheKey, {
      data: metadata,
      timestamp: Date.now()
    });
    
    return metadata;
  } catch (error) {
    console.error(`Error fetching file metadata for ${fileId}:`, error);
    return createDefaultFileMetadata(fileId);
  }
};

/**
 * 批量获取多个文件的元数据
 * @param {Array<string>} fileIds - 文件ID数组
 * @param {string} token - 访问令牌
 * @returns {Promise<Map>} 文件ID到元数据的映射
 */
export const getBatchFileMetadata = async (fileIds, token) => {
  if (!fileIds || fileIds.length === 0) {
    return new Map();
  }
  
  const uncachedIds = [];
  const cachedResults = new Map();
  
  // 检查缓存
  fileIds.forEach(fileId => {
    const cacheKey = getCacheKey('file', fileId);
    const cached = fileMetadataCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      cachedResults.set(fileId, cached.data);
    } else {
      uncachedIds.push(fileId);
    }
  });
  
  
  // 批量获取未缓存的文件元数据
  if (uncachedIds.length > 0) {
    
    const batchPromises = uncachedIds.map(async (fileId) => {
      try {
        const response = await fetch(`${VITE_COURSE_API_DOMAIN}/diskFiles/selectById/${fileId}`, {
          headers: { token }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file metadata for ${fileId}`);
        }
        
        const metadata = await response.json();
        
        // 缓存结果
        fileMetadataCache.set(getCacheKey('file', fileId), {
          data: metadata,
          timestamp: Date.now()
        });
        
        return { fileId, metadata };
      } catch (error) {
        console.error(`Error fetching file metadata for ${fileId}:`, error);
        return { 
          fileId, 
          metadata: createDefaultFileMetadata(fileId)
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ fileId, metadata }) => {
      cachedResults.set(fileId, metadata);
    });
    
  }
  
  return cachedResults;
};

/**
 * 清除文件元数据缓存
 * @param {string} fileId - 可选，指定文件ID，不传则清除所有缓存
 */
export const clearFileMetadataCache = (fileId = null) => {
  if (fileId) {
    fileMetadataCache.delete(`file-${fileId}`);
  
  } else {
    fileMetadataCache.clear();
 
  }
};

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  fileMetadataCache.forEach((value, key) => {
    if (now - value.timestamp < CACHE_DURATION) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });
  
  return {
    totalEntries: fileMetadataCache.size,
    validEntries,
    expiredEntries,
    cacheDuration: CACHE_DURATION
  };
};

/**
 * 清理过期的缓存条目
 */
export const cleanupExpiredCache = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  fileMetadataCache.forEach((value, key) => {
    if (now - value.timestamp >= CACHE_DURATION) {
      fileMetadataCache.delete(key);
      cleanedCount++;
    }
  });
  
  return cleanedCount;
};
