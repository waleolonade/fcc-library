// Centralized FCC Ibadan School Logo Asset
import fccLogoImg from './fcc-logo.png';

export function getInstitutionalLogo() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('fcc_custom_logo');
    if (custom) return custom;
  }
  return fccLogoImg;
}

export const FCC_LOGO = typeof window !== 'undefined' && localStorage.getItem('fcc_custom_logo') 
  ? localStorage.getItem('fcc_custom_logo') 
  : fccLogoImg;

export default fccLogoImg;
