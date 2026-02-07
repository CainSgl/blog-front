<template>
    <ModalWrapper v-model:visible="visible" title="个人设置" width="800px" :mask-closable="false" @cancel="handleCancel"
        @before-ok="handleSave" ok-text="保存" cancel-text="取消">
        <div class="settings-container">
            <a-tabs default-active-key="appearance" :lazy-load="true">

                <!-- 主题设置 -->
                <a-tab-pane key="appearance" title="外观">
                    <a-form :model="formData" layout="vertical">
                        <a-form-item label="主题模式" field="theme">
                            <a-radio-group v-model="formData.theme">
                                <a-radio value="">浅色</a-radio>
                                <a-radio value="dark">深色</a-radio>
                                <a-radio value="auto">跟随系统</a-radio>
                            </a-radio-group>
                        </a-form-item>

                        <a-form-item label="语言" field="language">
                            <a-select v-model="formData.language" style="width: 200px;" disabled>
                                <a-option value="zh-CN">简体中文</a-option>
                                <a-option value="zh-TW">繁體中文</a-option>
                                <a-option value="en-US">English</a-option>
                            </a-select>
                        </a-form-item>
                    </a-form>
                </a-tab-pane>
                <!-- 音乐播放器设置 -->
                <a-tab-pane key="musicPlayer" title="音乐播放器">
                    <a-form :model="formData" layout="vertical">
                        <a-form-item label="默认音量" field="musicPlayer.volume">
                            <div class="volume-control">
                                <a-slider v-model="formData.musicPlayer.volume" :min="0" :max="100" :show-tooltip="true"
                                    style="flex: 1; margin-right: 16px;" />
                                <span class="volume-value">{{ formData.musicPlayer.volume }}%</span>
                            </div>
                        </a-form-item>

                        <a-form-item label="默认播放速度" field="musicPlayer.playbackRate">
                            <a-select v-model="formData.musicPlayer.playbackRate" style="width: 200px;">
                                <a-option :value="0.5">0.5x</a-option>
                                <a-option :value="0.75">0.75x</a-option>
                                <a-option :value="1.0">1.0x (正常)</a-option>
                                <a-option :value="1.25">1.25x</a-option>
                                <a-option :value="1.5">1.5x</a-option>
                                <a-option :value="2.0">2.0x</a-option>
                            </a-select>
                        </a-form-item>

                        <a-form-item label="播放确认" field="musicPlayer.dontAskAgain">
                            <div class="setting-row">
                                <a-switch v-model="formData.musicPlayer.dontAskAgain">
                                    <template #checked>不再提示</template>
                                    <template #unchecked>每次询问</template>
                                </a-switch>
                                <div class="form-item-tip">
                                    开启后，文章中的音乐将自动播放，不再弹出确认对话框
                                </div>
                            </div>
                        </a-form-item>
                    </a-form>
                </a-tab-pane>

                <!-- 通知设置 -->
                <a-tab-pane key="notifications" title="通知">
                    <a-form :model="formData" layout="vertical">
                        <a-form-item label="评论通知" field="notifications.comment">
                            <a-switch v-model="formData.notifications.comment" />
                        </a-form-item>

                        <a-form-item label="点赞通知" field="notifications.like">
                            <a-switch v-model="formData.notifications.like" />
                        </a-form-item>

                        <a-form-item label="关注通知" field="notifications.follow">
                            <a-switch v-model="formData.notifications.follow" />
                        </a-form-item>

                        <a-form-item label="系统通知" field="notifications.system">
                            <a-switch v-model="formData.notifications.system" />
                        </a-form-item>
                    </a-form>
                </a-tab-pane>

                <!-- 隐私设置 -->
                <a-tab-pane key="privacy" title="隐私">
                    <a-form :model="formData" layout="vertical">
                        <a-form-item label="显示邮箱" field="privacy.showEmail">
                            <a-switch v-model="formData.privacy.showEmail" />
                        </a-form-item>

                        <a-form-item label="显示手机号" field="privacy.showPhone">
                            <a-switch v-model="formData.privacy.showPhone" />
                        </a-form-item>

                        <a-form-item label="允许被搜索" field="privacy.allowSearch">
                            <a-switch v-model="formData.privacy.allowSearch" />
                        </a-form-item>

                        <a-form-item label="显示在线状态" field="privacy.showOnlineStatus">
                            <a-switch v-model="formData.privacy.showOnlineStatus" />
                        </a-form-item>
                    </a-form>
                </a-tab-pane>

                <!-- 我知道的 -->
                <a-tab-pane key="iknow" title="我知道的">
                    <a-form :model="formData" layout="vertical">
                        <a-form-item label="编辑器提示" field="editor.hideEditTips">
                            <div class="setting-row">
                                <a-switch v-model="formData.editor.hideEditTips">
                                    <template #checked>隐藏</template>
                                    <template #unchecked>显示</template>
                                </a-switch>
                                <div class="form-item-tip">
                                    关闭后，在编辑页面将显示编辑提示（关于换行和预览的提醒）
                                </div>
                            </div>
                        </a-form-item>
                    </a-form>
                </a-tab-pane>

                <!-- 高级设置 -->
                <a-tab-pane key="advanced" title="高级">
                    <a-form layout="vertical">
                        <a-form-item label="PWA 应用">
                            <PWAInstallPrompt />
                        </a-form-item>

                        <a-divider />

                        <a-form-item label="原始设置数据">
                            <a-textarea v-model="rawSettingsJson" :auto-size="{ minRows: 10, maxRows: 20 }"
                                placeholder="JSON 格式的设置数据" />
                            <div class="form-item-tip">
                                可以直接编辑 JSON 数据，保存时会验证格式
                            </div>
                        </a-form-item>

                        <a-space>
                            <a-button @click="formatJson">格式化</a-button>
                            <a-button @click="resetToDefault" status="warning">恢复默认</a-button>
                            <a-button @click="clearAllSettings" status="danger">清除所有设置</a-button>
                        </a-space>
                    </a-form>
                </a-tab-pane>

                <!-- 云同步 -->
                <a-tab-pane key="sync" title="云同步">
                    <a-alert type="info" style="margin-bottom: 24px;">
                        <template #icon>
                            <icon-info-circle />
                        </template>
                        设置默认保存在本地浏览器中。你可以手动同步到云端，以便在其他设备上使用相同的设置。
                    </a-alert>

                    <a-form layout="vertical">
                        <a-form-item label="云端状态">
                            <a-space direction="vertical" fill>
                                <div class="sync-status">
                                    <div class="status-item">
                                        <span class="status-label">本地设置:</span>
                                        <span class="status-value">{{ localSettingsCount }} 项</span>
                                    </div>
                                    <div class="status-item">
                                        <span class="status-label">云端设置:</span>
                                        <span class="status-value">{{ cloudSettingsCount }} 项</span>
                                    </div>
                                    <div class="status-item">
                                        <span class="status-label">最后同步:</span>
                                        <span class="status-value">{{ lastSyncTime }}</span>
                                    </div>
                                </div>

                                <a-divider style="margin: 16px 0;" />

                                <a-space size="large">
                                    <a-button type="primary" @click="syncToCloud" :loading="syncingToCloud">
                                        <template #icon>
                                            <icon-upload />
                                        </template>
                                        同步到云端
                                    </a-button>

                                    <a-button @click="syncFromCloud" :loading="syncingFromCloud">
                                        <template #icon>
                                            <icon-download />
                                        </template>
                                        从云端同步
                                    </a-button>
                                </a-space>

                                <a-alert type="warning" style="margin-top: 16px;">
                                    <ul style="margin: 0; padding-left: 20px;">
                                        <li><strong>同步到云端</strong>: 将当前本地设置上传到服务器，会覆盖云端设置</li>
                                        <li><strong>从云端同步</strong>: 从服务器下载设置到本地，会覆盖本地设置</li>
                                    </ul>
                                </a-alert>
                            </a-space>
                        </a-form-item>

                        <a-form-item label="云端设置预览">
                            <a-textarea v-model="cloudSettingsPreview" :auto-size="{ minRows: 8, maxRows: 15 }" readonly
                                placeholder="点击从云端同步查看云端设置" />
                        </a-form-item>
                    </a-form>
                </a-tab-pane>
            </a-tabs>
        </div>
    </ModalWrapper>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import { IconInfoCircle, IconUpload, IconDownload } from '@arco-design/web-vue/es/icon';
import { useUserSettingStore } from '@/store/userSetting';
import { useThemeStore } from '@/store/theme';
import ModalWrapper from '@/components/base/ModalWrapper.vue';
import PWAInstallPrompt from '@/components/base/PWAInstallPrompt.vue';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const themeStore = useThemeStore();

const userSettingStore = useUserSettingStore();

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

// 默认设置
const defaultSettings = {
    theme: '', // 空字符串表示浅色（默认）
    language: 'zh-CN',
    musicPlayer: {
        volume: 100,
        playbackRate: 1.0,
        dontAskAgain: false
    },
    notifications: {
        comment: true,
        like: true,
        follow: true,
        system: true
    },
    privacy: {
        showEmail: false,
        showPhone: false,
        allowSearch: true,
        showOnlineStatus: false
    },
    editor: {
        hideEditTips: false
    }
};

// 表单数据
const formData = ref(JSON.parse(JSON.stringify(defaultSettings)));

// 原始 JSON 数据
const rawSettingsJson = ref('');

// 云同步相关
const syncingToCloud = ref(false);
const syncingFromCloud = ref(false);
const cloudSettingsPreview = ref('');
const lastSyncTime = ref('从未同步');

// 计算本地和云端设置数量
const localSettingsCount = computed(() => {
    return Object.keys(formData.value).length;
});

const cloudSettingsCount = computed(() => {
    try {
        if (!cloudSettingsPreview.value) return 0;
        const parsed = JSON.parse(cloudSettingsPreview.value);
        return Object.keys(parsed).length;
    } catch {
        return 0;
    }
});

// 监听弹窗打开，加载设置
watch(visible, (newVal) => {
    if (newVal) {
        loadSettings();
        loadCloudPreview();
    }
});

// 加载设置
const loadSettings = () => {
    const settings = userSettingStore.settings;
    formData.value = {
        ...JSON.parse(JSON.stringify(defaultSettings)),
        ...settings
    };
    rawSettingsJson.value = JSON.stringify(formData.value, null, 2);

    // 更新最后同步时间
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
        lastSyncTime.value = new Date(parseInt(lastSync)).toLocaleString('zh-CN');
    }
};

// 加载云端设置预览
const loadCloudPreview = async () => {
    try {
        const cloudSettings = await userSettingStore.fetchFromServer();
        cloudSettingsPreview.value = JSON.stringify(cloudSettings, null, 2);
    } catch (error) {
        cloudSettingsPreview.value = '无法加载云端设置';
        console.error('加载云端设置失败:', error);
    }
};

// 格式化 JSON
const formatJson = () => {
    try {
        const parsed = JSON.parse(rawSettingsJson.value);
        rawSettingsJson.value = JSON.stringify(parsed, null, 2);
        formData.value = { ...defaultSettings, ...parsed };
        Message.success('格式化成功');
    } catch (error) {
        Message.error('JSON 格式错误: ' + error.message);
    }
};

// 恢复默认设置
const resetToDefault = () => {
    formData.value = JSON.parse(JSON.stringify(defaultSettings));
    rawSettingsJson.value = JSON.stringify(formData.value, null, 2);
    Message.info('已恢复默认设置，点击保存生效');
};

// 清除所有设置
const clearAllSettings = async () => {
    try {
        await userSettingStore.clearSettings(true);
        formData.value = JSON.parse(JSON.stringify(defaultSettings));
        rawSettingsJson.value = JSON.stringify(formData.value, null, 2);
        Message.success('已清除所有设置');
    } catch (error) {
        Message.error('清除设置失败: ' + error.message);
    }
};

// 同步到云端
const syncToCloud = async () => {
    Modal.confirm({
        title: '确认同步到云端',
        content: '这将把当前本地设置上传到云端，会覆盖云端的现有设置。是否继续？',
        okText: '确认同步',
        cancelText: '取消',
        onOk: async () => {
            syncingToCloud.value = true;
            try {
                // 解析当前设置
                let settingsToSync = formData.value;
                try {
                    const parsed = JSON.parse(rawSettingsJson.value);
                    settingsToSync = parsed;
                } catch (error) {
                    console.warn('使用表单数据同步:', error);
                }

                // 先保存到本地
                await userSettingStore.updateSettings(settingsToSync, false, false);

                // 再同步到云端
                await userSettingStore.syncToServer();

                // 更新同步时间
                const now = Date.now();
                localStorage.setItem('lastSyncTime', now.toString());
                lastSyncTime.value = new Date(now).toLocaleString('zh-CN');

                // 刷新云端预览
                await loadCloudPreview();

                Message.success('已成功同步到云端');
            } catch (error) {
                Message.error('同步到云端失败: ' + error.message);
            } finally {
                syncingToCloud.value = false;
            }
        }
    });
};

// 从云端同步
const syncFromCloud = async () => {
    Modal.confirm({
        title: '确认从云端同步',
        content: '这将从云端下载设置并覆盖当前本地设置。是否继续？',
        okText: '确认同步',
        cancelText: '取消',
        onOk: async () => {
            syncingFromCloud.value = true;
            try {
                // 从服务器拉取设置
                const cloudSettings = await userSettingStore.fetchFromServer();

                // 更新表单数据
                formData.value = {
                    ...JSON.parse(JSON.stringify(defaultSettings)),
                    ...cloudSettings
                };
                rawSettingsJson.value = JSON.stringify(formData.value, null, 2);

                // 应用主题设置
                if (cloudSettings.theme !== undefined) {
                    themeStore.setTheme(cloudSettings.theme);
                }

                // 更新同步时间
                const now = Date.now();
                localStorage.setItem('lastSyncTime', now.toString());
                lastSyncTime.value = new Date(now).toLocaleString('zh-CN');

                // 刷新云端预览
                cloudSettingsPreview.value = JSON.stringify(cloudSettings, null, 2);

                Message.success('已成功从云端同步');
            } catch (error) {
                Message.error('从云端同步失败: ' + error.message);
            } finally {
                syncingFromCloud.value = false;
            }
        }
    });
};

// 保存设置（仅保存到本地）
const handleSave = async () => {
    try {
        // 尝试解析高级设置中的 JSON
        let settingsToSave = formData.value;

        try {
            const parsed = JSON.parse(rawSettingsJson.value);
            settingsToSave = parsed;
        } catch (error) {
            // 如果 JSON 解析失败，使用表单数据
            console.warn('使用表单数据保存，JSON 解析失败:', error);
        }

        // 只保存到本地，不同步到云端
        await userSettingStore.updateSettings(settingsToSave, false, false);
        
        // 应用主题设置
        if (settingsToSave.theme !== undefined) {
            themeStore.setTheme(settingsToSave.theme);
        }
        
        Message.success('设置已保存到本地（如需云端保存，请使用"云同步"功能）');
        emit('saved');
        return true;
    } catch (error) {
        Message.error('保存失败: ' + error.message);
        return false;
    }
};

// 取消
const handleCancel = () => {
    visible.value = false;
};

// 监听表单数据变化，同步到 JSON
watch(formData, (newVal) => {
    rawSettingsJson.value = JSON.stringify(newVal, null, 2);
}, { deep: true });
</script>

<style lang="less" scoped>
.settings-container {
    :deep(.arco-tabs-content) {
        padding-top: 16px;
    }

    .volume-control {
        margin-left: 10px;
        display: flex;
        align-items: center;
        width: 100%;

        .volume-value {
            font-size: 14px;
            color: var(--color-text-2);
            font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
            min-width: 50px;
            text-align: right;
        }
    }

    .form-item-tip {
        margin-top: 8px;
        font-size: 12px;
        color: var(--color-text-3);
        line-height: 1.5;
    }

    .setting-row {
        display: flex;
        align-items: center;
        gap: 16px;

        .form-item-tip {
            margin-top: 0;
            flex: 1;
        }
    }

    :deep(.arco-form-item) {
        margin-bottom: 24px;
    }

    :deep(.arco-textarea) {
        font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        font-size: 12px;
    }

    .sync-status {
        padding: 16px;
        background-color: var(--color-fill-2);
        border-radius: 8px;
        border: 1px solid var(--color-border-2);

        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;

            &:not(:last-child) {
                border-bottom: 1px dashed var(--color-border-2);
            }

            .status-label {
                font-size: 14px;
                color: var(--color-text-2);
            }

            .status-value {
                font-size: 14px;
                font-weight: 600;
                color: var(--color-text-1);
                font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
            }
        }
    }

    :deep(.arco-alert) {
        ul {
            font-size: 13px;
            line-height: 1.8;
        }
    }

}
</style>
