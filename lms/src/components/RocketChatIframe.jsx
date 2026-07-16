import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.js';

const RocketChatIframe = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [iframeKey, setIframeKey] = useState(Date.now());
    const [loggedOut, setLoggedOut] = useState(false);
    
    const ROCKETCHAT_BASE_URL = 'https://dev.chat.xlearnedu.com';

    // ⭐ 先登出，清除旧的 session
    useEffect(() => {
        const logoutRocketChat = async () => {
            try {
                console.log('🚪 Logging out from RocketChat to clear old session...');
                await fetch(`${ROCKETCHAT_BASE_URL}/api/v1/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
                console.log('✅ Logged out from RocketChat');
            } catch (e) {
                console.log('⚠️ Logout failed (may already be logged out):', e.message);
            } finally {
                setLoggedOut(true);
            }
        };

        if (user?.rocketChatToken && !loggedOut) {
            logoutRocketChat();
        } else if (!user?.rocketChatToken) {
            setLoggedOut(true);
        }
    }, [user, loggedOut]);

    // ⭐ 只有登出后才构造 URL
    const rocketChatUrl = (user?.rocketChatToken && loggedOut)
        ? `${ROCKETCHAT_BASE_URL}/home?resumeToken=${user.rocketChatToken}`
        : null;

    useEffect(() => {
        if (rocketChatUrl) {
            console.log('🔗 RocketChat URL constructed');
            setLoading(false);
        }
    }, [rocketChatUrl]);

    // iframe 加载完成
    const handleIframeLoad = useCallback(() => {
        console.log('✅ RocketChat iframe loaded successfully');
        setIframeLoaded(true);
    }, []);

    // iframe 加载失败
    const handleIframeError = useCallback(() => {
        console.error('❌ RocketChat iframe failed to load');
        setError('RocketChat 界面加载失败');
        setIframeLoaded(false);
    }, []);

    // 手动重试
    const handleRetry = useCallback(() => {
        console.log('🔄 Manual retry initiated');
        setIframeKey(Date.now());
        setIframeLoaded(false);
        setError(null);
        setLoggedOut(false);  // ⭐ 重置登出状态，重新登出
    }, []);

    // 没有用户
    if (!user) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">请先登录</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        前往登录
                    </button>
                </div>
            </div>
        );
    }

    // 没有 RocketChat token
    if (!user.rocketChatToken) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center max-w-md p-8">
                    <p className="text-gray-600 mb-6">RocketChat Token 缺失，请重新登录</p>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        重新登录
                    </button>
                </div>
            </div>
        );
    }

    // 等待登出完成
    if (!loggedOut) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">正在初始化...</p>
                </div>
            </div>
        );
    }

    // 渲染错误状态
    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center max-w-md p-8">
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        重新加载
                    </button>
                </div>
            </div>
        );
    }

    // 渲染 RocketChat iframe
    return (
        <div className="relative w-full h-full bg-white">
            {/* 顶部状态栏 */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-4 py-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                            iframeLoaded ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className="text-sm font-medium text-blue-900">
                            {iframeLoaded ? '✓ 已连接' : '⏳ 加载中...'}
                        </span>
                        {user && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                {user.email}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleRetry}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        🔄 重新加载
                    </button>
                </div>
            </div>

            {/* RocketChat iframe */}
            <div className="relative" style={{ height: 'calc(100% - 44px)' }}>
                {!iframeLoaded && (
                    <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">正在加载聊天界面...</p>
                        </div>
                    </div>
                )}
                
                <iframe
                    key={iframeKey}
                    src={rocketChatUrl}
                    className="w-full h-full border-0"
                    title="RocketChat"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    allow="microphone; camera; geolocation; notifications; fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
                />
            </div>
        </div>
    );
};

export default RocketChatIframe;