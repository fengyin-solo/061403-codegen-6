<template>
  <div class="shelter-panel">
    <h3 class="panel-title">🏠 避难所</h3>
    <div v-if="isNight" class="night-warning">
      <span>🌙 夜晚无法建造，请等待白天！</span>
    </div>
    <div class="shelter-list">
      <div class="shelter-item">
        <div class="shelter-header">
          <span class="shelter-icon">🧱</span>
          <div class="shelter-info">
            <span class="shelter-name">墙体</span>
            <span class="shelter-level">Lv.{{ wallLevel }}/{{ maxLevel }}</span>
          </div>
        </div>
        <div class="shelter-effect">
          <span class="effect-label">效果：</span>
          <span class="effect-text">减少 {{ Math.round(blizzardDamageReduction * 100) }}% 暴风雪伤害，提升 {{ Math.round(heatRetentionBonus * 100) }}% 热量保留</span>
        </div>
        <div class="shelter-progress">
          <div class="progress-dots">
            <span 
              v-for="i in maxLevel" 
              :key="i" 
              class="dot"
              :class="{ filled: i <= wallLevel }"
            ></span>
          </div>
        </div>
        <div v-if="wallCost" class="shelter-cost">
          <span class="cost-label">升级消耗：</span>
          <span class="cost-item">🪵 {{ wallCost.wood }}</span>
          <span class="cost-item">🦊 {{ wallCost.hide }}</span>
          <span class="cost-item">🔪 {{ wallCost.tools }}</span>
        </div>
        <div v-else class="shelter-max">已达最高等级</div>
        <button 
          class="upgrade-btn"
          :class="{ disabled: !canUpgradeWall || isNight || gameOver }"
          @click="$emit('upgrade', 'wall')"
        >
          升级墙体
        </button>
      </div>

      <div class="shelter-item">
        <div class="shelter-header">
          <span class="shelter-icon">🛏️</span>
          <div class="shelter-info">
            <span class="shelter-name">床铺</span>
            <span class="shelter-level">Lv.{{ bedLevel }}/{{ maxLevel }}</span>
          </div>
        </div>
        <div class="shelter-effect">
          <span class="effect-label">效果：</span>
          <span class="effect-text">夜间额外恢复 {{ nightHeatRecovery }} 体温/秒</span>
        </div>
        <div class="shelter-progress">
          <div class="progress-dots">
            <span 
              v-for="i in maxLevel" 
              :key="i" 
              class="dot"
              :class="{ filled: i <= bedLevel }"
            ></span>
          </div>
        </div>
        <div v-if="bedCost" class="shelter-cost">
          <span class="cost-label">升级消耗：</span>
          <span class="cost-item">🪵 {{ bedCost.wood }}</span>
          <span class="cost-item">🦊 {{ bedCost.hide }}</span>
          <span class="cost-item">🔪 {{ bedCost.tools }}</span>
        </div>
        <div v-else class="shelter-max">已达最高等级</div>
        <button 
          class="upgrade-btn"
          :class="{ disabled: !canUpgradeBed || isNight || gameOver }"
          @click="$emit('upgrade', 'bed')"
        >
          升级床铺
        </button>
      </div>

      <div class="shelter-item">
        <div class="shelter-header">
          <span class="shelter-icon">📦</span>
          <div class="shelter-info">
            <span class="shelter-name">储物区</span>
            <span class="shelter-level">Lv.{{ storageLevel }}/{{ maxLevel }}</span>
          </div>
        </div>
        <div class="shelter-effect">
          <span class="effect-label">效果：</span>
          <span class="effect-text">资源获取量提升 {{ Math.round((resourceBonus - 1) * 100) }}%</span>
        </div>
        <div class="shelter-progress">
          <div class="progress-dots">
            <span 
              v-for="i in maxLevel" 
              :key="i" 
              class="dot"
              :class="{ filled: i <= storageLevel }"
            ></span>
          </div>
        </div>
        <div v-if="storageCost" class="shelter-cost">
          <span class="cost-label">升级消耗：</span>
          <span class="cost-item">🪵 {{ storageCost.wood }}</span>
          <span class="cost-item">🦊 {{ storageCost.hide }}</span>
          <span class="cost-item">🔪 {{ storageCost.tools }}</span>
        </div>
        <div v-else class="shelter-max">已达最高等级</div>
        <button 
          class="upgrade-btn"
          :class="{ disabled: !canUpgradeStorage || isNight || gameOver }"
          @click="$emit('upgrade', 'storage')"
        >
          升级储物区
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  wallLevel: { type: Number, default: 0 },
  bedLevel: { type: Number, default: 0 },
  storageLevel: { type: Number, default: 0 },
  maxLevel: { type: Number, default: 4 },
  blizzardDamageReduction: { type: Number, default: 0 },
  heatRetentionBonus: { type: Number, default: 0 },
  nightHeatRecovery: { type: Number, default: 0 },
  resourceBonus: { type: Number, default: 1 },
  wallCost: { type: Object, default: null },
  bedCost: { type: Object, default: null },
  storageCost: { type: Object, default: null },
  canUpgradeWall: { type: Boolean, default: false },
  canUpgradeBed: { type: Boolean, default: false },
  canUpgradeStorage: { type: Boolean, default: false },
  isNight: { type: Boolean, default: false },
  gameOver: { type: Boolean, default: false }
})

defineEmits(['upgrade'])
</script>

<style scoped>
.shelter-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.panel-title {
  color: white;
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.night-warning {
  background: rgba(50, 50, 100, 0.8);
  border: 1px solid rgba(100, 100, 200, 0.5);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 15px;
  text-align: center;
  color: #a0c4ff;
  font-size: 14px;
}

.shelter-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.shelter-item {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.shelter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.shelter-icon {
  font-size: 32px;
}

.shelter-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shelter-name {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.shelter-level {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.shelter-effect {
  margin-bottom: 10px;
  font-size: 12px;
}

.effect-label {
  color: rgba(255, 255, 255, 0.6);
}

.effect-text {
  color: #66ff99;
  font-weight: bold;
}

.shelter-progress {
  margin-bottom: 10px;
}

.progress-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.dot.filled {
  background: linear-gradient(135deg, #66ff99, #33cc66);
  border-color: #66ff99;
  box-shadow: 0 0 8px rgba(102, 255, 153, 0.5);
}

.shelter-cost {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
}

.cost-label {
  color: rgba(255, 255, 255, 0.6);
}

.cost-item {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 8px;
  border-radius: 6px;
}

.shelter-max {
  text-align: center;
  color: #ffcc00;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 12px;
  padding: 5px;
  background: rgba(255, 204, 0, 0.1);
  border-radius: 6px;
}

.upgrade-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  border: 2px solid rgba(139, 92, 246, 0.5);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.upgrade-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.upgrade-btn:active:not(.disabled) {
  transform: translateY(0);
}

.upgrade-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}
</style>
