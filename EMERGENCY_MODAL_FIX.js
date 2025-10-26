// ================================================================
// EMERGENCY MODAL FIX - Copy and paste into browser console
// Use this if the modal is still not appearing as an overlay
// ================================================================

console.log('🚨 EMERGENCY MODAL FIX - Initializing...');

// Function to fix the modal
function fixModalOverlay() {
  // Find the modal element
  const modal = document.querySelector('.modal[style*="1050"]') || 
                document.querySelector('div.modal[style*="z-index"]') ||
                document.querySelector('div.modal[style*="zIndex"]');
  
  if (!modal) {
    console.warn('⚠️ Modal not found. Please open the modal first, then run this script.');
    return false;
  }

  console.log('✅ Modal found:', modal);

  // Force modal overlay to top layer
  modal.style.cssText = `
    position: fixed !important;
    z-index: 99999 !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: rgba(0, 0, 0, 0.75) !important;
    backdrop-filter: blur(4px) !important;
    margin: 0 !important;
    padding: 0 !important;
  `;

  // Find and fix modal content
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    console.log('✅ Modal content found:', modalContent);
    
    modalContent.style.cssText = `
      position: relative !important;
      z-index: 100000 !important;
      width: 95vw !important;
      max-width: 95vw !important;
      min-width: 95vw !important;
      height: 95vh !important;
      max-height: 95vh !important;
      min-height: 95vh !important;
      margin: auto !important;
      display: flex !important;
      flex-direction: column !important;
      background: white !important;
      border-radius: 8px !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
    `;

    // Check for dark mode
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDarkMode) {
      console.log('🌙 Dark mode detected, applying dark styles...');
      modalContent.style.background = '#1e293b !important';
      
      // Fix all text colors in modal
      const allTextElements = modalContent.querySelectorAll('div, span, p, label, h1, h2, h3, h4, h5, h6');
      allTextElements.forEach(el => {
        if (!el.style.background || el.style.background === '') {
          el.style.color = '#f1f5f9 !important';
        }
      });
      console.log(`✅ Fixed ${allTextElements.length} text elements for dark mode`);
    }
  }

  // Fix modal body
  const modalBody = modal.querySelector('.modal-body');
  if (modalBody) {
    console.log('✅ Modal body found:', modalBody);
    
    modalBody.style.cssText = `
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 1.5rem !important;
      min-height: 0 !important;
      max-height: calc(95vh - 120px) !important;
    `;
  }

  // Fix parent containers
  const parentContainers = [
    '.dashboard-with-sidebar',
    '.dashboard-main',
    '.tab-content'
  ];

  parentContainers.forEach(selector => {
    const container = document.querySelector(selector);
    if (container) {
      container.style.position = 'relative !important';
      container.style.zIndex = 'auto !important';
      console.log(`✅ Fixed parent container: ${selector}`);
    }
  });

  console.log('🎉 Modal overlay fix applied successfully!');
  console.log('The modal should now appear as a fullscreen overlay.');
  return true;
}

// Run the fix immediately
const success = fixModalOverlay();

if (success) {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('✅ MODAL FIX APPLIED');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('If you need to apply the fix again:');
  console.log('1. Close the modal');
  console.log('2. Open the modal again');
  console.log('3. Run: fixModalOverlay()');
  console.log('');
  console.log('To auto-fix whenever modal opens:');
  console.log('Run: setupAutoFix()');
  console.log('');
} else {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('⚠️ MODAL NOT FOUND');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('To fix:');
  console.log('1. Click "Select Questions" button to open the modal');
  console.log('2. Run this script again');
  console.log('OR');
  console.log('3. Run: fixModalOverlay()');
  console.log('');
}

// Setup auto-fix on mutation
function setupAutoFix() {
  console.log('🔧 Setting up auto-fix for modal...');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.classList && node.classList.contains('modal')) {
          console.log('🔍 New modal detected, applying fix...');
          setTimeout(() => fixModalOverlay(), 100);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('✅ Auto-fix enabled! Modal will be fixed automatically when opened.');
  return observer;
}

// Make functions globally available
window.fixModalOverlay = fixModalOverlay;
window.setupAutoFix = setupAutoFix;

console.log('');
console.log('Available functions:');
console.log('- fixModalOverlay()  : Fix the modal manually');
console.log('- setupAutoFix()     : Auto-fix modal whenever it opens');
console.log('');
