<template>
  <div v-if="stages && stages.length > 0" class="retrieval-process">
    <div class="process-header" @click="toggleMainCollapse">
      <div class="process-title">
        <icon-search />
        <span>决策过程</span>
        <span v-if="!isMainCollapsed" class="stage-count">({{ stages.length }} 个阶段)</span>
      </div>
      <icon-down :class="{ rotated: !isMainCollapsed }" />
    </div>
    
    <div v-show="!isMainCollapsed" class="process-content">
      <!-- 各个阶段 -->
      <div 
        v-for="(stage, index) in stages" 
        :key="index"
        class="stage-wrapper"
      >
        <div 
          class="stage-item"
          :class="{ 
            'stage-active': index === stages.length - 1 && !isComplete,
            'stage-expandable': stage.steps.length > 0 || stage.documents.length > 0
          }"
          @click="stage.steps.length > 0 || stage.documents.length > 0 ? toggleStage(index) : null"
        >
          <div class="stage-icon">
            <icon-check-circle v-if="stage.completed" class="icon-success" />
            <icon-loading v-else class="icon-loading" />
          </div>
          <div class="stage-content">
            <div class="stage-header-row">
              <div class="stage-message">{{ stage.title }}</div>
              <icon-down 
                v-if="stage.steps.length > 0 || stage.documents.length > 0"
                class="stage-toggle-icon"
                :class="{ rotated: !isStageCollapsed(index) }"
              />
            </div>
            <div v-if="stage.summary" class="stage-summary">{{ stage.summary }}</div>
          </div>
        </div>

        <!-- 阶段详细内容（子步骤和文档） -->
        <div v-show="!isStageCollapsed(index)" class="stage-details">
          <!-- 子步骤 -->
          <div v-if="stage.steps.length > 0" class="stage-steps">
            <div 
              v-for="(step, stepIndex) in stage.steps"
              :key="stepIndex"
              class="step-item"
              :class="{ 'step-expandable': step.chunks && step.chunks.length > 0 }"
            >
              <div class="step-icon">
                <icon-check v-if="step.completed" class="icon-step-success" />
                <icon-loading v-else class="icon-step-loading" />
              </div>
              <div class="step-content">
                <div 
                  class="step-header"
                  :class="{ 'step-clickable': step.chunks && step.chunks.length > 0 }"
                  @click="step.chunks && step.chunks.length > 0 ? toggleStep(stepIndex, index) : null"
                >
                  <div class="step-message">{{ step.message }}</div>
                  <icon-down 
                    v-if="step.chunks && step.chunks.length > 0"
                    class="step-toggle-icon"
                    :class="{ rotated: !isStepCollapsed(stepIndex, index) }"
                  />
                </div>
                <div v-if="step.detail" class="step-detail">{{ step.detail }}</div>
                
                <!-- 分块评估详情 -->
                <div v-if="step.chunks && step.chunks.length > 0 && !isStepCollapsed(stepIndex, index)" class="chunks-container">
                  <div 
                    v-for="chunk in step.chunks"
                    :key="chunk.index"
                    class="chunk-item"
                    :class="{ 'chunk-relevant': chunk.score >= 5 }"
                  >
                    <div class="chunk-header">
                      <span class="chunk-index">分块 {{ chunk.index }}/{{ chunk.total }}</span>
                      <span class="chunk-score" :class="getScoreClass(chunk.score)">
                        相关度: {{ chunk.score }}/10
                      </span>
                      <span v-if="chunk.canAnswer" class="chunk-can-answer">可回答</span>
                    </div>
                    <div class="chunk-preview">{{ chunk.preview }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 该阶段的文档列表 -->
          <div v-if="stage.documents.length > 0" class="stage-documents">
            <div class="documents-header">
              <icon-file />
              <span>相关文档 ({{ stage.documents.length }})</span>
            </div>
            <div class="documents-list">
              <div 
                v-for="(doc, docIndex) in stage.documents"
                :key="doc.documentId"
                class="document-card"
              >
                <div class="document-header-row">
                  <div class="document-index">{{ docIndex + 1 }}</div>
                  <div class="document-info">
                    <div class="document-title-text">{{ doc.title }}</div>
                    <div class="document-meta">
                      <span v-if="doc.score" class="document-score">
                        相关度: {{ (doc.score * 100).toFixed(1) }}%
                      </span>
                      <span v-if="doc.message" class="document-message">
                        {{ doc.message }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div v-if="doc.summary" class="document-summary">
                  {{ doc.summary }}
                </div>
                
                <div v-if="doc.tags" class="document-tags">
                  <span 
                    v-for="tag in parseTags(doc.tags)" 
                    :key="tag.name"
                    class="tag-item"
                  >
                    {{ tag.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 文档分组列表 -->
          <div v-if="stage.documentGroups && stage.documentGroups.length > 0" class="document-groups">
            <div 
              v-for="(group, groupIndex) in stage.documentGroups"
              :key="groupIndex"
              class="document-group"
            >
              <div class="group-header" @click="toggleDocumentGroup(groupIndex, index)">
                <div class="group-title">
                  <icon-file />
                  <span>{{ group.name }} ({{ group.documents.length }})</span>
                </div>
                <icon-down 
                  class="group-toggle-icon"
                  :class="{ rotated: !isGroupCollapsed(groupIndex, index) }"
                />
              </div>
              
              <div v-show="!isGroupCollapsed(groupIndex, index)" class="documents-list">
                <div 
                  v-for="(doc, docIndex) in group.documents"
                  :key="doc.documentId"
                  class="document-card"
                >
                  <div class="document-header-row">
                    <div class="document-index">{{ docIndex + 1 }}</div>
                    <div class="document-info">
                      <div class="document-title-text">{{ doc.title }}</div>
                      <div class="document-meta">
                        <span v-if="doc.score" class="document-score">
                          相关度: {{ (doc.score * 100).toFixed(1) }}%
                        </span>
                        <span v-if="doc.message" class="document-message">
                          {{ doc.message }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="doc.summary" class="document-summary">
                    {{ doc.summary }}
                  </div>
                  
                  <div v-if="doc.tags" class="document-tags">
                    <span 
                      v-for="tag in parseTags(doc.tags)" 
                      :key="tag.name"
                      class="tag-item"
                    >
                      {{ tag.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { IconSearch, IconDown, IconCheckCircle, IconLoading, IconCheck, IconFile } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  stages: {
    type: Array,
    default: () => []
  },
  isComplete: {
    type: Boolean,
    default: false
  }
});

const isMainCollapsed = ref(false);

// 使用 Map 来存储每个阶段的展开/收起状态
const stageCollapseStates = reactive(new Map());
const stepCollapseStates = reactive(new Map());
const groupCollapseStates = reactive(new Map());

const toggleMainCollapse = () => {
  isMainCollapsed.value = !isMainCollapsed.value;
};

const toggleStage = (index) => {
  const currentState = stageCollapseStates.get(index) ?? false;
  stageCollapseStates.set(index, !currentState);
};

const toggleStep = (stepIndex, stageIndex) => {
  const key = `${stageIndex}-${stepIndex}`;
  const currentState = stepCollapseStates.get(key) ?? false;
  stepCollapseStates.set(key, !currentState);
};

const toggleDocumentGroup = (groupIndex, stageIndex) => {
  const key = `${stageIndex}-${groupIndex}`;
  const currentState = groupCollapseStates.get(key) ?? false;
  groupCollapseStates.set(key, !currentState);
};

const isStageCollapsed = (index) => {
  return stageCollapseStates.get(index) ?? false;
};

const isStepCollapsed = (stepIndex, stageIndex) => {
  const key = `${stageIndex}-${stepIndex}`;
  return stepCollapseStates.get(key) ?? false;
};

const isGroupCollapsed = (groupIndex, stageIndex) => {
  const key = `${stageIndex}-${groupIndex}`;
  return groupCollapseStates.get(key) ?? false;
};

const getScoreClass = (score) => {
  if (score >= 7) return 'score-high';
  if (score >= 5) return 'score-medium';
  return 'score-low';
};

const parseTags = (tagsStr) => {
  if (!tagsStr) return [];
  return tagsStr.split(',').map(tag => {
    const [name, score] = tag.trim().split(':');
    return { name: name.trim(), score: parseFloat(score) };
  });
};
</script>

<style scoped lang="less">
.retrieval-process {
  background-color: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  transition: all 0.3s;

  .process-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid var(--color-border-2);
    transition: all 0.2s;

    &:hover {
      background-color: var(--color-fill-2);
    }

    .process-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--color-text-2);
      font-weight: 500;

      svg {
        font-size: 14px;
        color: rgb(var(--primary-6));
      }

      .stage-count {
        font-size: 12px;
        color: var(--color-text-3);
        font-weight: 400;
      }
    }

    .arco-icon-down {
      font-size: 12px;
      color: var(--color-text-3);
      transition: transform 0.3s;

      &.rotated {
        transform: rotate(-180deg);
      }
    }
  }

  .process-content {
    padding: 12px 16px;

    .stage-wrapper {
      position: relative;

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 9px;
        top: 32px;
        bottom: 0;
        width: 2px;
        background-color: var(--color-border-2);
      }

      .stage-item {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        position: relative;
        z-index: 1;

        &.stage-expandable {
          cursor: pointer;
          
          &:hover {
            .stage-message {
              color: rgb(var(--primary-6));
            }
          }
        }

        &.stage-active {
          .stage-message {
            color: rgb(var(--primary-6));
          }
        }

        .stage-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-fill-1);

          .icon-success {
            font-size: 20px;
            color: rgb(var(--success-6));
          }

          .icon-loading {
            font-size: 16px;
            color: rgb(var(--primary-6));
            animation: spin 1s linear infinite;
          }
        }

        .stage-content {
          flex: 1;
          padding-top: 1px;

          .stage-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;

            .stage-message {
              font-size: 14px;
              color: var(--color-text-1);
              line-height: 1.5;
              font-weight: 600;
              transition: color 0.2s;
            }

            .stage-toggle-icon {
              font-size: 12px;
              color: var(--color-text-3);
              transition: transform 0.3s;
              flex-shrink: 0;

              &.rotated {
                transform: rotate(-180deg);
              }
            }
          }

          .stage-summary {
            font-size: 12px;
            color: var(--color-text-3);
            line-height: 1.5;
            margin-top: 4px;
          }
        }
      }

      .stage-details {
        margin-left: 32px;
        margin-top: 8px;
        margin-bottom: 12px;

        .stage-steps {
          .step-item {
            display: flex;
            gap: 8px;
            padding: 6px 0;
            position: relative;

            &:not(:last-child)::after {
              content: '';
              position: absolute;
              left: 7px;
              top: 24px;
              bottom: -6px;
              width: 1px;
              background-color: var(--color-border-3);
            }

            .step-icon {
              flex-shrink: 0;
              width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              z-index: 1;
              background-color: var(--color-fill-1);

              .icon-step-success {
                font-size: 14px;
                color: rgb(var(--success-6));
              }

              .icon-step-loading {
                font-size: 12px;
                color: rgb(var(--primary-6));
                animation: spin 1s linear infinite;
              }
            }

            .step-content {
              flex: 1;

              .step-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;

                &.step-clickable {
                  cursor: pointer;
                  
                  &:hover .step-message {
                    color: rgb(var(--primary-6));
                  }
                }

                .step-toggle-icon {
                  font-size: 12px;
                  color: var(--color-text-3);
                  transition: transform 0.3s;
                  flex-shrink: 0;

                  &.rotated {
                    transform: rotate(-180deg);
                  }
                }
              }

              .step-message {
                font-size: 13px;
                color: var(--color-text-2);
                line-height: 1.5;
                transition: color 0.2s;
              }

              .step-detail {
                font-size: 12px;
                color: var(--color-text-3);
                line-height: 1.5;
                margin-top: 2px;
              }

              .chunks-container {
                margin-top: 8px;
                display: flex;
                flex-direction: column;
                gap: 6px;

                .chunk-item {
                  padding: 8px 10px;
                  background-color: var(--color-bg-2);
                  border: 1px solid var(--color-border-3);
                  border-radius: 6px;
                  transition: all 0.2s;

                  &.chunk-relevant {
                    border-color: rgb(var(--success-6));
                    background-color: rgba(var(--success-1), 0.3);
                  }

                  &:hover {
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                  }

                  .chunk-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                    flex-wrap: wrap;

                    .chunk-index {
                      font-size: 11px;
                      font-weight: 600;
                      color: var(--color-text-2);
                    }

                    .chunk-score {
                      font-size: 11px;
                      font-weight: 600;
                      padding: 2px 6px;
                      border-radius: 3px;

                      &.score-high {
                        background-color: rgba(var(--success-6), 0.1);
                        color: rgb(var(--success-6));
                      }

                      &.score-medium {
                        background-color: rgba(var(--warning-6), 0.1);
                        color: rgb(var(--warning-6));
                      }

                      &.score-low {
                        background-color: rgba(var(--danger-6), 0.1);
                        color: rgb(var(--danger-6));
                      }
                    }

                    .chunk-can-answer {
                      font-size: 11px;
                      font-weight: 600;
                      padding: 2px 6px;
                      border-radius: 3px;
                      background-color: rgba(var(--primary-6), 0.1);
                      color: rgb(var(--primary-6));
                    }
                  }

                  .chunk-preview {
                    font-size: 12px;
                    color: var(--color-text-3);
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                  }
                }
              }
            }
          }
        }

        .stage-documents {
          margin-top: 12px;
          padding: 12px;
          background-color: var(--color-bg-2);
          border: 1px solid var(--color-border-2);
          border-radius: 8px;

          .documents-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 12px;
            font-size: 13px;
            font-weight: 600;
            color: var(--color-text-2);

            svg {
              font-size: 14px;
              color: rgb(var(--warning-6));
            }
          }

          .documents-list {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .document-card {
              padding: 10px;
              background-color: var(--color-bg-1);
              border: 1px solid var(--color-border-2);
              border-radius: 6px;
              transition: all 0.2s;

              &:hover {
                border-color: rgb(var(--primary-6));
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
              }

              .document-header-row {
                display: flex;
                gap: 10px;
                margin-bottom: 6px;

                .document-index {
                  flex-shrink: 0;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background-color: rgb(var(--primary-6));
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 11px;
                  font-weight: 600;
                }

                .document-info {
                  flex: 1;
                  min-width: 0;

                  .document-title-text {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--color-text-1);
                    margin-bottom: 3px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }

                  .document-meta {
                    display: flex;
                    gap: 8px;
                    font-size: 11px;
                    color: var(--color-text-3);

                    .document-score {
                      color: rgb(var(--success-6));
                    }
                  }
                }
              }

              .document-summary {
                font-size: 12px;
                color: var(--color-text-2);
                line-height: 1.6;
                margin-bottom: 6px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }

              .document-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;

                .tag-item {
                  padding: 2px 6px;
                  background-color: var(--color-fill-2);
                  border: 1px solid var(--color-border-2);
                  border-radius: 3px;
                  font-size: 11px;
                  color: var(--color-text-2);
                }
              }
            }
          }
        }

        .document-groups {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;

          .document-group {
            background-color: var(--color-bg-2);
            border: 1px solid var(--color-border-2);
            border-radius: 8px;
            overflow: hidden;

            .group-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 12px;
              cursor: pointer;
              user-select: none;
              transition: all 0.2s;

              &:hover {
                background-color: var(--color-fill-2);
              }

              .group-title {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                font-weight: 600;
                color: var(--color-text-2);

                svg {
                  font-size: 14px;
                  color: rgb(var(--warning-6));
                }
              }

              .group-toggle-icon {
                font-size: 12px;
                color: var(--color-text-3);
                transition: transform 0.3s;
                flex-shrink: 0;

                &.rotated {
                  transform: rotate(-180deg);
                }
              }
            }

            .documents-list {
              padding: 8px 12px 12px;
              display: flex;
              flex-direction: column;
              gap: 8px;

              .document-card {
                padding: 10px;
                background-color: var(--color-bg-1);
                border: 1px solid var(--color-border-2);
                border-radius: 6px;
                transition: all 0.2s;

                &:hover {
                  border-color: rgb(var(--primary-6));
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
                }

                .document-header-row {
                  display: flex;
                  gap: 10px;
                  margin-bottom: 6px;

                  .document-index {
                    flex-shrink: 0;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background-color: rgb(var(--primary-6));
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 600;
                  }

                  .document-info {
                    flex: 1;
                    min-width: 0;

                    .document-title-text {
                      font-size: 13px;
                      font-weight: 600;
                      color: var(--color-text-1);
                      margin-bottom: 3px;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    }

                    .document-meta {
                      display: flex;
                      gap: 8px;
                      font-size: 11px;
                      color: var(--color-text-3);

                      .document-score {
                        color: rgb(var(--success-6));
                      }
                    }
                  }
                }

                .document-summary {
                  font-size: 12px;
                  color: var(--color-text-2);
                  line-height: 1.6;
                  margin-bottom: 6px;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                }

                .document-tags {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 4px;

                  .tag-item {
                    padding: 2px 6px;
                    background-color: var(--color-fill-2);
                    border: 1px solid var(--color-border-2);
                    border-radius: 3px;
                    font-size: 11px;
                    color: var(--color-text-2);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
