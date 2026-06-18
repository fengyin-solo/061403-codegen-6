import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useGame() {
  const temperature = ref(80)
  const heat = ref(50)
  const wood = ref(10)
  const food = ref(5)
  const hide = ref(0)
  const tools = ref(0)
  const isDay = ref(true)
  const dayCount = ref(1)
  const isBlizzard = ref(false)
  const gameOver = ref(false)
  const gameOverReason = ref('')
  const actionLog = ref([])

  const wallLevel = ref(0)
  const bedLevel = ref(0)
  const storageLevel = ref(0)
  const saveUpdateSeq = ref(0)

  const DAY_DURATION = 30000
  const NIGHT_DURATION = 20000
  const HEAT_CONSUMPTION_RATE = 2
  const BLIZZARD_CHANCE = 0.15

  const SHELTER_COSTS = {
    wall: [
      { wood: 8, hide: 0, tools: 0 },
      { wood: 15, hide: 3, tools: 1 },
      { wood: 25, hide: 8, tools: 3 },
      { wood: 40, hide: 15, tools: 5 }
    ],
    bed: [
      { wood: 5, hide: 3, tools: 0 },
      { wood: 10, hide: 8, tools: 1 },
      { wood: 18, hide: 15, tools: 3 },
      { wood: 30, hide: 25, tools: 5 }
    ],
    storage: [
      { wood: 10, hide: 2, tools: 0 },
      { wood: 18, hide: 5, tools: 2 },
      { wood: 30, hide: 10, tools: 4 },
      { wood: 50, hide: 20, tools: 7 }
    ]
  }

  const MAX_SHELTER_LEVEL = 4

  let dayNightTimer = null
  let nightConsumptionTimer = null
  let autoSaveTimer = null

  const isNight = computed(() => !isDay.value)
  const isDanger = computed(() => temperature.value < 30)
  const canMakeFire = computed(() => wood.value >= 3)
  const canHunt = computed(() => tools.value > 0)
  const huntSuccessRate = computed(() => 0.3 + tools.value * 0.15)

  const blizzardDamageReduction = computed(() => {
    return wallLevel.value * 0.15
  })

  const heatRetentionBonus = computed(() => {
    return wallLevel.value * 0.1
  })

  const nightHeatRecovery = computed(() => {
    return bedLevel.value * 2
  })

  const resourceBonus = computed(() => {
    return 1 + storageLevel.value * 0.15
  })

  function getNextUpgradeCost(type) {
    const level = type === 'wall' ? wallLevel.value : type === 'bed' ? bedLevel.value : storageLevel.value
    if (level >= MAX_SHELTER_LEVEL) return null
    return SHELTER_COSTS[type][level]
  }

  function canUpgradeShelter(type) {
    const cost = getNextUpgradeCost(type)
    if (!cost) return false
    return wood.value >= cost.wood && hide.value >= cost.hide && tools.value >= cost.tools
  }

  function upgradeShelter(type) {
    if (gameOver.value || isNight.value) return false
    
    const cost = getNextUpgradeCost(type)
    if (!cost) {
      addLog('已达最高等级！', 'warning')
      return false
    }
    if (!canUpgradeShelter(type)) {
      addLog('材料不足，无法升级！', 'warning')
      return false
    }

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 10 * multiplier

    wood.value -= cost.wood
    hide.value -= cost.hide
    tools.value -= cost.tools
    temperature.value = Math.max(0, temperature.value - tempCost)

    const names = { wall: '墙体', bed: '床铺', storage: '储物区' }
    if (type === 'wall') wallLevel.value++
    if (type === 'bed') bedLevel.value++
    if (type === 'storage') storageLevel.value++

    const newLevel = type === 'wall' ? wallLevel.value : type === 'bed' ? bedLevel.value : storageLevel.value
    addLog(`🏗️ ${names[type]}升级到 Lv.${newLevel}！消耗 ${tempCost} 体温`, 'success')
    
    checkGameOver()
    return true
  }

  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    actionLog.value.unshift({ message, type, timestamp })
    if (actionLog.value.length > 20) {
      actionLog.value.pop()
    }
  }

  function checkGameOver() {
    if (temperature.value <= 20) {
      gameOver.value = true
      gameOverReason.value = '体温过低，你在严寒中失去了意识...'
      stopTimers()
      addLog('游戏结束：体温过低！', 'danger')
    }
    if (temperature.value >= 100) {
      temperature.value = 100
    }
  }

  function consumeHeat() {
    if (gameOver.value) return
    
    let multiplier = isBlizzard.value ? 2 : 1
    multiplier *= (1 - blizzardDamageReduction.value)
    const consumption = HEAT_CONSUMPTION_RATE * multiplier
    
    const heatRetention = 1 + heatRetentionBonus.value
    const effectiveConsumption = consumption / heatRetention
    
    if (heat.value >= effectiveConsumption) {
      heat.value -= effectiveConsumption
      if (temperature.value < 80) {
        const recovery = 1 + nightHeatRecovery.value * 0.5
        temperature.value = Math.min(80, temperature.value + recovery)
      }
    } else {
      heat.value = 0
      temperature.value = Math.max(0, temperature.value - effectiveConsumption)
      addLog('热量不足！体温正在下降...', 'warning')
    }
    
    checkGameOver()
  }

  function startNightCycle() {
    addLog(`夜幕降临，第 ${dayCount.value} 天结束`, 'info')
    nightConsumptionTimer = setInterval(() => {
      consumeHeat()
    }, 1000)
    
    if (Math.random() < BLIZZARD_CHANCE) {
      triggerBlizzard()
    }
  }

  function startDayCycle() {
    dayCount.value++
    addLog(`天亮了，第 ${dayCount.value} 天开始`, 'success')
    isBlizzard.value = false
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
  }

  function toggleDayNight() {
    isDay.value = !isDay.value
    if (isDay.value) {
      startDayCycle()
    } else {
      startNightCycle()
    }
  }

  function triggerBlizzard() {
    isBlizzard.value = true
    addLog('⚠️ 暴风雪来袭！所有消耗加倍！', 'danger')
  }

  function chopWood() {
    if (gameOver.value || isNight.value) return
    
    let multiplier = isBlizzard.value ? 2 : 1
    multiplier *= (1 - blizzardDamageReduction.value * 0.5)
    const tempCost = Math.round(5 * multiplier * 10) / 10
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    const baseWood = Math.floor(Math.random() * 3) + 2
    const woodGained = Math.floor(baseWood * resourceBonus.value)
    wood.value += woodGained
    
    addLog(`砍柴：获得 ${woodGained} 木头，消耗 ${tempCost} 体温`, 'action')
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function hunt() {
    if (gameOver.value || isNight.value) return
    
    let multiplier = isBlizzard.value ? 2 : 1
    multiplier *= (1 - blizzardDamageReduction.value * 0.5)
    const tempCost = Math.round(8 * multiplier * 10) / 10
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    
    if (Math.random() < huntSuccessRate.value) {
      const baseFood = Math.floor(Math.random() * 3) + 2
      const baseHide = Math.floor(Math.random() * 2) + 1
      const foodGained = Math.floor(baseFood * resourceBonus.value)
      const hideGained = Math.floor(baseHide * resourceBonus.value)
      food.value += foodGained
      hide.value += hideGained
      addLog(`狩猎成功：获得 ${foodGained} 食物，${hideGained} 兽皮，消耗 ${tempCost} 体温`, 'success')
    } else {
      addLog(`狩猎失败：消耗 ${tempCost} 体温，空手而归`, 'warning')
    }
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function makeTools() {
    if (gameOver.value || isNight.value) return
    if (wood.value < 2 || hide.value < 1) {
      addLog('材料不足：需要 2 木头和 1 兽皮', 'warning')
      return
    }
    
    let multiplier = isBlizzard.value ? 2 : 1
    multiplier *= (1 - blizzardDamageReduction.value * 0.5)
    const tempCost = Math.round(6 * multiplier * 10) / 10
    
    wood.value -= 2
    hide.value -= 1
    tools.value += 1
    temperature.value = Math.max(0, temperature.value - tempCost)
    
    addLog(`制作工具：获得 1 工具，消耗 ${tempCost} 体温`, 'success')
    checkGameOver()
  }

  function makeFire() {
    if (gameOver.value || !canMakeFire.value) {
      addLog('木头不足：生火需要 3 木头', 'warning')
      return
    }
    
    wood.value -= 3
    const heatGained = Math.floor(Math.random() * 20) + 25
    heat.value = Math.min(100, heat.value + heatGained)
    temperature.value = Math.min(100, temperature.value + 10)
    
    addLog(`生火：获得 ${heatGained} 热量，体温上升 10`, 'success')
  }

  function eatFood() {
    if (gameOver.value || food.value < 1) {
      addLog('没有食物了！', 'warning')
      return
    }
    
    food.value -= 1
    const tempGained = Math.floor(Math.random() * 10) + 5
    temperature.value = Math.min(100, temperature.value + tempGained)
    
    addLog(`进食：体温恢复 ${tempGained}`, 'success')
  }

  function startTimers() {
    dayNightTimer = setInterval(() => {
      toggleDayNight()
    }, isDay.value ? DAY_DURATION : NIGHT_DURATION)
    
    autoSaveTimer = setInterval(() => {
      saveGame('auto')
    }, 10000)
  }

  function stopTimers() {
    if (dayNightTimer) {
      clearInterval(dayNightTimer)
      dayNightTimer = null
    }
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function saveGame(slot = 'manual') {
    const gameState = {
      temperature: temperature.value,
      heat: heat.value,
      wood: wood.value,
      food: food.value,
      hide: hide.value,
      tools: tools.value,
      isDay: isDay.value,
      dayCount: dayCount.value,
      isBlizzard: isBlizzard.value,
      wallLevel: wallLevel.value,
      bedLevel: bedLevel.value,
      storageLevel: storageLevel.value,
      savedAt: Date.now()
    }
    const key = `snowSurvival_${slot}`
    const payload = JSON.stringify(gameState)
    localStorage.setItem(key, payload)
    saveUpdateSeq.value++
    addLog(`游戏已保存到存档位：${slot === 'auto' ? '自动存档' : slot}`, 'info')
  }

  function loadGame(slot = 'auto') {
    const saved = localStorage.getItem(`snowSurvival_${slot}`)
    if (!saved) {
      addLog('没有找到存档', 'warning')
      return false
    }

    try {
      const gameState = JSON.parse(saved)
      temperature.value = gameState.temperature ?? 80
      heat.value = gameState.heat ?? 50
      wood.value = gameState.wood ?? 10
      food.value = gameState.food ?? 5
      hide.value = gameState.hide ?? 0
      tools.value = gameState.tools ?? 0
      isDay.value = gameState.isDay ?? true
      dayCount.value = gameState.dayCount ?? 1
      isBlizzard.value = gameState.isBlizzard ?? false
      wallLevel.value = gameState.wallLevel ?? 0
      bedLevel.value = gameState.bedLevel ?? 0
      storageLevel.value = gameState.storageLevel ?? 0
      gameOver.value = false
      gameOverReason.value = ''
      actionLog.value = []

      stopTimers()
      startTimers()

      if (nightConsumptionTimer) {
        clearInterval(nightConsumptionTimer)
        nightConsumptionTimer = null
      }
      if (!isDay.value) {
        startNightCycle()
      }

      saveUpdateSeq.value++
      addLog(`成功加载存档：${slot === 'auto' ? '自动存档' : slot}`, 'success')
      return true
    } catch (e) {
      addLog('存档损坏，无法加载', 'danger')
      return false
    }
  }

  const saveSlots = computed(() => {
    const _ = saveUpdateSeq.value
    const slots = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('snowSurvival_')) {
        const slotName = key.replace('snowSurvival_', '')
        try {
          const raw = localStorage.getItem(key)
          const data = JSON.parse(raw)
          slots.push({
            name: slotName,
            dayCount: data.dayCount,
            savedAt: data.savedAt,
            wallLevel: data.wallLevel || 0,
            bedLevel: data.bedLevel || 0,
            storageLevel: data.storageLevel || 0,
            wood: data.wood ?? 0,
            food: data.food ?? 0,
            hide: data.hide ?? 0,
            tools: data.tools ?? 0,
            temperature: data.temperature ?? 0
          })
        } catch (e) {}
      }
    }
    slots.sort((a, b) => b.savedAt - a.savedAt)
    return slots
  })

  function deleteSave(slot) {
    localStorage.removeItem(`snowSurvival_${slot}`)
    saveUpdateSeq.value++
    addLog(`已删除存档：${slot}`, 'info')
  }

  function restartGame() {
    temperature.value = 80
    heat.value = 50
    wood.value = 10
    food.value = 5
    hide.value = 0
    tools.value = 0
    isDay.value = true
    dayCount.value = 1
    isBlizzard.value = false
    wallLevel.value = 0
    bedLevel.value = 0
    storageLevel.value = 0
    gameOver.value = false
    gameOverReason.value = ''
    actionLog.value = []

    stopTimers()
    startTimers()
    saveUpdateSeq.value++

    addLog('新游戏开始！祝你好运！', 'success')
  }

  function tryLoadAutoSave() {
    const saved = localStorage.getItem('snowSurvival_auto')
    if (!saved) return false
    try {
      const data = JSON.parse(saved)
      if (!data || typeof data.dayCount !== 'number') return false
    } catch (e) {
      return false
    }
    return loadGame('auto')
  }

  onMounted(() => {
    const hasAuto = tryLoadAutoSave()
    if (!hasAuto) {
      startTimers()
      addLog('欢迎来到雪地生存！白天收集资源，夜晚保持温暖。', 'info')
    }
  })

  onUnmounted(() => {
    stopTimers()
  })

  return {
    temperature,
    heat,
    wood,
    food,
    hide,
    tools,
    isDay,
    isNight,
    dayCount,
    isBlizzard,
    gameOver,
    gameOverReason,
    actionLog,
    isDanger,
    canMakeFire,
    canHunt,
    huntSuccessRate,
    wallLevel,
    bedLevel,
    storageLevel,
    blizzardDamageReduction,
    heatRetentionBonus,
    nightHeatRecovery,
    resourceBonus,
    canUpgradeShelter,
    getNextUpgradeCost,
    upgradeShelter,
    MAX_SHELTER_LEVEL,
    saveSlots,
    chopWood,
    hunt,
    makeTools,
    makeFire,
    eatFood,
    saveGame,
    loadGame,
    deleteSave,
    restartGame
  }
}
