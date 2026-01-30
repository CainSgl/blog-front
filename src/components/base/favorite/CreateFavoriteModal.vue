<template>
    <a-modal 
        v-model:visible="visible" 
        :title="`创建${type}收藏夹`" 
        @ok="handleConfirm" 
        @cancel="handleCancel"
    >
        <a-form :model="form" layout="vertical">
            <a-form-item label="收藏夹名称" required>
                <a-input 
                    v-model="form.name" 
                    placeholder="请输入收藏夹名称" 
                    allow-clear 
                    :max-length="20" 
                />
            </a-form-item>
            <a-form-item label="收藏夹描述">
                <a-textarea 
                    v-model="form.description" 
                    placeholder="请输入收藏夹描述（可选）" 
                    allow-clear 
                    :auto-size="{ minRows: 3, maxRows: 5 }" 
                    :max-length="200" 
                />
            </a-form-item>
            <a-form-item label="公开设置">
                <a-switch 
                    v-model="form.publish" 
                    checked-text="公开" 
                    unchecked-text="私密" 
                />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script setup>
import {computed, ref, watch} from 'vue';
import {Message} from '@arco-design/web-vue';
import api from '@/api';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['update:modelValue', 'success']);

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const form = ref({
    name: '',
    description: '',
    publish: false
});

const resetForm = () => {
    form.value = {
        name: '',
        description: '',
        publish: false
    };
};

const handleConfirm = async () => {
    const name = form.value.name.trim();
    
    if (!name) {
        Message.warning('请输入收藏夹名称');
        return;
    }

    const loadingId = 'create-favorite';
    Message.loading({ id: loadingId, content: '创建中...' });

    try {
        const { data } = await api.post('/user/group', {
            type: props.type,
            name: name,
            description: form.value.description.trim(),
            publish: form.value.publish
        });
        console.log(data)
        visible.value = false;
        Message.success({ id: loadingId, content: '创建成功' });
        emit('success', data);
    } catch (error) {
        console.error('创建收藏夹失败:', error);
        Message.error({ id: loadingId, content: '创建失败，请稍后重试' });
    }
};

const handleCancel = () => {
    visible.value = false;
    resetForm();
};

watch(visible, (newVal) => {
    if (newVal) {
        resetForm();
    }
});
</script>
