// 请求去重工具 - 防止同一API被多次调用
const pendingRequests = new Map();

export const deduplicateRequest = async (key, requestFn) => {
  // 如果相同的请求正在进行中，返回现有的Promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // 创建新的请求Promise
  const requestPromise = requestFn().finally(() => {
    // 请求完成后清理
    pendingRequests.delete(key);
  });

  // 存储请求Promise
  pendingRequests.set(key, requestPromise);
  
  return requestPromise;
};

// 清理所有待处理的请求
export const clearPendingRequests = () => {
  pendingRequests.clear();
  console.log('清理所有待处理请求');
};

// 获取当前待处理请求数量
export const getPendingRequestsCount = () => {
  return pendingRequests.size;
};
