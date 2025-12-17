// DeepSeek API配置
const API_CONFIG = {
    base_url: 'https://api.deepseek.com',
    model: 'deepseek-chat'
};

// DOM元素
const elements = {
    sourceLang: document.getElementById('sourceLang'),
    targetLang: document.getElementById('targetLang'),
    swapBtn: document.getElementById('swapBtn'),
    inputText: document.getElementById('inputText'),
    outputText: document.getElementById('outputText'),
    translateBtn: document.getElementById('translateBtn'),
    clearBtn: document.getElementById('clearBtn'),
    copyBtn: document.getElementById('copyBtn'),
    voiceBtn: document.getElementById('voiceBtn')
};

// 语音识别相关变量
let recognition = null;
let isRecording = false;

// 语言映射 - 一带一路主要20国语言
const LANGUAGE_MAP = {
    zh: '中文',
    en: '英语',
    ru: '俄语',
    ar: '阿拉伯语',
    fr: '法语',
    es: '西班牙语',
    pt: '葡萄牙语',
    de: '德语',
    ja: '日语',
    ko: '韩语',
    tr: '土耳其语',
    it: '意大利语',
    id: '印尼语',
    hi: '印地语',
    bn: '孟加拉语',
    ur: '乌尔都语',
    th: '泰语',
    vi: '越南语',
    ms: '马来语',
    fa: '波斯语'
};

// 初始化
function init() {
    // 设置默认语言（中文→日语）
    elements.sourceLang.value = 'zh';
    elements.targetLang.value = 'ja';
    
    // 绑定事件监听
    bindEvents();
    
    // 检查本地存储的API密钥
    checkApiKey();
}

// 绑定事件监听
function bindEvents() {
    elements.swapBtn.addEventListener('click', swapLanguages);
    elements.translateBtn.addEventListener('click', translate);
    elements.clearBtn.addEventListener('click', clearInput);
    elements.copyBtn.addEventListener('click', copyOutput);
    elements.inputText.addEventListener('keydown', handleKeyDown);
    elements.voiceBtn.addEventListener('click', toggleVoiceRecognition);
}

// 初始化语音识别
function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        // 配置语音识别
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        
        // 语音识别结果事件
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            elements.inputText.value = transcript;
        };
        
        // 语音识别结束事件
        recognition.onend = () => {
            isRecording = false;
            elements.voiceBtn.classList.remove('recording');
            elements.voiceBtn.textContent = '🎤';
        };
        
        // 语音识别错误事件
        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            isRecording = false;
            elements.voiceBtn.classList.remove('recording');
            elements.voiceBtn.textContent = '🎤';
        };
    } else {
        alert('您的浏览器不支持语音识别功能，请使用Chrome或Edge浏览器。');
    }
}

// 切换语音识别状态
function toggleVoiceRecognition() {
    if (!recognition) {
        initVoiceRecognition();
    }
    
    if (isRecording) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

// 开始语音识别
function startVoiceRecognition() {
    // 设置语音识别语言
    const langMap = {
        zh: 'zh-CN',
        en: 'en-US',
        ru: 'ru-RU',
        ar: 'ar-SA',
        fr: 'fr-FR',
        es: 'es-ES',
        pt: 'pt-BR',
        de: 'de-DE',
        ja: 'ja-JP',
        ko: 'ko-KR',
        tr: 'tr-TR',
        it: 'it-IT',
        id: 'id-ID',
        hi: 'hi-IN',
        bn: 'bn-IN',
        ur: 'ur-PK',
        th: 'th-TH',
        vi: 'vi-VN',
        ms: 'ms-MY',
        fa: 'fa-IR'
    };
    
    recognition.lang = langMap[elements.sourceLang.value] || 'zh-CN';
    recognition.start();
    isRecording = true;
    elements.voiceBtn.classList.add('recording');
    elements.voiceBtn.textContent = '⏹️';
}

// 停止语音识别
function stopVoiceRecognition() {
    recognition.stop();
    isRecording = false;
    elements.voiceBtn.classList.remove('recording');
    elements.voiceBtn.textContent = '🎤';
}

// 检查API密钥
function checkApiKey() {
    const apiKey = localStorage.getItem('deepseekApiKey');
    if (!apiKey) {
        const userApiKey = prompt('请输入您的DeepSeek API密钥：');
        if (userApiKey) {
            localStorage.setItem('deepseekApiKey', userApiKey);
        } else {
            alert('API密钥是必需的，请稍后再试。');
        }
    }
}

// 交换语言
function swapLanguages() {
    const temp = elements.sourceLang.value;
    elements.sourceLang.value = elements.targetLang.value;
    elements.targetLang.value = temp;
    
    // 如果有输入和输出，也交换它们
    if (elements.outputText.textContent) {
        const tempText = elements.inputText.value;
        elements.inputText.value = elements.outputText.textContent;
        elements.outputText.textContent = '';
    }
}

// 翻译函数
async function translate() {
    const input = elements.inputText.value.trim();
    if (!input) {
        alert('请输入要翻译的文本。');
        return;
    }
    
    const apiKey = localStorage.getItem('deepseekApiKey');
    if (!apiKey) {
        checkApiKey();
        return;
    }
    
    const sourceLang = elements.sourceLang.value;
    const targetLang = elements.targetLang.value;
    
    if (sourceLang === targetLang) {
        elements.outputText.textContent = input;
        return;
    }
    
    // 显示加载状态
    showLoading(true);
    
    try {
        const response = await fetch(`${API_CONFIG.base_url}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: `你是一个专业的翻译助手，请将${LANGUAGE_MAP[sourceLang]}翻译成${LANGUAGE_MAP[targetLang]}，保持原意准确，语言流畅自然。不要添加任何解释或额外内容。`
                    },
                    {
                        role: 'user',
                        content: input
                    }
                ],
                stream: false,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            elements.outputText.textContent = data.choices[0].message.content;
        } else {
            throw new Error('API返回格式不正确');
        }
    } catch (error) {
        console.error('翻译错误:', error);
        alert(`翻译失败: ${error.message}\n请检查API密钥是否正确，或稍后再试。`);
    } finally {
        showLoading(false);
    }
}

// 显示/隐藏加载状态
function showLoading(show) {
    if (show) {
        elements.translateBtn.disabled = true;
        elements.translateBtn.innerHTML = '<span class="loading"></span> 翻译中...';
    } else {
        elements.translateBtn.disabled = false;
        elements.translateBtn.textContent = '翻译';
    }
}

// 清空输入
function clearInput() {
    elements.inputText.value = '';
    elements.outputText.textContent = '';
    elements.inputText.focus();
}

// 复制输出结果
function copyOutput() {
    const output = elements.outputText.textContent;
    if (!output) {
        alert('没有可复制的内容。');
        return;
    }
    
    navigator.clipboard.writeText(output)
        .then(() => {
            alert('翻译结果已复制到剪贴板！');
        })
        .catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制。');
        });
}

// 键盘快捷键处理
function handleKeyDown(e) {
    // Ctrl/Cmd + Enter 触发翻译
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        translate();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);