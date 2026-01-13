import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

const Home = lazy(()=>import("./pages/Home.jsx"));
const About = lazy(()=>import("./pages/About.jsx"));
const Software = lazy(()=>import("./pages/Software.jsx"));
const Hardware = lazy(()=>import("./pages/Hardware.jsx"));
const PatentedTechnology = lazy(()=>import("./pages/PatentedTechnology.jsx"));
const TechnologyBenefits = lazy(()=>import("./pages/TechnologyBenefits.jsx"));
const PowerQualityImprovement = lazy(()=>import("./pages/PowerQualityImprovement.jsx"));
const NetworkStability = lazy(()=>import("./pages/NetworkStability.jsx"));
const EnergyEfficiency = lazy(()=>import("./pages/EnergyEfficiency.jsx"));
const EquipmentProtection = lazy(()=>import("./pages/EquipmentProtection.jsx"));
const ScalableImplementation = lazy(()=>import("./pages/ScalableImplementation.jsx"));
const RealTimeMonitoring = lazy(()=>import("./pages/RealTimeMonitoring.jsx"));
const ComplianceStandards = lazy(()=>import("./pages/ComplianceStandards.jsx"));
const CostSavings = lazy(()=>import("./pages/CostSavings.jsx"));
const CoreECBSPatents = lazy(()=>import("./pages/CoreECBSPatents.jsx"));
const ControlSystems = lazy(()=>import("./pages/ControlSystems.jsx"));
const HardwareImplementation = lazy(()=>import("./pages/HardwareImplementation.jsx"));
const SoftwareAnalytics = lazy(()=>import("./pages/SoftwareAnalytics.jsx"));
const ApplicationSpecific = lazy(()=>import("./pages/ApplicationSpecific.jsx"));
const LicensingCommercialization = lazy(()=>import("./pages/LicensingCommercialization.jsx"));
const IntellectualPropertiesPortfolio = lazy(()=>import("./pages/IntellectualPropertiesPortfolio.jsx"));
const RealTimeAnalytics = lazy(()=>import("./pages/RealTimeAnalytics.jsx"));
const CustomDashboards = lazy(()=>import("./pages/CustomDashboards.jsx"));
const DataIntegration = lazy(()=>import("./pages/DataIntegration.jsx"));
const DeploymentOptions = lazy(()=>import("./pages/DeploymentOptions.jsx"));
const Manufacturing = lazy(()=>import("./pages/Manufacturing.jsx"));
const ECBSRadioControl = lazy(()=>import("./pages/ECBSRadioControl.jsx"));
const PowerFilteringEquipment = lazy(()=>import("./pages/PowerFilteringEquipment.jsx"));
const SoftwareControlsSensors = lazy(()=>import("./pages/SoftwareControlsSensors.jsx"));
const OEMHybridDesign = lazy(()=>import("./pages/OEMHybridDesign.jsx"));
const SynerexPQMonitoring = lazy(()=>import("./pages/SynerexPQMonitoring.jsx"));
const PatentTechnologyLicensing = lazy(()=>import("./pages/PatentTechnologyLicensing.jsx"));
const CopyrightSoftwareLicensing = lazy(()=>import("./pages/CopyrightSoftwareLicensing.jsx"));
const OEMODMEquipmentLicensing = lazy(()=>import("./pages/OEMODMEquipmentLicensing.jsx"));
const CustomEngineeringDesignLicensing = lazy(()=>import("./pages/CustomEngineeringDesignLicensing.jsx"));
const TrademarkLicensing = lazy(()=>import("./pages/TrademarkLicensing.jsx"));
const BrandAssetLicensing = lazy(()=>import("./pages/BrandAssetLicensing.jsx"));
const QualityControlStandards = lazy(()=>import("./pages/QualityControlStandards.jsx"));
const TerritorialRights = lazy(()=>import("./pages/TerritorialRights.jsx"));
const ProductCoBranding = lazy(()=>import("./pages/ProductCoBranding.jsx"));
const MarketingAuthorization = lazy(()=>import("./pages/MarketingAuthorization.jsx"));
const BrandProtection = lazy(()=>import("./pages/BrandProtection.jsx"));
const FieldOfUseFlexibility = lazy(()=>import("./pages/FieldOfUseFlexibility.jsx"));
const TechnologyTransferSupport = lazy(()=>import("./pages/TechnologyTransferSupport.jsx"));
const LicensingModels = lazy(()=>import("./pages/LicensingModels.jsx"));
const PatentEnforcement = lazy(()=>import("./pages/PatentEnforcement.jsx"));
const StrategicPartnerships = lazy(()=>import("./pages/StrategicPartnerships.jsx"));
const PrivacyPolicy = lazy(()=>import("./pages/PrivacyPolicy.jsx"));
const CopyrightNotice = lazy(()=>import("./pages/CopyrightNotice.jsx"));
const Licensing = lazy(()=>import("./pages/Licensing.jsx"));
const OEM = lazy(()=>import("./pages/OEM.jsx"));
const CustomEngineering = lazy(()=>import("./pages/CustomEngineering.jsx"));
const Trademarks = lazy(()=>import("./pages/Trademarks.jsx"));
const LegalResources = lazy(()=>import("./pages/LegalResources.jsx"));
const DownloadCenter = lazy(()=>import("./pages/DownloadCenter.jsx"));
const Contact = lazy(()=>import("./pages/Contact.jsx"));
const ThankYou = lazy(()=>import("./pages/ThankYou.jsx"));
const LicenseSuccess = lazy(()=>import("./pages/LicenseSuccess.jsx"));
const MyAccount = lazy(()=>import("./pages/MyAccount.jsx"));
const ComprehensiveEnergySavingsTesting = lazy(()=>import("./pages/ComprehensiveEnergySavingsTesting.jsx"));
const EMVProgram = lazy(()=>import("./pages/EMVProgram.jsx"));
const AdminDashboard = lazy(()=>import("./pages/AdminDashboard.jsx"));

export default function App(){
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Header />
      <Suspense fallback={<div className="p-12 text-center text-gray-300">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/software" element={<Software />} />
          <Route path="/hardware" element={<Hardware />} />
          <Route path="/patented-technology" element={<PatentedTechnology />} />
          <Route path="/technology-benefits" element={<TechnologyBenefits />} />
          <Route path="/power-quality-improvement" element={<PowerQualityImprovement />} />
          <Route path="/network-stability" element={<NetworkStability />} />
          <Route path="/energy-efficiency" element={<EnergyEfficiency />} />
          <Route path="/equipment-protection" element={<EquipmentProtection />} />
          <Route path="/scalable-implementation" element={<ScalableImplementation />} />
          <Route path="/real-time-monitoring" element={<RealTimeMonitoring />} />
          <Route path="/compliance-standards" element={<ComplianceStandards />} />
          <Route path="/cost-savings" element={<CostSavings />} />
          <Route path="/core-ecbs-patents" element={<CoreECBSPatents />} />
          <Route path="/control-systems" element={<ControlSystems />} />
          <Route path="/hardware-implementation" element={<HardwareImplementation />} />
          <Route path="/software-analytics" element={<SoftwareAnalytics />} />
          <Route path="/application-specific" element={<ApplicationSpecific />} />
          <Route path="/licensing-commercialization" element={<LicensingCommercialization />} />
          <Route path="/intellectual-properties-portfolio" element={<IntellectualPropertiesPortfolio />} />
          <Route path="/real-time-analytics" element={<RealTimeAnalytics />} />
          <Route path="/custom-dashboards" element={<CustomDashboards />} />
          <Route path="/data-integration" element={<DataIntegration />} />
          <Route path="/deployment-options" element={<DeploymentOptions />} />
          <Route path="/manufacturing" element={<Manufacturing />} />
          <Route path="/ecbs-radio-control" element={<ECBSRadioControl />} />
          <Route path="/power-filtering-equipment" element={<PowerFilteringEquipment />} />
          <Route path="/software-controls-sensors" element={<SoftwareControlsSensors />} />
          <Route path="/oem-hybrid-design" element={<OEMHybridDesign />} />
          <Route path="/synerex-pq-monitoring" element={<SynerexPQMonitoring />} />
          <Route path="/patent-technology-licensing" element={<PatentTechnologyLicensing />} />
          <Route path="/copyright-software-licensing" element={<CopyrightSoftwareLicensing />} />
          <Route path="/oem-odm-equipment-licensing" element={<OEMODMEquipmentLicensing />} />
          <Route path="/custom-engineering-design-licensing" element={<CustomEngineeringDesignLicensing />} />
          <Route path="/trademark-licensing" element={<TrademarkLicensing />} />
          <Route path="/brand-asset-licensing" element={<BrandAssetLicensing />} />
          <Route path="/quality-control-standards" element={<QualityControlStandards />} />
          <Route path="/territorial-rights" element={<TerritorialRights />} />
          <Route path="/product-co-branding" element={<ProductCoBranding />} />
          <Route path="/marketing-authorization" element={<MarketingAuthorization />} />
          <Route path="/brand-protection" element={<BrandProtection />} />
          <Route path="/field-of-use-flexibility" element={<FieldOfUseFlexibility />} />
          <Route path="/technology-transfer-support" element={<TechnologyTransferSupport />} />
          <Route path="/licensing-models" element={<LicensingModels />} />
          <Route path="/patent-enforcement" element={<PatentEnforcement />} />
          <Route path="/strategic-partnerships" element={<StrategicPartnerships />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/copyright-notice" element={<CopyrightNotice />} />
          <Route path="/licensing" element={<Licensing />} />
          <Route path="/oem" element={<OEM />} />
          <Route path="/custom-engineering" element={<CustomEngineering />} />
          <Route path="/trademarks" element={<Trademarks />} />
          <Route path="/legal-resources" element={<LegalResources />} />
          <Route path="/downloads" element={<DownloadCenter />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/license-success" element={<LicenseSuccess />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/comprehensive-energy-savings-testing" element={<ComprehensiveEnergySavingsTesting />} />
          <Route path="/emv-program" element={<EMVProgram />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
      <Footer />
    </div>
  );
}