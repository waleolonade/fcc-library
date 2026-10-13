import { useState, useEffect } from 'react';

/**
 * Custom hook to detect viewport device type and provide responsive layout state.
 * Supports:
 * - Mobile: < 768px (iPhone, Android phones)
 * - Tablet: >= 768px and < 1024px (iPad, iPad Mini, Android tablets)
 * - Desktop: >= 1024px (Laptops, Desktops)
 * Also supports manual simulation override for testing all displays on a single device!
 */
export function useDeviceType() {
  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1200;
  });

  const [windowHeight, setWindowHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight;
    }
    return 800;
  });

  // Simulated device override ('auto', 'mobile', 'tablet', 'desktop')
  const [simulatedDevice, setSimulatedDevice] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fcc_simulated_device') || 'auto';
    }
    return 'auto';
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const changeDeviceMode = (mode) => {
    setSimulatedDevice(mode);
    try {
      localStorage.setItem('fcc_simulated_device', mode);
    } catch (e) {}
  };

  const detectedIsMobile = windowWidth < 768;
  const detectedIsTablet = windowWidth >= 768 && windowWidth < 1024;
  const detectedIsDesktop = windowWidth >= 1024;

  // Resolved device layout considering simulation override
  let effectiveDevice = 'desktop';
  if (simulatedDevice === 'mobile') {
    effectiveDevice = 'mobile';
  } else if (simulatedDevice === 'tablet') {
    effectiveDevice = 'tablet';
  } else if (simulatedDevice === 'desktop') {
    effectiveDevice = 'desktop';
  } else {
    // Auto detection
    if (detectedIsMobile) effectiveDevice = 'mobile';
    else if (detectedIsTablet) effectiveDevice = 'tablet';
    else effectiveDevice = 'desktop';
  }

  const isMobile = effectiveDevice === 'mobile';
  const isTablet = effectiveDevice === 'tablet';
  const isDesktop = effectiveDevice === 'desktop';

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return {
    width: windowWidth,
    height: windowHeight,
    isMobile,
    isTablet,
    isDesktop,
    device: effectiveDevice,
    simulatedDevice,
    changeDeviceMode,
    isTouch
  };
}
