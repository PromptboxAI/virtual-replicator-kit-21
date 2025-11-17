import { useEffect } from 'react';

/**
 * Hook to hide Shadow DOM wallet components during their slide-in animation
 * to prevent layout shifts and footer movement on page load.
 * 
 * Since Shadow DOM creates an encapsulated style boundary, we can't use
 * regular CSS to disable animations. Instead, we hide the components
 * during the animation period.
 */
export const useHideShadowDOMAnimations = () => {
  useEffect(() => {
    // Create a style element to hide wallet components during animation
    const style = document.createElement('style');
    style.id = 'shadow-dom-animation-fix';
    style.textContent = `
      wui-card,
      w3m-modal,
      [class*="w3m-"],
      [class*="wui-"] {
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.1s ease-in !important;
      }
      
      wui-card.ready,
      w3m-modal.ready,
      [class*="w3m-"].ready,
      [class*="wui-"].ready {
        opacity: 1 !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);

    // Show components after animation period (500ms based on session replay data)
    const timer = setTimeout(() => {
      const walletElements = document.querySelectorAll(
        'wui-card, w3m-modal, [class*="w3m-"], [class*="wui-"]'
      );
      walletElements.forEach(el => el.classList.add('ready'));
    }, 600);

    return () => {
      clearTimeout(timer);
      const existingStyle = document.getElementById('shadow-dom-animation-fix');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
};
