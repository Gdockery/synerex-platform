# 📊 CSV Editor Guide for Synerex OneForm

## 🎯 Overview

For professional CSV editing and data manipulation, you'll need a proper CSV editor. The built-in web editor is suitable for basic tasks, but for complex data operations, we recommend using dedicated CSV editing software.

## 🛠️ Recommended CSV Editors

### 1. **Microsoft Excel** (Most Common)
- **Best for**: General users, basic to intermediate CSV editing
- **Features**: Familiar interface, formulas, charts, pivot tables
- **Installation**: Part of Microsoft Office suite
- **Cost**: Paid (subscription or one-time purchase)

### 2. **LibreOffice Calc** (Free Alternative)
- **Best for**: Free alternative to Excel, cross-platform
- **Features**: Full spreadsheet functionality, CSV import/export
- **Installation**: Download from [libreoffice.org](https://www.libreoffice.org/)
- **Cost**: Free and open-source

### 3. **CSVed** (Dedicated CSV Editor)
- **Best for**: Pure CSV editing, data cleaning
- **Features**: CSV-specific tools, data validation, find/replace
- **Installation**: Download from [csved.sjfrancke.nl](http://csved.sjfrancke.nl/)
- **Cost**: Free

### 4. **Notepad++** (Text Editor with CSV Plugin)
- **Best for**: Programmers, advanced users
- **Features**: Syntax highlighting, plugins, regex support
- **Installation**: Download from [notepad-plus-plus.org](https://notepad-plus-plus.org/)
- **Cost**: Free

### 5. **Visual Studio Code** (Code Editor)
- **Best for**: Developers, data analysts
- **Features**: Extensions, integrated terminal, Git support
- **Installation**: Download from [code.visualstudio.com](https://code.visualstudio.com/)
- **Cost**: Free

## 📥 Installation Instructions

### For Windows Users:

#### Option 1: LibreOffice Calc (Recommended Free Option)
```bash
# Download and install LibreOffice
# 1. Go to https://www.libreoffice.org/download/download/
# 2. Download LibreOffice for Windows
# 3. Run the installer
# 4. Open Calc for CSV editing
```

#### Option 2: CSVed (Dedicated CSV Editor)
```bash
# Download CSVed
# 1. Go to http://csved.sjfrancke.nl/
# 2. Download the Windows version
# 3. Extract and run CSVed.exe
```

### For Mac Users:

#### Option 1: LibreOffice Calc
```bash
# Install via Homebrew
brew install --cask libreoffice

# Or download from website
# https://www.libreoffice.org/download/download/
```

#### Option 2: Numbers (Built-in)
- Numbers comes pre-installed on Mac
- Good for basic CSV editing

### For Linux Users:

#### Option 1: LibreOffice Calc
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libreoffice-calc

# CentOS/RHEL
sudo yum install libreoffice-calc

# Fedora
sudo dnf install libreoffice-calc
```

## 🔧 CSV Editor Features Comparison

| Feature | Excel | LibreOffice | CSVed | Notepad++ | VS Code |
|---------|-------|-------------|-------|-----------|---------|
| **Cost** | Paid | Free | Free | Free | Free |
| **CSV Import/Export** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Data Validation** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Formulas** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Charts/Graphs** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Find/Replace** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Regex Support** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Large Files** | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| **Learning Curve** | Easy | Easy | Medium | Hard | Hard |

## 🎯 Recommended Workflow

### For Basic CSV Editing:
1. **Download** CSV file from Synerex OneForm
2. **Open** in LibreOffice Calc or Excel
3. **Edit** data as needed
4. **Save** as CSV format
5. **Upload** back to Synerex OneForm

### For Advanced Data Cleaning:
1. **Download** CSV file from Synerex OneForm
2. **Open** in CSVed for specialized CSV operations
3. **Clean** data using CSV-specific tools
4. **Validate** data integrity
5. **Save** and upload back to system

### For Programmers/Developers:
1. **Download** CSV file from Synerex OneForm
2. **Open** in VS Code with CSV extensions
3. **Edit** using advanced text editing features
4. **Use** integrated terminal for data processing
5. **Commit** changes to version control

## 🔗 Integration with Synerex OneForm

### Current Web Editor (Basic)
- ✅ **Available**: Built into the web interface
- ✅ **Features**: Basic editing, row selection, inline editing
- ⚠️ **Limitations**: No formulas, limited data validation, basic interface

### External Editor Integration
- 📥 **Download**: Click download button to get CSV file
- ✏️ **Edit**: Use your preferred CSV editor
- 📤 **Upload**: Replace file in Synerex OneForm
- 🔍 **Track**: All changes are tracked for audit compliance

## 🛡️ Data Integrity & Audit Trail

### ⚠️ IMPORTANT: CSV File Tracking & Monitoring

**All fingerprinted CSV files are automatically tracked by the SYNEREX system:**

#### Tracking Begins at Verification
- Once a CSV file is verified and receives a cryptographic fingerprint, **all subsequent access and interactions are automatically logged**
- Tracking cannot be disabled and is required for audit compliance

#### File Opening is Tracked
Every time any user opens a CSV file (for viewing or editing), the system records:
- **User Identity**: Name, email, user ID, role
- **Exact Timestamp**: Precise date and time of access
- **File Fingerprint**: Verification status at time of access
- **Access Type**: View, edit, download, or annotation
- **Network Information**: IP address and user agent

#### Cell-Level Tracking (New Feature)
When using the built-in CSV editor, individual cell interactions are tracked:
- **Cell Clicks**: Every cell click is logged with user attribution
- **Cell Annotations**: When you annotate a cell (click and provide explanation), the system records:
  - Which cell was clicked (row and column)
  - Your user identity
  - Your explanation text
  - Timestamp
  - Visual color coding for identification
- **Persistent Annotations**: Annotations are saved permanently and visible to all users

#### Complete Audit Trail
- All tracking information is permanently stored in the database
- Tracking data is included in audit packages for regulatory compliance
- Chain of custody documentation includes all file access events
- Cell annotations are linked to file fingerprints for complete traceability

### Privacy & Compliance Notice
**By using the SYNEREX system, users acknowledge that:**
- All interactions with fingerprinted CSV files are logged
- File access events are recorded for audit compliance
- Cell annotations are permanently stored and visible to authorized users
- Tracking cannot be disabled and is required for regulatory compliance

### When Using External Editors:
1. **Download** creates a fingerprint for the original file and logs the download event
2. **Edit** externally (tracked by your editor's history, but SYNEREX tracks the download/upload)
3. **Upload** creates a new fingerprint for the modified file and logs the upload event
4. **System** tracks who made changes, when, and why
5. **Audit** trail maintains complete chain of custody

### Best Practices:
- ✅ Always download from Synerex OneForm first
- ✅ Keep original files as backup
- ✅ Document reasons for changes
- ✅ Use consistent editing tools
- ✅ Validate data before uploading
- ✅ Understand that all file access is tracked for compliance

## 🚀 Quick Start Guide

### Step 1: Choose Your Editor
- **Beginners**: LibreOffice Calc (free) or Excel
- **CSV Specialists**: CSVed
- **Developers**: VS Code with CSV extensions

### Step 2: Download CSV File
1. Go to Synerex OneForm
2. Navigate to "Raw Files List"
3. Click the download button (📥) next to your file
4. Save to your computer

### Step 3: Edit the File
1. Open the downloaded CSV in your chosen editor
2. Make necessary changes
3. Save the file (keep CSV format)

### Step 4: Upload Modified File
1. Go back to Synerex OneForm
2. Use the upload interface to replace the file
3. Provide reason for changes
4. System will track the modification

## 📞 Support

### Need Help?
- **Web Editor Issues**: Check browser console for errors
- **External Editor Issues**: Consult editor documentation
- **Data Integrity Questions**: Review audit trail in system
- **Technical Support**: Contact system administrator

### Common Issues:
- **File Not Opening**: Check file format and encoding
- **Data Loss**: Always backup original files
- **Upload Errors**: Verify file format and size limits
- **Audit Trail**: Changes are automatically tracked

---

**Last Updated**: October 3, 2025  
**Version**: 1.0  
**Compatibility**: Windows, Mac, Linux
