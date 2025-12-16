<template>
  <div class="components-view">
    <h1>Arco Design Vue 完整组件展示</h1>
    <p>以下是 Arco Design Vue 组件库的完整组件展示</p>

    <!-- 通用组件 -->
    <a-divider orientation="left">通用组件</a-divider>

    <!-- Button 组件 -->
    <div class="section">
      <h2>Button 按钮</h2>
      <div class="component-row">
        <div class="component-group">
          <h3>按钮类型</h3>
          <div class="button-demo">
            <a-button type="primary">主要按钮</a-button>
            <a-button type="secondary">次要按钮</a-button>
            <a-button type="dashed">虚线按钮</a-button>
            <a-button type="text">文字按钮</a-button>
            <a-button type="outline">outline</a-button>
            <a-button type="primary" long>长按钮</a-button>
          </div>
        </div>
        <div class="component-group">
          <h3>按钮尺寸</h3>
          <div class="button-demo">
            <a-button type="primary" size="large">大号按钮</a-button>
            <a-button type="primary" size="medium">中号按钮</a-button>
            <a-button type="primary" size="small">小号按钮</a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Icon 组件 -->
    <div class="section">
      <h2>Icon 图标</h2>
      <div class="icon-demo">
        <a-icon type="icon-account" />
        <a-icon type="icon-calendar" />
        <a-icon type="icon-check-circle" />
        <a-icon type="icon-close-circle" />
        <a-icon type="icon-edit" />
        <a-icon type="icon-folder" />
        <a-icon type="icon-heart" />
        <a-icon type="icon-home" />
        <a-icon type="icon-lock" />
        <a-icon type="icon-mail" />
        <a-icon type="icon-phone" />
        <a-icon type="icon-search" />
        <a-icon type="icon-setting" />
        <a-icon type="icon-star" />
        <a-icon type="icon-user" />
      </div>
    </div>

    <!-- Link 组件 -->
    <div class="section">
      <h2>Link 链接</h2>
      <div class="link-demo">
        <a-link>默认链接</a-link>
        <a-link type="primary">主要链接</a-link>
        <a-link type="success">成功链接</a-link>
        <a-link type="warning">警告链接</a-link>
        <a-link type="danger">危险链接</a-link>
        <a-link disabled>禁用链接</a-link>
      </div>
    </div>

    <!-- Typography 组件 -->
    <div class="section">
      <h2>Typography 排版</h2>
      <div class="typography-demo">
        <h1>标题一 H1</h1>
        <h2>标题二 H2</h2>
        <h3>标题三 H3</h3>
        <h4>标题四 H4</h4>
        <p>这是一段普通文本，用于展示排版效果。</p>
        <p><text type="primary">主要文本</text> 和 <text type="success">成功文本</text> 和 <text type="warning">警告文本</text> 和 <text type="danger">危险文本</text></p>
        <p><text mark>标记文本</text> 和 <text code>代码文本</text> 和 <text keyboard>键盘文本</text></p>
      </div>
    </div>

    <!-- 布局组件 -->
    <a-divider orientation="left">布局组件</a-divider>

    <!-- Divider 组件 -->
    <div class="section">
      <h2>Divider 分割线</h2>
      <div class="divider-demo">
        <p>这是第一段文本</p>
        <a-divider />
        <p>这是第二段文本</p>
        <a-divider>带文字的分割线</a-divider>
        <a-divider orientation="left">左侧文字</a-divider>
        <a-divider orientation="right">右侧文字</a-divider>
      </div>
    </div>

    <!-- Grid 组件 -->
    <div class="section">
      <h2>Grid 栅格</h2>
      <div class="grid-demo">
        <a-row :gutter="16">
          <a-col :span="6">
            <div class="grid-content">col-6</div>
          </a-col>
          <a-col :span="6">
            <div class="grid-content">col-6</div>
          </a-col>
          <a-col :span="6">
            <div class="grid-content">col-6</div>
          </a-col>
          <a-col :span="6">
            <div class="grid-content">col-6</div>
          </a-col>
        </a-row>
        <a-row :gutter="16" style="margin-top: 16px;">
          <a-col :span="8">
            <div class="grid-content">col-8</div>
          </a-col>
          <a-col :span="8">
            <div class="grid-content">col-8</div>
          </a-col>
          <a-col :span="8">
            <div class="grid-content">col-8</div>
          </a-col>
        </a-row>
      </div>
    </div>

    <!-- Layout 组件 -->
    <div class="section">
      <h2>Layout 布局</h2>
      <div class="layout-demo">
        <a-layout style="height: 200px;">
          <a-layout-header>
            <div class="layout-header">Header</div>
          </a-layout-header>
          <a-layout-content>
            <div class="layout-content">Content</div>
          </a-layout-content>
          <a-layout-footer>
            <div class="layout-footer">Footer</div>
          </a-layout-footer>
        </a-layout>
      </div>
    </div>

    <!-- Space 组件 -->
    <div class="section">
      <h2>Space 间距</h2>
      <div class="space-demo">
        <a-space direction="vertical" size="large">
          <a-button type="primary">按钮1</a-button>
          <a-button type="primary">按钮2</a-button>
          <a-button type="primary">按钮3</a-button>
        </a-space>
        <a-space size="medium" style="margin-top: 16px;">
          <a-button type="primary">按钮1</a-button>
          <a-button type="secondary">按钮2</a-button>
          <a-button type="dashed">按钮3</a-button>
        </a-space>
      </div>
    </div>

    <!-- 数据展示组件 -->
    <a-divider orientation="left">数据展示组件</a-divider>

    <!-- Avatar 组件 -->
    <div class="section">
      <h2>Avatar 头像</h2>
      <div class="avatar-demo">
        <a-avatar :size="40">A</a-avatar>
        <a-avatar :size="50">
          <img src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" alt="头像" />
        </a-avatar>
        <a-avatar :size="60" type="text">用户</a-avatar>
        <a-avatar :size="70" type="icon">
          <icon-user />
        </a-avatar>
      </div>
    </div>

    <!-- Badge 组件 -->
    <div class="section">
      <h2>Badge 徽标</h2>
      <div class="badge-demo">
        <a-badge :count="5">
          <a-button type="primary">消息</a-button>
        </a-badge>
        <a-badge :count="99" style="margin-left: 20px;">
          <a-button type="secondary">通知</a-button>
        </a-badge>
        <a-badge :count="0" show-zero style="margin-left: 20px;">
          <a-button type="dashed">购物车</a-button>
        </a-badge>
      </div>
    </div>

    <!-- Card 组件 -->
    <div class="section">
      <h2>Card 卡片</h2>
      <div class="card-container">
        <a-card title="卡片标题" style="width: 300px;">
          <p>这是卡片的内容区域，可以放置各种信息。</p>
          <p>卡片是用于承载信息的容器组件。</p>
        </a-card>
        <a-card title="可操作的卡片" style="width: 300px;">
          <template #extra>
            <a-link>更多</a-link>
          </template>
          <p>这是一个带有额外操作的卡片。</p>
          <a-button type="primary">操作按钮</a-button>
        </a-card>
      </div>
    </div>

    <!-- Collapse 组件 -->
    <div class="section">
      <h2>Collapse 折叠面板</h2>
      <div class="collapse-demo">
        <a-collapse>
          <a-collapse-panel key="1" header="折叠面板 1">
            <p>这是折叠面板 1 的内容。</p>
            <p>可以包含任何内容。</p>
          </a-collapse-panel>
          <a-collapse-panel key="2" header="折叠面板 2">
            <p>这是折叠面板 2 的内容。</p>
            <p>支持多个面板同时展开。</p>
          </a-collapse-panel>
          <a-collapse-panel key="3" header="折叠面板 3" disabled>
            <p>这个面板被禁用了。</p>
          </a-collapse-panel>
        </a-collapse>
      </div>
    </div>

    <!-- Descriptions 组件 -->
    <div class="section">
      <h2>Descriptions 描述列表</h2>
      <div class="descriptions-demo">
        <a-descriptions title="用户信息" bordered :column="2">
          <a-descriptions-item label="姓名">张三</a-descriptions-item>
          <a-descriptions-item label="年龄">25</a-descriptions-item>
          <a-descriptions-item label="邮箱">zhangsan@example.com</a-descriptions-item>
          <a-descriptions-item label="电话">138****8888</a-descriptions-item>
          <a-descriptions-item label="地址">北京市朝阳区</a-descriptions-item>
          <a-descriptions-item label="状态">激活</a-descriptions-item>
        </a-descriptions>
      </div>
    </div>

    <!-- Empty 组件 -->
    <div class="section">
      <h2>Empty 空状态</h2>
      <div class="empty-demo">
        <a-empty description="暂无数据" />
      </div>
    </div>

    <!-- Tag 组件 -->
    <div class="section">
      <h2>Tag 标签</h2>
      <div class="tag-demo">
        <a-tag>默认标签</a-tag>
        <a-tag color="blue">蓝色标签</a-tag>
        <a-tag color="green">绿色标签</a-tag>
        <a-tag color="orange">橙色标签</a-tag>
        <a-tag color="red">红色标签</a-tag>
        <a-tag color="arcoblue" closable>可关闭标签</a-tag>
        <a-tag color="gold" checkable>可选择标签</a-tag>
      </div>
    </div>

    <!-- Tabs 组件 -->
    <div class="section">
      <h2>Tabs 标签页</h2>
      <a-tabs v-model:active-key="activeTab">
        <a-tab-pane key="1" title="标签页1">
          <p>这是标签页1的内容。</p>
          <p>标签页用于在同一区域内展示不同内容。</p>
        </a-tab-pane>
        <a-tab-pane key="2" title="标签页2">
          <p>这是标签页2的内容。</p>
          <p>您可以在这里放置不同的内容。</p>
        </a-tab-pane>
        <a-tab-pane key="3" title="标签页3">
          <p>这是标签页3的内容。</p>
          <p>每个标签页都有独立的内容区域。</p>
        </a-tab-pane>
      </a-tabs>
    </div>
    <div class="section">
      <h2>Form 表单</h2>
      <a-form :model="formData" style="max-width: 500px;">
        <a-form-item label="姓名">
          <a-input v-model="formData.name" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model="formData.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="性别">
          <a-radio-group v-model="formData.gender">
            <a-radio value="male">男</a-radio>
            <a-radio value="female">女</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="爱好">
          <a-checkbox-group v-model="formData.hobbies">
            <a-checkbox value="reading">阅读</a-checkbox>
            <a-checkbox value="sports">运动</a-checkbox>
            <a-checkbox value="music">音乐</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-model="formData.status" />
        </a-form-item>
        <a-form-item label="城市">
          <a-select v-model="formData.city" placeholder="请选择城市" style="width: 200px;">
            <a-option value="beijing">北京</a-option>
            <a-option value="shanghai">上海</a-option>
            <a-option value="guangzhou">广州</a-option>
            <a-option value="shenzhen">深圳</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSubmit">提交</a-button>
          <a-button style="margin-left: 12px;">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-divider orientation="left">导航组件</a-divider>

    <!-- Breadcrumb 组件 -->
    <div class="section">
      <h2>Breadcrumb 面包屑</h2>
      <a-breadcrumb>
        <a-breadcrumb-item>首页</a-breadcrumb-item>
        <a-breadcrumb-item>组件</a-breadcrumb-item>
        <a-breadcrumb-item>导航</a-breadcrumb-item>
        <a-breadcrumb-item>面包屑</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- Tabs 组件 -->
    <div class="section">
      <h2>Tabs 标签页</h2>
      <a-tabs v-model:active-key="activeTab">
        <a-tab-pane key="1" title="标签页1">
          <p>这是标签页1的内容。</p>
          <p>标签页用于在同一区域内展示不同内容。</p>
        </a-tab-pane>
        <a-tab-pane key="2" title="标签页2">
          <p>这是标签页2的内容。</p>
          <p>您可以在这里放置不同的内容。</p>
        </a-tab-pane>
        <a-tab-pane key="3" title="标签页3">
          <p>这是标签页3的内容。</p>
          <p>每个标签页都有独立的内容区域。</p>
        </a-tab-pane>
      </a-tabs>
    </div>

    <a-divider orientation="left">反馈组件</a-divider>

    <!-- Alert 组件 -->
    <div class="section">
      <h2>Alert 警告提示</h2>
      <div class="alert-demo">
        <a-alert title="成功提示" type="success" show-icon style="margin-bottom: 12px;">
          这是一条成功提示信息
        </a-alert>
        <a-alert title="信息提示" type="info" show-icon style="margin-bottom: 12px;">
          这是一条信息提示信息
        </a-alert>
        <a-alert title="警告提示" type="warning" show-icon style="margin-bottom: 12px;">
          这是一条警告提示信息
        </a-alert>
        <a-alert title="错误提示" type="error" show-icon style="margin-bottom: 12px;">
          这是一条错误提示信息
        </a-alert>
      </div>
    </div>

    <!-- Message 组件 -->
    <div class="section">
      <h2>Message 消息提示</h2>
      <div class="message-demo">
        <a-button @click="showSuccessMessage" type="success">成功消息</a-button>
        <a-button @click="showInfoMessage" type="info" style="margin-left: 12px;">信息消息</a-button>
        <a-button @click="showWarningMessage" type="warning" style="margin-left: 12px;">警告消息</a-button>
        <a-button @click="showErrorMessage" type="error" style="margin-left: 12px;">错误消息</a-button>
      </div>
    </div>

    <!-- Modal 组件 -->
    <div class="section">
      <h2>Modal 对话框</h2>
      <a-button type="primary" @click="showModal = true">打开模态框</a-button>
      <a-modal v-model:visible="showModal" title="模态框标题" @ok="handleOk" @cancel="handleCancel">
        <p>这是模态框的内容。</p>
        <p>模态框用于需要用户确认或输入信息的重要操作。</p>
      </a-modal>
    </div>

    <!-- 数据输入组件 -->
    <a-divider orientation="left">数据输入组件</a-divider>

    <!-- AutoComplete 组件 -->
    <div class="section">
      <h2>AutoComplete 自动补全</h2>
      <div class="autocomplete-demo">
        <a-auto-complete 
          v-model="autocompleteValue" 
          :data="autocompleteData"
          placeholder="请输入"
          style="width: 300px;"
        />
      </div>
    </div>

    <!-- Cascader 组件 -->
    <div class="section">
      <h2>Cascader 级联选择</h2>
      <div class="cascader-demo">
        <a-cascader 
          v-model="cascaderValue"
          :options="cascaderOptions"
          placeholder="请选择"
          style="width: 300px;"
        />
      </div>
    </div>

    <!-- Checkbox 组件 -->
    <div class="section">
      <h2>Checkbox 复选框</h2>
      <div class="checkbox-demo">
        <div class="checkbox-group">
          <a-checkbox v-model="checkboxValue1">选项一</a-checkbox>
          <a-checkbox v-model="checkboxValue2">选项二</a-checkbox>
          <a-checkbox v-model="checkboxValue3">选项三</a-checkbox>
        </div>
        <div class="checkbox-group">
          <a-checkbox-group v-model="checkboxGroup">
            <a-checkbox value="apple">苹果</a-checkbox>
            <a-checkbox value="banana">香蕉</a-checkbox>
            <a-checkbox value="orange">橙子</a-checkbox>
          </a-checkbox-group>
        </div>
      </div>
    </div>

    <!-- DatePicker 组件 -->
    <div class="section">
      <h2>DatePicker 日期选择器</h2>
      <div class="datepicker-demo">
        <a-date-picker 
          v-model="dateValue"
          placeholder="选择日期"
          style="margin-right: 16px;"
        />
        <a-range-picker 
          v-model="rangeValue"
          placeholder="选择日期范围"
        />
      </div>
    </div>

    <!-- Input 组件 -->
    <div class="section">
      <h2>Input 输入框</h2>
      <div class="input-demo">
        <a-input v-model="inputValue" placeholder="请输入文本" style="width: 300px; margin-right: 16px;" />
        <a-input-password v-model="passwordValue" placeholder="请输入密码" style="width: 300px;" />
      </div>
      <div class="input-demo">
        <a-input-search v-model="searchValue" placeholder="搜索" style="width: 300px;" />
        <a-input-number v-model="numberValue" :min="1" :max="100" style="margin-left: 16px; width: 120px;" />
      </div>
    </div>

    <!-- Radio 组件 -->
    <div class="section">
      <h2>Radio 单选框</h2>
      <div class="radio-demo">
        <div class="radio-group">
          <a-radio v-model="radioValue" value="option1">选项一</a-radio>
          <a-radio v-model="radioValue" value="option2">选项二</a-radio>
          <a-radio v-model="radioValue" value="option3">选项三</a-radio>
        </div>
        <div class="radio-group">
          <a-radio-group v-model="radioGroup">
            <a-radio value="apple">苹果</a-radio>
            <a-radio value="banana">香蕉</a-radio>
            <a-radio value="orange">橙子</a-radio>
          </a-radio-group>
        </div>
      </div>
    </div>

    <!-- Select 组件 -->
    <div class="section">
      <h2>Select 选择器</h2>
      <div class="select-demo">
        <a-select 
          v-model="selectValue" 
          placeholder="请选择"
          style="width: 200px; margin-right: 16px;"
        >
          <a-option value="beijing">北京</a-option>
          <a-option value="shanghai">上海</a-option>
          <a-option value="guangzhou">广州</a-option>
          <a-option value="shenzhen">深圳</a-option>
        </a-select>
        <a-select 
          v-model="multipleSelectValue" 
          placeholder="多选"
          multiple
          style="width: 200px;"
        >
          <a-option value="reading">阅读</a-option>
          <a-option value="sports">运动</a-option>
          <a-option value="music">音乐</a-option>
          <a-option value="travel">旅行</a-option>
        </a-select>
      </div>
    </div>

    <!-- Slider 组件 -->
    <div class="section">
      <h2>Slider 滑动输入条</h2>
      <div class="slider-demo">
        <div style="margin-bottom: 16px;">
          <a-slider v-model="sliderValue" :min="0" :max="100" style="width: 300px;" />
        </div>
        <div>
          <a-slider v-model="rangeSliderValue" range :min="0" :max="100" style="width: 300px;" />
        </div>
      </div>
    </div>

    <!-- Switch 组件 -->
    <div class="section">
      <h2>Switch 开关</h2>
      <div class="switch-demo">
        <a-switch v-model="switchValue1" />
        <a-switch v-model="switchValue2" checked-color="#52c41a" style="margin-left: 16px;" />
        <a-switch v-model="switchValue3" disabled style="margin-left: 16px;" />
      </div>
    </div>

    <!-- Textarea 组件 -->
    <div class="section">
      <h2>Textarea 文本域</h2>
      <div class="textarea-demo">
        <a-textarea 
          v-model="textareaValue"
          placeholder="请输入文本"
          :max-length="100"
          show-word-limit
          style="width: 400px;"
        />
      </div>
    </div>

    <!-- TimePicker 组件 -->
    <div class="section">
      <h2>TimePicker 时间选择器</h2>
      <div class="timepicker-demo">
        <a-time-picker 
          v-model="timeValue"
          placeholder="选择时间"
          style="margin-right: 16px;"
        />
        <a-time-picker 
          v-model="timeRangeValue"
          placeholder="选择时间范围"
          range
        />
      </div>
    </div>

    <!-- Form 组件 -->
    <div class="section">
      <h2>Form 表单</h2>
      <a-form :model="formData" style="max-width: 500px;">
        <a-form-item label="姓名">
          <a-input v-model="formData.name" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model="formData.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="性别">
          <a-radio-group v-model="formData.gender">
            <a-radio value="male">男</a-radio>
            <a-radio value="female">女</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="爱好">
          <a-checkbox-group v-model="formData.hobbies">
            <a-checkbox value="reading">阅读</a-checkbox>
            <a-checkbox value="sports">运动</a-checkbox>
            <a-checkbox value="music">音乐</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-model="formData.status" />
        </a-form-item>
        <a-form-item label="城市">
          <a-select v-model="formData.city" placeholder="请选择城市" style="width: 200px;">
            <a-option value="beijing">北京</a-option>
            <a-option value="shanghai">上海</a-option>
            <a-option value="guangzhou">广州</a-option>
            <a-option value="shenzhen">深圳</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSubmit">提交</a-button>
          <a-button style="margin-left: 12px;">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 反馈组件 -->
    <a-divider orientation="left">反馈组件</a-divider>

    <!-- Alert 组件 -->
    <div class="section">
      <h2>Alert 警告提示</h2>
      <div class="alert-demo">
        <a-alert title="成功提示" type="success" show-icon style="margin-bottom: 12px;">
          这是一条成功提示信息
        </a-alert>
        <a-alert title="信息提示" type="info" show-icon style="margin-bottom: 12px;">
          这是一条信息提示信息
        </a-alert>
        <a-alert title="警告提示" type="warning" show-icon style="margin-bottom: 12px;">
          这是一条警告提示信息
        </a-alert>
        <a-alert title="错误提示" type="error" show-icon style="margin-bottom: 12px;">
          这是一条错误提示信息
        </a-alert>
      </div>
    </div>

    <!-- Message 组件 -->
    <div class="section">
      <h2>Message 消息提示</h2>
      <div class="message-demo">
        <a-button @click="showSuccessMessage" type="success">成功消息</a-button>
        <a-button @click="showInfoMessage" type="info" style="margin-left: 12px;">信息消息</a-button>
        <a-button @click="showWarningMessage" type="warning" style="margin-left: 12px;">警告消息</a-button>
        <a-button @click="showErrorMessage" type="error" style="margin-left: 12px;">错误消息</a-button>
      </div>
    </div>

    <!-- Modal 组件 -->
    <div class="section">
      <h2>Modal 对话框</h2>
      <a-button type="primary" @click="showModal = true">打开模态框</a-button>
      <a-modal v-model:visible="showModal" title="模态框标题" @ok="handleOk" @cancel="handleCancel">
        <p>这是模态框的内容。</p>
        <p>模态框用于需要用户确认或输入信息的重要操作。</p>
      </a-modal>
    </div>

    <!-- Drawer 组件 -->
    <div class="section">
      <h2>Drawer 抽屉</h2>
      <a-button type="primary" @click="showDrawer = true">打开抽屉</a-button>
      <a-drawer v-model:visible="showDrawer" title="抽屉标题" width="400px">
        <p>这是抽屉的内容。</p>
        <p>抽屉用于侧边栏展示或表单输入。</p>
      </a-drawer>
    </div>

    <!-- Notification 组件 -->
    <div class="section">
      <h2>Notification 通知提醒框</h2>
      <div class="notification-demo">
        <a-button @click="showNotification('info')" type="info">信息通知</a-button>
        <a-button @click="showNotification('success')" type="success" style="margin-left: 12px;">成功通知</a-button>
        <a-button @click="showNotification('warning')" type="warning" style="margin-left: 12px;">警告通知</a-button>
        <a-button @click="showNotification('error')" type="error" style="margin-left: 12px;">错误通知</a-button>
      </div>
    </div>

    <!-- Popconfirm 组件 -->
    <div class="section">
      <h2>Popconfirm 气泡确认框</h2>
      <div class="popconfirm-demo">
        <a-popconfirm 
          content="确定要删除这个项目吗？"
          @ok="handlePopconfirmOk"
          @cancel="handlePopconfirmCancel"
        >
          <a-button type="primary">删除</a-button>
        </a-popconfirm>
      </div>
    </div>

    <!-- Progress 组件 -->
    <div class="section">
      <h2>Progress 进度条</h2>
      <div class="progress-demo">
        <div style="margin-bottom: 16px;">
          <a-progress :percent="30" />
        </div>
        <div style="margin-bottom: 16px;">
          <a-progress :percent="70" status="warning" />
        </div>
        <div style="margin-bottom: 16px;">
          <a-progress :percent="100" status="success" />
        </div>
        <div>
          <a-progress :percent="50" status="error" />
        </div>
      </div>
    </div>

    <!-- Spin 组件 -->
    <div class="section">
      <h2>Spin 加载中</h2>
      <div class="spin-demo">
        <a-spin :loading="spinLoading" description="加载中...">
          <div style="padding: 20px; border: 1px solid #f0f0f0;">
            <p>这是加载的内容</p>
            <p>加载完成后显示</p>
          </div>
        </a-spin>
        <a-button @click="toggleSpin" style="margin-top: 16px;">
          {{ spinLoading ? '停止加载' : '开始加载' }}
        </a-button>
      </div>
    </div>

    <!-- Skeleton 组件 -->
    <div class="section">
      <h2>Skeleton 骨架屏</h2>
      <div class="skeleton-demo">
        <a-skeleton :loading="skeletonLoading" animation>
          <div style="padding: 20px;">
            <h3>内容标题</h3>
            <p>这里是实际的加载内容。</p>
          </div>
        </a-skeleton>
        <a-button @click="toggleSkeleton" style="margin-top: 16px;">
          {{ skeletonLoading ? '显示内容' : '显示骨架屏' }}
        </a-button>
      </div>
    </div>

    <!-- 导航组件 -->
    <a-divider orientation="left">导航组件</a-divider>

    <!-- Breadcrumb 组件 -->
    <div class="section">
      <h2>Breadcrumb 面包屑</h2>
      <a-breadcrumb>
        <a-breadcrumb-item>首页</a-breadcrumb-item>
        <a-breadcrumb-item>组件</a-breadcrumb-item>
        <a-breadcrumb-item>导航</a-breadcrumb-item>
        <a-breadcrumb-item>面包屑</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- Dropdown 组件 -->
    <div class="section">
      <h2>Dropdown 下拉菜单</h2>
      <div class="dropdown-demo">
        <a-dropdown>
          <a-button type="primary">下拉菜单 <icon-down /></a-button>
          <template #content>
            <a-doption>选项一</a-doption>
            <a-doption>选项二</a-doption>
            <a-doption>选项三</a-doption>
            <a-dsubmenu title="子菜单">
              <a-doption>子选项一</a-doption>
              <a-doption>子选项二</a-doption>
            </a-dsubmenu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- Menu 组件 -->
    <div class="section">
      <h2>Menu 菜单</h2>
      <div class="menu-demo">
        <a-menu mode="horizontal" :default-selected-keys="['1']">
          <a-menu-item key="1">
            <icon-home />
            首页
          </a-menu-item>
          <a-menu-item key="2">
            <icon-user />
            用户
          </a-menu-item>
          <a-menu-item key="3">
            <icon-setting />
            设置
          </a-menu-item>
        </a-menu>
      </div>
    </div>

    <!-- Pagination 组件 -->
    <div class="section">
      <h2>Pagination 分页</h2>
      <a-pagination :total="100" :current="1" :page-size="10" show-total show-jumper />
    </div>

    <!-- Steps 组件 -->
    <div class="section">
      <h2>Steps 步骤条</h2>
      <div class="steps-demo">
        <a-steps :current="currentStep" size="small">
          <a-step title="步骤1" description="描述信息" />
          <a-step title="步骤2" description="描述信息" />
          <a-step title="步骤3" description="描述信息" />
          <a-step title="步骤4" description="描述信息" />
        </a-steps>
        <a-button-group style="margin-top: 16px;">
          <a-button @click="prevStep" :disabled="currentStep === 1">上一步</a-button>
          <a-button @click="nextStep" :disabled="currentStep === 4">下一步</a-button>
        </a-button-group>
      </div>
    </div>

    <!-- Table 组件 -->
    <div class="section">
      <h2>Table 表格</h2>
      <a-table :columns="tableColumns" :data="tableData" :pagination="false" style="margin-top: 16px;">
        <template #status="{ record }">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status === 'active' ? '激活' : '禁用' }}
          </a-tag>
        </template>
      </a-table>
    </div>

    <!-- 其他组件 -->
    <a-divider orientation="left">其他组件</a-divider>

    <!-- BackTop 组件 -->
    <div class="section">
      <h2>BackTop 返回顶部</h2>
      <div class="backtop-demo">
        <p>滚动页面查看返回顶部按钮效果</p>
        <a-back-top :height="300" bottom="100" />
      </div>
    </div>

    <!-- Tooltip 组件 -->
    <div class="section">
      <h2>Tooltip 文字气泡</h2>
      <div class="tooltip-demo">
        <a-tooltip content="这是提示文字" position="top">
          <a-button>顶部提示</a-button>
        </a-tooltip>
        <a-tooltip content="这是提示文字" position="bottom" style="margin-left: 12px;">
          <a-button>底部提示</a-button>
        </a-tooltip>
        <a-tooltip content="这是提示文字" position="left" style="margin-left: 12px;">
          <a-button>左侧提示</a-button>
        </a-tooltip>
        <a-tooltip content="这是提示文字" position="right" style="margin-left: 12px;">
          <a-button>右侧提示</a-button>
        </a-tooltip>
      </div>
    </div>

    <!-- Tree 组件 -->
    <div class="section">
      <h2>Tree 树形控件</h2>
      <div class="tree-demo">
        <a-tree 
          :data="treeData"
          :default-expand-all="true"
          :show-line="true"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Message, Notification } from '@arco-design/web-vue'

// 基础输入组件数据
const inputValue = ref('')
const passwordValue = ref('')
const searchValue = ref('')
const numberValue = ref(10)
const textareaValue = ref('')

// 表单数据
const formData = ref({
  name: '',
  email: '',
  gender: '',
  hobbies: [],
  status: false,
  city: ''
})

// 数据输入组件数据
const autocompleteValue = ref('')
const autocompleteData = ['选项一', '选项二', '选项三', '自定义选项']

const cascaderValue = ref('')
const cascaderOptions = [
  {
    label: '北京市',
    value: 'beijing',
    children: [
      {
        label: '朝阳区',
        value: 'chaoyang',
        children: [
          { label: '三里屯', value: 'sanlitun' },
          { label: '国贸', value: 'guomao' }
        ]
      },
      {
        label: '海淀区',
        value: 'haidian',
        children: [
          { label: '中关村', value: 'zhongguancun' },
          { label: '五道口', value: 'wudaokou' }
        ]
      }
    ]
  },
  {
    label: '上海市',
    value: 'shanghai',
    children: [
      {
        label: '黄浦区',
        value: 'huangpu',
        children: [
          { label: '外滩', value: 'waitan' },
          { label: '人民广场', value: 'renminguangchang' }
        ]
      },
      {
        label: '浦东新区',
        value: 'pudong',
        children: [
          { label: '陆家嘴', value: 'lujiazui' },
          { label: '张江', value: 'zhangjiang' }
        ]
      }
    ]
  }
]

// 复选框数据
const checkboxValue1 = ref(false)
const checkboxValue2 = ref(true)
const checkboxValue3 = ref(false)
const checkboxGroup = ref(['apple'])

// 日期选择器数据
const dateValue = ref('')
const rangeValue = ref([])

// 单选框数据
const radioValue = ref('option1')
const radioGroup = ref('apple')

// 选择器数据
const selectValue = ref('')
const multipleSelectValue = ref(['reading'])

// 滑动条数据
const sliderValue = ref(50)
const rangeSliderValue = ref([20, 80])

// 开关数据
const switchValue1 = ref(true)
const switchValue2 = ref(false)
const switchValue3 = ref(true)

// 时间选择器数据
const timeValue = ref('')
const timeRangeValue = ref([])

// 标签页数据
const activeTab = ref('1')

// 反馈组件数据
const showModal = ref(false)
const showDrawer = ref(false)
const spinLoading = ref(false)
const skeletonLoading = ref(true)

// 步骤条数据
const currentStep = ref(1)

// 树形数据
const treeData = [
  {
    title: '根节点1',
    key: '1',
    children: [
      {
        title: '子节点1',
        key: '1-1',
        children: [
          {
            title: '叶子节点1',
            key: '1-1-1'
          },
          {
            title: '叶子节点2',
            key: '1-1-2'
          }
        ]
      },
      {
        title: '子节点2',
        key: '1-2',
        children: [
          {
            title: '叶子节点3',
            key: '1-2-1'
          },
          {
            title: '叶子节点4',
            key: '1-2-2'
          }
        ]
      }
    ]
  },
  {
    title: '根节点2',
    key: '2',
    children: [
      {
        title: '子节点3',
        key: '2-1'
      },
      {
        title: '子节点4',
        key: '2-2'
      }
    ]
  }
]

// 表格数据
const tableColumns = [
  {
    title: '姓名',
    dataIndex: 'name',
  },
  {
    title: '年龄',
    dataIndex: 'age',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
  },
  {
    title: '状态',
    dataIndex: 'status',
    slotName: 'status',
  },
]

const tableData = ref([
  {
    key: '1',
    name: '张三',
    age: 25,
    email: 'zhangsan@example.com',
    status: 'active'
  },
  {
    key: '2',
    name: '李四',
    age: 30,
    email: 'lisi@example.com',
    status: 'disabled'
  },
  {
    key: '3',
    name: '王五',
    age: 28,
    email: 'wangwu@example.com',
    status: 'active'
  }
])

// 事件处理函数
const handleSubmit = () => {
  Message.info('表单提交功能待实现')
}

const showSuccessMessage = () => {
  Message.success('这是一条成功消息')
}

const showInfoMessage = () => {
  Message.info('这是一条信息消息')
}

const showWarningMessage = () => {
  Message.warning('这是一条警告消息')
}

const showErrorMessage = () => {
  Message.error('这是一条错误消息')
}

const handleOk = () => {
  Message.info('确认操作')
  showModal.value = false
}

const handleCancel = () => {
  Message.warning('取消操作')
  showModal.value = false
}

const showNotification = (type) => {
  const titles = {
    info: '信息通知',
    success: '成功通知',
    warning: '警告通知',
    error: '错误通知'
  }
  
  const contents = {
    info: '这是一条信息通知',
    success: '这是一条成功通知',
    warning: '这是一条警告通知',
    error: '这是一条错误通知'
  }
  
  Notification[type]({
    title: titles[type],
    content: contents[type]
  })
}

const handlePopconfirmOk = () => {
  Message.success('确认删除')
}

const handlePopconfirmCancel = () => {
  Message.warning('取消删除')
}

const toggleSpin = () => {
  spinLoading.value = !spinLoading.value
}

const toggleSkeleton = () => {
  skeletonLoading.value = !skeletonLoading.value
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}
</script>

<style scoped>
</style>