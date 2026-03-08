import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ 
  plugins: [react()],
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg'],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/pages/')) {
            if (/AdminDashboard|MyAccount|LicenseSuccess|EMVProgram/.test(id)) return 'account';
            if (/Home|About|Contact|Licensing|OEM|Software|Hardware/.test(id)) return 'core';
            if (/PatentedTechnology|TechnologyBenefits|PowerQuality|NetworkStability|EnergyEfficiency|EquipmentProtection|ScalableImplementation|RealTimeMonitoring|ComplianceStandards|CostSavings|CoreECBSPatents|ControlSystems|HardwareImplementation|SoftwareAnalytics|ApplicationSpecific/.test(id)) return 'technology';
            if (/PrivacyPolicy|CopyrightNotice|LegalResources|PatentEnforcement|TrademarkLicensing|BrandProtection/.test(id)) return 'legal';
          }
        }
      },
      external: (id) => {
        if (id.endsWith('.svg')) {
          console.warn(`SVG file blocked: ${id}`);
          return true;
        }
        return false;
      }
    }
  }
})
