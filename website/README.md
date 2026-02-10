# Synerex IP Website

A comprehensive React-based website showcasing Synerex's Electrical Current Balancing System (ECBS) technology, featuring 50+ detailed pages covering licensing opportunities, partnership programs, technical documentation, and advanced backend services including DocuSign integration, PDF generation, and automated email systems.

## 🎯 Development with Cursor

This project is optimized for development with [Cursor](https://cursor.sh/), an AI-powered code editor. Cursor provides excellent support for React, TypeScript, and modern web development.

### Setting up on Windows with Cursor

1. **Install Cursor:**
   - Download Cursor from [cursor.sh](https://cursor.sh/)
   - Install the application following the Windows installer

2. **Open Documents directory in Cursor:**
   - Launch Cursor
   - Use `File > Open Folder` and select your Documents directory
   - Or use the command line: `cursor Documents` from your user folder

3. **Use this AI prompt to set up the environment:**
   
   Copy and paste this prompt into Cursor's AI chat (`Ctrl+L`):
   
   ```
   Please help me set up the Synerex IP website project. I need you to:
   
   1. Close the current Documents directory
   2. Clone the repository from https://github.com/Rcowart/synerex-website.git into the Documents directory
   3. Open the synerex-website project directory in Cursor
   4. Read the project README.md file to understand how things are done in this project
   5. Check if Node.js is installed and install it if needed (download from nodejs.org if required)
   6. Install all project dependencies using npm install
   7. Start the development server with npm run dev
  8. Verify the site is running on the URL in `website/.env` (`VITE_WEBSITE_FRONTEND_URL`)
   9. Show me any errors or issues that need to be resolved
   
   IMPORTANT: When making any changes to this codebase, always perform a depth-first analysis:
   - Read the ENTIRE file you're modifying, not just snippets
   - Understand the complete styling structure and CSS cascade
   - Analyze how changes will affect ALL related components and pages
   - Consider the impact on both light and dark modes
   - Test changes across the entire application, not just the specific area
   - Follow the established patterns and conventions in the codebase
   
   Please guide me through each step and let me know when everything is ready!
   ```

4. **Follow the AI's guidance** - Cursor will handle everything automatically!

### Quick Commands After Setup

Once your project is running, you can use these convenient commands:

- **Commit changes**: `npm run commit` - Automatically adds, commits with timestamp, and tags your changes
- **Restart server (Mac)**: `npm run restart:mac` - Kills the server and restarts it
- **Restart server (Windows)**: `npm run restart:win` - Kills the server and restarts it

### Cursor Features for This Project

- **AI Code Completion**: Cursor's AI helps with React component development
- **Intelligent Suggestions**: Get context-aware suggestions for Tailwind CSS classes
- **Code Generation**: Use Cursor's AI to generate components, forms, and styling
- **Error Detection**: Real-time error detection and fixes
- **Git Integration**: Built-in Git support for version control
- **Terminal Integration**: Built-in terminal for running npm commands

### Cursor Tips

- Use `Ctrl+Shift+P` to open the command palette
- Use `Ctrl+` (backtick) to open the integrated terminal
- Use `Ctrl+Shift+E` to open the file explorer
- Use AI chat (`Ctrl+L`) to ask questions about the codebase
- Use `Ctrl+K` for inline AI editing

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to the URL in `website/.env` (`VITE_WEBSITE_FRONTEND_URL`)

### Build for Production
```bash
npm run build
npm run preview  # Preview the production build
```

## 🏗️ Project Structure

```
synerex-ip-website/
├── public/
│   ├── docs/                    # Protected PDF documents
│   └── images/                  # Logo and graphics
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Header.jsx          # Navigation header
│   │   ├── Footer.jsx          # Site footer
│   │   ├── Hero.jsx            # Hero section component
│   │   ├── InquiryForm.jsx     # Contact/inquiry forms
│   │   ├── NDAModal.jsx        # NDA request modal
│   │   ├── ProtectedDownload.jsx # Password-protected downloads
│   │   ├── DocCard.jsx         # Document card component
│   │   └── LicenseSeal.jsx     # License seal component
│   ├── pages/                   # 50+ Route components
│   │   ├── Home.jsx            # Landing page
│   │   ├── About.jsx           # Company information
│   │   ├── Software.jsx        # Software products
│   │   ├── Hardware.jsx        # Hardware products
│   │   ├── PatentedTechnology.jsx # Core technology overview
│   │   ├── TechnologyBenefits.jsx # Technology benefits
│   │   ├── PowerQualityImprovement.jsx # PQ improvement details
│   │   ├── NetworkStability.jsx # Network stability features
│   │   ├── EnergyEfficiency.jsx # Energy efficiency benefits
│   │   ├── EquipmentProtection.jsx # Equipment protection
│   │   ├── ScalableImplementation.jsx # Scalability features
│   │   ├── RealTimeMonitoring.jsx # Real-time monitoring
│   │   ├── ComplianceStandards.jsx # Compliance information
│   │   ├── CostSavings.jsx     # Cost savings analysis
│   │   ├── CoreECBSPatents.jsx # Core patent information
│   │   ├── ControlSystems.jsx  # Control systems details
│   │   ├── HardwareImplementation.jsx # Hardware implementation
│   │   ├── SoftwareAnalytics.jsx # Software analytics
│   │   ├── ApplicationSpecific.jsx # Application-specific solutions
│   │   ├── LicensingCommercialization.jsx # Licensing overview
│   │   ├── IntellectualPropertiesPortfolio.jsx # IP portfolio
│   │   ├── RealTimeAnalytics.jsx # Real-time analytics
│   │   ├── CustomDashboards.jsx # Custom dashboard features
│   │   ├── DataIntegration.jsx # Data integration capabilities
│   │   ├── DeploymentOptions.jsx # Deployment options
│   │   ├── Manufacturing.jsx   # Manufacturing capabilities
│   │   ├── ECBSRadioControl.jsx # Radio control features
│   │   ├── PowerFilteringEquipment.jsx # Power filtering
│   │   ├── SoftwareControlsSensors.jsx # Software controls
│   │   ├── OEMHybridDesign.jsx # OEM hybrid design
│   │   ├── SynerexPQMonitoring.jsx # PQ monitoring
│   │   ├── PatentTechnologyLicensing.jsx # Patent licensing
│   │   ├── CopyrightSoftwareLicensing.jsx # Software licensing
│   │   ├── OEMODMEquipmentLicensing.jsx # Equipment licensing
│   │   ├── CustomEngineeringDesignLicensing.jsx # Custom licensing
│   │   ├── TrademarkLicensing.jsx # Trademark licensing
│   │   ├── BrandAssetLicensing.jsx # Brand asset licensing
│   │   ├── QualityControlStandards.jsx # Quality standards
│   │   ├── TerritorialRights.jsx # Territorial rights
│   │   ├── ProductCoBranding.jsx # Co-branding options
│   │   ├── MarketingAuthorization.jsx # Marketing authorization
│   │   ├── BrandProtection.jsx # Brand protection
│   │   ├── FieldOfUseFlexibility.jsx # Field of use flexibility
│   │   ├── TechnologyTransferSupport.jsx # Technology transfer
│   │   ├── LicensingModels.jsx # Licensing models
│   │   ├── PatentEnforcement.jsx # Patent enforcement
│   │   ├── StrategicPartnerships.jsx # Strategic partnerships
│   │   ├── PrivacyPolicy.jsx   # Privacy policy
│   │   ├── CopyrightNotice.jsx # Copyright notice
│   │   ├── Licensing.jsx       # Main licensing page
│   │   ├── OEM.jsx             # OEM/ODM partnerships
│   │   ├── CustomEngineering.jsx # Custom engineering services
│   │   ├── Trademarks.jsx      # Trademark information
│   │   ├── Patents.jsx         # Patent portfolio
│   │   ├── LegalResources.jsx  # Legal documentation
│   │   ├── DownloadCenter.jsx  # Protected downloads
│   │   ├── Contact.jsx         # Contact page
│   │   ├── ThankYou.jsx        # Thank you page
│   │   └── ComprehensiveEnergySavingsTesting.jsx # Energy testing
│   ├── App.jsx                 # Main app component with routing
│   ├── main.jsx               # App entry point
│   └── styles.css             # Global styles (Tailwind)
├── backend/                    # Backend services
│   ├── services/              # Backend service modules
│   │   ├── docusignService.js # DocuSign integration
│   │   ├── emailService.js    # Email notification system
│   │   └── pdfService.js      # PDF generation service
│   ├── server.js              # Express server
│   ├── package.json           # Backend dependencies
│   └── env.example            # Environment configuration
├── index.html                  # HTML template
├── vite.config.js             # Vite configuration
├── tailwind.config.cjs        # Tailwind CSS configuration
└── postcss.config.cjs         # PostCSS configuration
```

## 🎯 Key Features

### 1. **Comprehensive Multi-Page Architecture (50+ Pages)**
- **Core Technology Pages**: Detailed ECBS technology documentation
- **Hardware & Software**: Complete product portfolio
- **Licensing Ecosystem**: Comprehensive licensing options and models
- **OEM/ODM Programs**: Partnership and manufacturing details
- **Custom Engineering**: Bespoke solutions and services
- **Legal Resources**: Patents, trademarks, and legal documentation
- **Download Center**: Protected document access
- **Contact & Support**: Inquiry forms and contact information

### 2. **Advanced Backend Services**
- **DocuSign Integration**: Automated NDA creation and management
- **PDF Generation**: Dynamic SOW document creation
- **Email Notification System**: Multi-template email automation
- **Contact Form Processing**: UTM tracking and lead management
- **SOW Submission System**: Complete statement of work workflow

### 3. **Protected Downloads & Document Management**
- Password-protected PDF access
- Demo documents for partners
- Engineering briefs and templates
- NDA samples and SOW templates
- Automated document generation

### 4. **Lead Generation & CRM Integration**
- Inquiry forms with UTM tracking
- NDA request system with DocuSign
- Contact form with topic categorization
- SOW submission and processing
- Automated email confirmations
- Thank you page for conversions

### 5. **Professional B2B Presentation**
- Mobile-first responsive design
- Dark mode support
- Modern UI with Tailwind CSS
- Smooth animations and transitions
- Comprehensive technical documentation
- Professional licensing presentation

## 🔧 Technical Stack

### Frontend
- **Framework**: React 18 with hooks
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: SVG-based
- **Forms**: Native HTML forms with React state

### Backend
- **Runtime**: Node.js with Express
- **Authentication**: DocuSign JWT integration
- **Email**: Nodemailer with SMTP
- **PDF Generation**: Puppeteer
- **Security**: Helmet.js, CORS
- **Logging**: Morgan HTTP logger
- **Environment**: dotenv configuration

## 🔧 Backend Services

### DocuSign Integration (`/api/docusign/createNDA`)
- **JWT Authentication**: Secure DocuSign API access
- **NDA Creation**: Automated mutual NDA generation
- **Envelope Management**: Document signing workflow
- **Status Tracking**: Real-time envelope status updates

### Email Services
- **Contact Form Processing**: Automated inquiry handling
- **SOW Notifications**: Statement of work email alerts
- **Confirmation Emails**: Automated user confirmations
- **Multi-template System**: Professional email templates

### PDF Generation
- **SOW Documents**: Dynamic statement of work creation
- **Template System**: Customizable document templates
- **Puppeteer Integration**: High-quality PDF generation
- **Email Attachments**: Automated PDF delivery

### API Endpoints
- `POST /api/docusign/createNDA` - NDA creation
- `POST /api/contact` - Contact form processing
- `POST /submit-sow` - SOW submission with PDF
- `GET /health` - Server health check

## 📱 Pages Overview

### Core Technology Pages
- **Home (`/`)**: Hero section with ECBS introduction
- **Patented Technology (`/patented-technology`)**: Core ECBS overview
- **Technology Benefits (`/technology-benefits`)**: Key advantages
- **Power Quality Improvement (`/power-quality-improvement`)**: PQ details
- **Network Stability (`/network-stability`)**: Stability features
- **Energy Efficiency (`/energy-efficiency`)**: Efficiency benefits
- **Equipment Protection (`/equipment-protection`)**: Protection features

### Product Pages
- **Hardware (`/hardware`)**: Hardware product details
- **Software (`/software`)**: Power Analysis™ software
- **Real-time Analytics (`/real-time-analytics`)**: Analytics features
- **Custom Dashboards (`/custom-dashboards`)**: Dashboard capabilities
- **Data Integration (`/data-integration`)**: Integration options

### Licensing Ecosystem
- **Licensing (`/licensing`)**: Main licensing overview
- **Patent Technology Licensing (`/patent-technology-licensing`)**: Patent licensing
- **Copyright Software Licensing (`/copyright-software-licensing`)**: Software licensing
- **OEM/ODM Equipment Licensing (`/oem-odm-equipment-licensing`)**: Equipment licensing
- **Trademark Licensing (`/trademark-licensing`)**: Trademark licensing
- **Brand Asset Licensing (`/brand-asset-licensing`)**: Brand licensing

### Partnership & Services
- **OEM (`/oem`)**: OEM/ODM partnership programs
- **Custom Engineering (`/custom-engineering`)**: Bespoke services
- **Manufacturing (`/manufacturing`)**: Manufacturing capabilities
- **Strategic Partnerships (`/strategic-partnerships`)**: Partnership models

### Legal & Compliance
- **Legal Resources (`/legal-resources`)**: Legal documentation
- **Patents (`/patents`)**: Patent portfolio
- **Trademarks (`/trademarks`)**: Trademark information
- **Brand Protection (`/brand-protection`)**: Brand protection
- **Quality Control Standards (`/quality-control-standards`)**: Quality standards

### Support & Resources
- **Download Center (`/downloads`)**: Protected document access
- **Contact (`/contact`)**: Inquiry forms with UTM tracking
- **Thank You (`/thank-you`)**: Conversion confirmation
- **Privacy Policy (`/privacy-policy`)**: Privacy information

## 🎨 Styling & Design

- **Framework**: Tailwind CSS
- **Theme**: Professional, clean, modern
- **Colors**: Indigo primary, gray neutrals
- **Typography**: System fonts with proper hierarchy
- **Layout**: Responsive grid system
- **Components**: Reusable, consistent design

## 🔐 Security Features

- **Protected Downloads**: Password-based access control
- **Form Validation**: Client-side validation
- **UTM Tracking**: Marketing attribution
- **Error Handling**: Graceful error states

## 🚀 Deployment

### Frontend Deployment
The frontend is built as a static site and can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

**Build command**: `npm run build`  
**Output directory**: `dist/`

### Backend Deployment
The backend requires a Node.js environment with:
- Express server on port 3001
- DocuSign API credentials
- SMTP email configuration
- Environment variables setup

**Deployment options**:
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run
- VPS with PM2 process management

**Environment setup**:
```bash
cd backend
npm install
cp env.example .env
# Configure .env with your credentials
npm start
```

## 📊 Analytics & Tracking

- UTM parameter tracking for marketing attribution
- Form submission tracking
- Download access logging
- Contact form analytics

## 🔧 Development

### Frontend Development
**Available Scripts**:
- `npm run dev` - Start development server (port 5180)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run commit` - Git add, commit with timestamp, and create version tag
- `npm run restart:mac` - Kill server process and restart (Mac/Linux)
- `npm run restart:win` - Kill server process and restart (Windows)

### Backend Development
**Available Scripts**:
- `npm run dev` - Start backend server with nodemon (port 3001)
- `npm start` - Start production server
- `npm run setup` - Initialize environment configuration

**Development Setup**:
```bash
# Frontend
npm install
npm run dev

# Backend (in separate terminal)
cd backend
npm install
npm run setup  # Creates .env file
npm run dev
```

### Code Style
- ESLint configuration included
- React best practices
- Consistent component structure
- Proper prop handling
- Express.js best practices
- Environment variable management

## 📝 Content Management

The site uses static content with:
- Hardcoded text content
- PDF documents in `/public/docs/`
- Images in `/public/images/`
- No CMS integration (static site)

## 🎯 Business Purpose

This comprehensive website serves as:
- **Lead Generation Hub**: Advanced inquiry capture with UTM tracking and automated follow-up
- **Technology Showcase**: Detailed ECBS technology documentation across 50+ pages
- **Licensing Platform**: Complete IP licensing ecosystem with multiple models
- **Partnership Portal**: OEM/ODM programs with manufacturing capabilities
- **Document Management**: Protected downloads with automated generation
- **Professional B2B Presence**: Enterprise-grade presentation for Synerex
- **Automated Workflows**: DocuSign integration, PDF generation, and email automation

## 🔄 Future Enhancements

Potential improvements:
- **CMS Integration**: Content management system for easier updates
- **User Authentication**: Customer portal with account management
- **Advanced Analytics**: Enhanced tracking and reporting
- **Multi-language Support**: International market expansion
- **Blog/News Section**: Content marketing capabilities
- **API Documentation**: Developer resources for integrations
- **Mobile App**: Companion mobile application
- **CRM Integration**: Direct integration with customer relationship management
- **Advanced Reporting**: Business intelligence and analytics dashboard
