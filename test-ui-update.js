// 测试UI状态更新脚本
console.log('🔍 开始测试UI状态更新...');

// 模拟MQTT连接成功后的UI更新
function testUIUpdate() {
  console.log('📱 测试UI状态更新...');
  
  // 查找状态元素
  const statusElements = document.querySelectorAll('[class*="status"], [class*="connection"], [class*="connect"]');
  console.log('🔍 找到状态元素数量:', statusElements.length);
  
  statusElements.forEach((el, index) => {
    console.log(`📊 状态元素 ${index}:`, {
      textContent: el.textContent,
      className: el.className,
      tagName: el.tagName
    });
  });
  
  // 查找按钮
  const buttons = document.querySelectorAll('button');
  console.log('🔍 找到按钮数量:', buttons.length);
  
  buttons.forEach((btn, index) => {
    console.log(`🔘 按钮 ${index}:`, {
      textContent: btn.textContent,
      className: btn.className,
      tagName: btn.tagName
    });
  });
  
  // 尝试更新UI
  statusElements.forEach(el => {
    if (el.textContent && el.textContent.includes('Not Connected')) {
      console.log('✅ 更新状态为Connected');
      el.textContent = 'Connected';
      el.className = el.className.replace(/error|danger|warning/g, 'success');
    }
  });
  
  buttons.forEach(btn => {
    if (btn.textContent && btn.textContent.includes('Connect')) {
      console.log('✅ 更新按钮为Disconnect');
      btn.textContent = 'Disconnect';
      btn.className = btn.className.replace(/btn-primary|btn-success/g, 'btn-danger');
    }
  });
  
  console.log('✅ UI更新测试完成');
}

// 延迟执行测试
setTimeout(testUIUpdate, 2000);

console.log('🔍 UI更新测试脚本已加载');

