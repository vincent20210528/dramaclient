<template>
  <div class="authenticating-page">
    <div class="content-container">
      <div class="icon-container">
        <el-icon class="check-icon">
          <Check />
        </el-icon>
      </div>
      <div class="message-text">
        信息已提交，认证中
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from '@element-plus/icons-vue';
</script>

<style scoped>
.authenticating-page {
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.content-container {
  background-color: #fafafa;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 320px;
  width: 100%;
}

.icon-container {
  margin-bottom: 24px;
}

.check-icon {
  font-size: 48px;
  color: #67C23A;
  font-weight: bold;
}

.message-text {
  font-size: 16px;
  color: #333333;
  line-height: 1.5;
  font-weight: 400;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .authenticating-page {
    padding: 16px;
  }
  
  .content-container {
    padding: 32px 24px;
    max-width: 280px;
  }
  
  .check-icon {
    font-size: 42px;
  }
  
  .message-text {
    font-size: 15px;
  }
}

@media (max-width: 375px) {
  .content-container {
    padding: 28px 20px;
    max-width: 260px;
  }
  
  .check-icon {
    font-size: 40px;
  }
  
  .message-text {
    font-size: 14px;
  }
}
</style>
