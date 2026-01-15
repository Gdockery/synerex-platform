#!/usr/bin/env python3
"""
SYNEREX Field Data Collection Forms Generator
Generates PDF forms for field workers to collect data for each facility type.
Version 3.8
"""

import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from datetime import datetime

# Get the base directory
BASE_DIR = Path(__file__).parent.parent
STATIC_DIR = BASE_DIR / "static"
OUTPUT_DIR = Path(__file__).parent

# Logo path
LOGO_PATH = STATIC_DIR / "synerex_logo_transparent.png"

# Page dimensions
PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.75 * inch
CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN)

class PDFFormGenerator:
    def __init__(self, output_path, facility_type, facility_name):
        self.output_path = output_path
        self.facility_type = facility_type
        self.facility_name = facility_name
        self.styles = getSampleStyleSheet()
        self.setup_styles()
        
    def setup_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='FormTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#2c5aa0'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e3a5f'),
            spaceAfter=8,
            spaceBefore=12,
            fontName='Helvetica-Bold',
            backColor=colors.HexColor('#e3f2fd'),
            borderPadding=6
        ))
        
        self.styles.add(ParagraphStyle(
            name='FieldLabel',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.black,
            fontName='Helvetica-Bold',
            spaceAfter=2
        ))
        
        self.styles.add(ParagraphStyle(
            name='FieldValue',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.black,
            fontName='Helvetica',
            spaceAfter=8
        ))
        
        self.styles.add(ParagraphStyle(
            name='HelpText',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            fontName='Helvetica-Oblique',
            spaceAfter=4
        ))
        
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))

    def add_header_footer(self, canvas_obj, doc):
        """Add header with logo and footer to each page"""
        # Save state
        canvas_obj.saveState()
        
        # Header with logo
        if LOGO_PATH.exists():
            try:
                from PIL import Image as PILImage
                from reportlab.lib.utils import ImageReader
                # Open and resize logo
                pil_img = PILImage.open(str(LOGO_PATH))
                # Calculate size maintaining aspect ratio
                logo_width = 1.5 * inch
                aspect_ratio = pil_img.height / pil_img.width
                logo_height = logo_width * aspect_ratio
                if logo_height > 0.5 * inch:
                    logo_height = 0.5 * inch
                    logo_width = logo_height / aspect_ratio
                
                # Draw logo
                canvas_obj.drawImage(str(LOGO_PATH), MARGIN, PAGE_HEIGHT - 0.75*inch, 
                                   width=logo_width, height=logo_height, preserveAspectRatio=True)
            except Exception as e:
                # Fallback if PIL not available or error
                try:
                    canvas_obj.drawImage(str(LOGO_PATH), MARGIN, PAGE_HEIGHT - 0.75*inch, 
                                       width=1.5*inch, height=0.5*inch, preserveAspectRatio=True)
                except:
                    pass
        
        # Form title removed from header - logo stands alone
        # Title appears only on title page
        
        # Footer
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.setFillColor(colors.grey)
        footer_text = f"SYNEREX Field Data Collection Form - Version 3.8 - Page {canvas_obj.getPageNumber()}"
        canvas_obj.drawCentredString(PAGE_WIDTH / 2, 0.5*inch, footer_text)
        canvas_obj.drawCentredString(PAGE_WIDTH / 2, 0.35*inch, "Confidential - For Internal Use Only")
        
        # Restore state
        canvas_obj.restoreState()

    def create_field_row(self, label, before_field="", after_field="", help_text="", unit=""):
        """Create a table row for a form field"""
        if unit:
            label = f"{label} ({unit})"
        
        data = [
            [Paragraph(f"<b>{label}</b>", self.styles['FieldLabel']),
             Paragraph(before_field, self.styles['FieldValue']),
             Paragraph(after_field, self.styles['FieldValue'])]
        ]
        
        table = Table(data, colWidths=[2.5*inch, 2.25*inch, 2.25*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#f5f5f5')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEBELOW', (1, 0), (1, 0), 0, colors.white),  # Remove bottom line from before field value cell
            ('LINEBELOW', (2, 0), (2, 0), 0, colors.white),  # Remove bottom line from after field value cell
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        elements = [table]
        if help_text:
            elements.append(Paragraph(f"<i>{help_text}</i>", self.styles['HelpText']))
        
        return elements

    def create_single_field_row(self, label, field="", help_text="", unit=""):
        """Create a table row for a single field (no before/after)"""
        if unit:
            label = f"{label} ({unit})"
        
        data = [
            [Paragraph(f"<b>{label}</b>", self.styles['FieldLabel']),
             Paragraph(field, self.styles['FieldValue'])]
        ]
        
        table = Table(data, colWidths=[3.5*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#f5f5f5')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEBELOW', (1, 0), (1, 0), 0, colors.white),  # Remove bottom line from field value cell
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        elements = [table]
        if help_text:
            elements.append(Paragraph(f"<i>{help_text}</i>", self.styles['HelpText']))
        
        return elements

    def generate_form(self):
        """Generate the PDF form"""
        doc = SimpleDocTemplate(
            str(self.output_path),
            pagesize=letter,
            rightMargin=MARGIN,
            leftMargin=MARGIN,
            topMargin=1.0*inch,
            bottomMargin=0.75*inch
        )
        
        elements = []
        
        # Title page
        elements.append(Spacer(1, 0.5*inch))
        elements.append(Paragraph(self.facility_name, self.styles['FormTitle']))
        elements.append(Paragraph("Field Data Collection Form", self.styles['FormTitle']))
        elements.append(Spacer(1, 0.2*inch))
        elements.append(Paragraph(f"<i>Version 3.8 - {datetime.now().strftime('%B %Y')}</i>", self.styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph(
            "This form is designed for field workers to collect facility-specific data on-site. "
            "Complete all relevant sections and use this form as reference when entering data into the SYNEREX UI.",
            self.styles['Normal']
        ))
        elements.append(PageBreak())
        
        # Generate facility-specific content
        if self.facility_type == 'cold_storage':
            elements.extend(self.generate_cold_storage_form())
        elif self.facility_type == 'data_center':
            elements.extend(self.generate_data_center_form())
        elif self.facility_type == 'healthcare':
            elements.extend(self.generate_healthcare_form())
        elif self.facility_type == 'hospitality':
            elements.extend(self.generate_hospitality_form())
        elif self.facility_type == 'manufacturing':
            elements.extend(self.generate_manufacturing_form())
        elif self.facility_type == 'general':
            elements.extend(self.generate_general_form())
        
        # Build PDF
        doc.build(elements, onFirstPage=self.add_header_footer, onLaterPages=self.add_header_footer)
        print(f"Generated: {self.output_path}")

    def generate_common_sections(self):
        """Generate common sections for all facility types"""
        elements = []
        
        # Client Information Section (NEW - Added at the beginning)
        elements.append(Paragraph("1. CLIENT INFORMATION", self.styles['SectionHeader']))
        elements.append(Spacer(1, 0.1*inch))
        elements.append(Paragraph("<i>Enter client/company information for this project</i>", self.styles['Normal']))
        elements.append(Spacer(1, 0.15*inch))
        
        # Client/Company Basic Information
        elements.extend(self.create_single_field_row("Company Name", "", "Client or company name"))
        elements.extend(self.create_single_field_row("Company Address (Street)", "", "Street address"))
        elements.extend(self.create_single_field_row("City", "", "City name"))
        elements.extend(self.create_single_field_row("State/Province", "", "State or province abbreviation"))
        elements.extend(self.create_single_field_row("ZIP/Postal Code", "", "Postal code"))
        elements.extend(self.create_single_field_row("Country", "", "Country (if outside US)"))
        
        # Client Contact Information
        elements.append(Paragraph("<b>Primary Contact</b>", self.styles['FieldLabel']))
        elements.extend(self.create_single_field_row("Contact Name", "", "Primary contact person name"))
        elements.extend(self.create_single_field_row("Contact Email", "", "Contact email address"))
        elements.extend(self.create_single_field_row("Contact Phone", "", "Contact phone number"))
        elements.extend(self.create_single_field_row("Contact Mobile/Cell", "", "Mobile phone number (optional)"))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # Project Information Section (renumbered from 1 to 2)
        elements.append(Paragraph("2. PROJECT INFORMATION", self.styles['SectionHeader']))
        
        # Client/Company Information
        elements.extend(self.create_single_field_row("Client/Company Name", ""))
        elements.extend(self.create_single_field_row("Project Name/ID", "", "Project identifier or name"))
        elements.extend(self.create_single_field_row("Project Description", "", "Brief description of the project"))
        
        # Facility Location (where the facility is located)
        elements.append(Paragraph("<b>Facility Location</b>", self.styles['FieldLabel']))
        elements.extend(self.create_single_field_row("Facility Address (Street)", ""))
        elements.extend(self.create_single_field_row("City", ""))
        elements.extend(self.create_single_field_row("State/Province", ""))
        elements.extend(self.create_single_field_row("ZIP/Postal Code", ""))
        elements.extend(self.create_single_field_row("Country", "", "Country where facility is located"))
        
        # Project Location (where the project work is being performed - may differ from facility location)
        elements.append(Paragraph("<b>Project Location</b>", self.styles['FieldLabel']))
        elements.extend(self.create_single_field_row("Project Address (Street)", "", "Physical location where project work is performed (if different from facility)"))
        elements.extend(self.create_single_field_row("Project City", "", "City where project work is performed"))
        elements.extend(self.create_single_field_row("Project State/Province", "", "State/Province where project work is performed"))
        elements.extend(self.create_single_field_row("Project ZIP/Postal Code", "", "ZIP/Postal code for project location"))
        elements.extend(self.create_single_field_row("Project Country", "", "Country where project work is performed"))
        
        # Contact Information
        elements.append(Paragraph("<b>Primary Contact Information</b>", self.styles['FieldLabel']))
        elements.extend(self.create_single_field_row("Point of Contact Name", "", "Primary contact person name"))
        elements.extend(self.create_single_field_row("Contact Title/Role", "", "Job title or role of contact person"))
        elements.extend(self.create_single_field_row("Contact Phone", ""))
        elements.extend(self.create_single_field_row("Contact Email", ""))
        elements.extend(self.create_single_field_row("Contact Mobile/Cell", "", "Mobile phone number (optional)"))
        
        # Contact Location (where the contact person is located - may differ from facility/project)
        elements.append(Paragraph("<b>Contact Location</b>", self.styles['FieldLabel']))
        elements.extend(self.create_single_field_row("Contact Address (Street)", "", "Contact person's business address (if different from facility)"))
        elements.extend(self.create_single_field_row("Contact City", "", "City where contact person is located"))
        elements.extend(self.create_single_field_row("Contact State/Province", "", "State/Province where contact person is located"))
        elements.extend(self.create_single_field_row("Contact ZIP/Postal Code", "", "ZIP/Postal code for contact location"))
        elements.extend(self.create_single_field_row("Contact Country", "", "Country where contact person is located"))
        
        # Additional Project Information
        elements.append(Paragraph("<b>Additional Project Information</b>", self.styles['FieldLabel']))
        elements.extend(self.create_single_field_row("Project Manager Name", "", "Name of project manager"))
        elements.extend(self.create_single_field_row("Project Manager Email", "", "Email of project manager"))
        elements.extend(self.create_single_field_row("Project Manager Phone", "", "Phone of project manager"))
        elements.extend(self.create_single_field_row("Project Start Date", "", "Date when project work began"))
        elements.extend(self.create_single_field_row("Project End Date", "", "Expected or actual project completion date"))
        elements.extend(self.create_single_field_row("Project Date (Form Completion Date)", "", "Date this form is being completed"))
        
        # Secondary Contact (Optional)
        elements.append(Paragraph("<b>Secondary Contact (Optional)</b>", self.styles['FieldLabel']))
        elements.extend(self.create_single_field_row("Secondary Contact Name", "", "Alternative contact person"))
        elements.extend(self.create_single_field_row("Secondary Contact Title/Role", "", "Job title or role"))
        elements.extend(self.create_single_field_row("Secondary Contact Phone", "", "Phone number"))
        elements.extend(self.create_single_field_row("Secondary Contact Email", "", "Email address"))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # Test Parameters Section (renumbered from 2 to 3)
        elements.append(Paragraph("3. TEST PARAMETERS", self.styles['SectionHeader']))
        elements.extend(self.create_single_field_row("Test Type", "[ ] Power Quality  [ ] Energy Savings  [ ] Harmonic Analysis"))
        elements.extend(self.create_single_field_row("Circuit Name", ""))
        elements.extend(self.create_field_row("Test Period", "Before: ", "After: ", "Start and end dates"))
        elements.extend(self.create_single_field_row("Test Duration", "", "Auto-calculated from CSV data"))
        elements.extend(self.create_single_field_row("Meter Name", ""))
        elements.extend(self.create_single_field_row("Meter Specification", "[ ] Class 0.2  [ ] Class 0.5  [ ] Class 1.0  [ ] Class 2.0"))
        elements.extend(self.create_single_field_row("Interval Data", "[ ] 1-minute  [ ] 15-minute  [ ] Hourly"))
        elements.append(Spacer(1, 0.2*inch))
        
        # Weather Data Section (renumbered from 3 to 4)
        elements.append(Paragraph("4. WEATHER DATA", self.styles['SectionHeader']))
        elements.extend(self.create_field_row("Temperature", "Before:  deg F", "After:  deg F", "Average temperature during test period"))
        elements.extend(self.create_field_row("Humidity", "Before:  %", "After:  %", "Average relative humidity"))
        elements.extend(self.create_single_field_row("Weather Data Source", "[ ] Automatic API  [ ] Manual Entry"))
        elements.append(Spacer(1, 0.2*inch))
        
        # Billing Information Section (renumbered from 4 to 5)
        elements.append(Paragraph("5. BILLING INFORMATION", self.styles['SectionHeader']))
        elements.extend(self.create_single_field_row("Utility Company", ""))
        elements.extend(self.create_single_field_row("Account Number", ""))
        elements.extend(self.create_single_field_row("Energy Rate", " $/kWh", "Cost per kilowatt-hour"))
        elements.extend(self.create_single_field_row("Demand Rate", " $/kW-month", "Cost per kilowatt per month"))
        elements.append(Spacer(1, 0.2*inch))
        
        return elements

    def generate_cold_storage_form(self):
        """Generate Cold Storage facility form"""
        elements = self.generate_common_sections()
        
        # Cold Storage Facility Configuration Section (renumbered from 5 to 6)
        elements.append(Paragraph("6. COLD STORAGE FACILITY CONFIGURATION", self.styles['SectionHeader']))
        elements.append(Spacer(1, 0.1*inch))
        elements.append(Paragraph("<i>Enter product and storage information to calculate energy intensity metrics (kWh per unit of product)</i>", self.styles['Normal']))
        elements.append(Spacer(1, 0.15*inch))
        
        # Product Type
        elements.extend(self.create_single_field_row("Product Type", 
            "[ ] Meat (Beef, Pork, Poultry)  [ ] Seafood  [ ] Dairy Products  [ ] Produce (Fruits, Vegetables)  [ ] Frozen Foods  [ ] Pharmaceuticals  [ ] Other: ",
            "Type of product stored in the facility"))
        
        # Other Product Type Description (conditional - shown when "Other" is selected)
        elements.extend(self.create_single_field_row("Other Product Type Description (if Other selected)", 
            "", "Describe product type when 'Other' is selected"))
        
        # Product Weight Unit
        elements.extend(self.create_single_field_row("Product Weight Unit", 
            "[ ] Pounds (lbs)  [ ] Tons (US)  [ ] Kilograms (kg)  [ ] Metric Tons",
            "Unit of measurement for product weight"))
        
        # Product Weight - Before and After
        elements.extend(self.create_field_row("Product Weight", 
            "Before Period: ", "After Period: ", 
            "Total weight of product stored during baseline and measurement periods"))
        
        # Storage Capacity (with unit)
        elements.extend(self.create_single_field_row("Storage Capacity", 
            " [ ] lbs  [ ] tons  [ ] kg  [ ] metric tons", 
            "Maximum storage capacity of the facility"))
        
        # Storage Temperature Setpoint
        elements.extend(self.create_single_field_row("Storage Temperature Setpoint", 
            " °F", "Target storage temperature for the facility"))
        
        # Storage Utilization
        elements.extend(self.create_single_field_row("Storage Utilization", 
            " %", "Average percentage of storage capacity utilized (0-100%)"))
        
        # Storage Duration - Before and After
        elements.extend(self.create_field_row("Storage Duration", 
            "Before Period:  days", "After Period:  days", 
            "Average number of days product is stored during baseline and measurement periods"))
        
        # Product Turnover Rate
        elements.extend(self.create_single_field_row("Product Turnover Rate", 
            " times/year", "Number of times inventory is completely replaced per year"))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # Notes Section (renumbered from 6 to 7)
        elements.append(Paragraph("7. NOTES", self.styles['SectionHeader']))
        for i in range(8):
            elements.append(Paragraph("_" * 85, self.styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
        
        return elements

    def generate_data_center_form(self):
        """Generate Data Center/GPU facility form"""
        elements = self.generate_common_sections()
        
        # Data Center Specific Section (renumbered from 5 to 6)
        elements.append(Paragraph("6. DATA CENTER / GPU FACILITY DATA", self.styles['SectionHeader']))
        elements.extend(self.create_single_field_row("Facility Type", 
            "[ ] Traditional Data Center  [ ] GPU Facility  [ ] Hybrid  [ ] Colocation  [ ] Edge"))
        elements.extend(self.create_single_field_row("Facility Area", "_____ sqft", "Total facility floor area"))
        elements.extend(self.create_single_field_row("Number of Server Racks", "_____", "Total number of server racks"))
        elements.extend(self.create_single_field_row("Number of GPUs", "_____", "Total number of GPUs (if applicable)"))
        elements.extend(self.create_field_row("IT Equipment Power", "Before: _____ kW", "After: _____ kW", "IT equipment power consumption"))
        elements.extend(self.create_field_row("Cooling Power", "Before: _____ kW", "After: _____ kW", "Cooling system power consumption"))
        elements.extend(self.create_single_field_row("UPS Capacity", "_____ kVA", "Uninterruptible Power Supply capacity"))
        elements.extend(self.create_single_field_row("UPS Efficiency", "_____ %", "UPS efficiency percentage"))
        elements.extend(self.create_single_field_row("Lighting Power", "_____ kW", "Lighting system power"))
        elements.extend(self.create_single_field_row("Other Loads", "_____ kW", "Other facility loads"))
        elements.extend(self.create_single_field_row("Compute Capacity", "_____ teraflops", "Total compute capacity (if applicable)"))
        elements.extend(self.create_single_field_row("GPU Utilization", "_____ %", "Average GPU utilization percentage"))
        elements.extend(self.create_single_field_row("Workload Type", "[ ] Training  [ ] Inference  [ ] Mixed"))
        elements.append(Spacer(1, 0.2*inch))
        
        # Notes Section (renumbered from 6 to 7)
        elements.append(Paragraph("7. NOTES", self.styles['SectionHeader']))
        for i in range(8):
            elements.append(Paragraph("_" * 85, self.styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
        
        return elements

    def generate_healthcare_form(self):
        """Generate Healthcare facility form"""
        elements = self.generate_common_sections()
        
        # Healthcare Specific Section (renumbered from 5 to 6)
        elements.append(Paragraph("6. HEALTHCARE FACILITY DATA", self.styles['SectionHeader']))
        elements.extend(self.create_single_field_row("Facility Type", 
            "[ ] Hospital  [ ] Clinic  [ ] Medical Center  [ ] Surgical Center  [ ] Nursing Home  [ ] Other: ___________"))
        elements.extend(self.create_single_field_row("Facility Area", "_____ sqft", "Total facility floor area"))
        elements.extend(self.create_single_field_row("Number of Beds", "_____", "Total number of beds"))
        elements.extend(self.create_single_field_row("Number of Operating Rooms", "_____", "Total number of operating rooms"))
        elements.extend(self.create_field_row("Patient Days", "Before: _____", "After: _____", "Total patient days (patients x days)"))
        elements.extend(self.create_field_row("Average Occupancy Rate", "Before: _____ %", "After: _____ %", "Average occupancy percentage"))
        elements.extend(self.create_single_field_row("Medical Equipment Power (Imaging)", "_____ kW", "Imaging equipment power"))
        elements.extend(self.create_single_field_row("Medical Equipment Power (Lab)", "_____ kW", "Laboratory equipment power"))
        elements.extend(self.create_single_field_row("Medical Equipment Power (Surgical)", "_____ kW", "Surgical equipment power"))
        elements.extend(self.create_field_row("HVAC Power", "Before: _____ kW", "After: _____ kW", "HVAC system power consumption"))
        elements.extend(self.create_single_field_row("Ventilation Air Changes per Hour", "_____", "Air changes per hour"))
        elements.extend(self.create_single_field_row("Backup Generator Capacity", "_____ kVA", "Backup generator capacity"))
        elements.extend(self.create_single_field_row("UPS Capacity", "_____ kVA", "Uninterruptible Power Supply capacity"))
        elements.extend(self.create_single_field_row("Critical Load Power", "_____ kW", "Critical load power requirement"))
        elements.append(Spacer(1, 0.2*inch))
        
        # Notes Section (renumbered from 6 to 7)
        elements.append(Paragraph("7. NOTES", self.styles['SectionHeader']))
        for i in range(8):
            elements.append(Paragraph("_" * 85, self.styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
        
        return elements

    def generate_hospitality_form(self):
        """Generate Hospitality facility form"""
        elements = self.generate_common_sections()
        
        # Hospitality Specific Section (renumbered from 5 to 6)
        elements.append(Paragraph("6. HOSPITALITY FACILITY DATA", self.styles['SectionHeader']))
        elements.extend(self.create_single_field_row("Facility Type", 
            "[ ] Hotel (Full Service)  [ ] Hotel (Limited Service)  [ ] Resort  [ ] Restaurant  [ ] Banquet Hall  [ ] Casino  [ ] Other: ___________"))
        elements.extend(self.create_single_field_row("Facility Area", "_____ sqft", "Total facility floor area"))
        elements.extend(self.create_single_field_row("Number of Rooms", "_____", "Total number of rooms (if applicable)"))
        elements.extend(self.create_single_field_row("Number of Seats", "_____", "Total number of seats (for restaurants)"))
        elements.extend(self.create_field_row("Occupied Room-Nights", "Before: _____", "After: _____", "Total occupied room-nights (rooms x nights)"))
        elements.extend(self.create_field_row("Guest Count", "Before: _____", "After: _____", "Total number of guests"))
        elements.extend(self.create_field_row("Average Occupancy Rate", "Before: _____ %", "After: _____ %", "Average occupancy percentage"))
        elements.extend(self.create_field_row("Meals Served", "Before: _____", "After: _____", "Total meals served (for restaurants)"))
        elements.extend(self.create_field_row("Kitchen Equipment Power", "Before: _____ kW", "After: _____ kW", "Kitchen equipment power"))
        elements.extend(self.create_field_row("Laundry Power", "Before: _____ kW", "After: _____ kW", "Laundry equipment power"))
        elements.extend(self.create_field_row("Laundry Loads", "Before: _____", "After: _____", "Number of laundry loads"))
        elements.extend(self.create_single_field_row("Pool/Spa Power", "_____ kW", "Pool and spa equipment power"))
        elements.extend(self.create_single_field_row("Pool/Spa Area", "_____ sqft", "Pool and spa area"))
        elements.extend(self.create_single_field_row("Fitness Center Power", "_____ kW", "Fitness center equipment power"))
        elements.extend(self.create_single_field_row("Fitness Center Area", "_____ sqft", "Fitness center area"))
        elements.extend(self.create_field_row("HVAC Power", "Before: _____ kW", "After: _____ kW", "HVAC system power consumption"))
        elements.extend(self.create_single_field_row("Lighting Power", "_____ kW", "Lighting system power"))
        elements.extend(self.create_single_field_row("Elevator Power", "_____ kW", "Elevator system power"))
        elements.extend(self.create_single_field_row("Other Building Loads", "_____ kW", "Other building loads"))
        elements.extend(self.create_single_field_row("Peak Season Occupancy Rate", "_____ %", "Peak season occupancy"))
        elements.extend(self.create_single_field_row("Off-Season Occupancy Rate", "_____ %", "Off-season occupancy"))
        elements.append(Spacer(1, 0.2*inch))
        
        # Notes Section (renumbered from 6 to 7)
        elements.append(Paragraph("7. NOTES", self.styles['SectionHeader']))
        for i in range(8):
            elements.append(Paragraph("_" * 85, self.styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
        
        return elements

    def generate_manufacturing_form(self):
        """Generate Manufacturing & Industrial facility form"""
        elements = self.generate_common_sections()
        
        # Manufacturing Specific Section (renumbered from 5 to 6)
        elements.append(Paragraph("6. MANUFACTURING & INDUSTRIAL FACILITY DATA", self.styles['SectionHeader']))
        elements.extend(self.create_single_field_row("Facility Type", 
            "[ ] Manufacturing Plant  [ ] Assembly Plant  [ ] Processing Facility  [ ] Foundry  [ ] Chemical Processing  [ ] Food Processing  [ ] Textile  [ ] Automotive  [ ] Electronics  [ ] Pharmaceutical  [ ] Paper/Pulp  [ ] Other: ___________"))
        elements.extend(self.create_single_field_row("Facility Area", "_____ sqft", "Total facility floor area"))
        elements.extend(self.create_single_field_row("Number of Production Lines", "_____", "Total number of production lines"))
        elements.extend(self.create_single_field_row("Number of Machines/Equipment", "_____", "Total number of machines"))
        elements.extend(self.create_single_field_row("Operating Hours per Day", "_____ hours", "Average operating hours per day"))
        elements.extend(self.create_single_field_row("Number of Shifts per Day", "_____", "Number of production shifts"))
        elements.extend(self.create_field_row("Units Produced", "Before: _____", "After: _____", "Total units produced"))
        elements.extend(self.create_field_row("Machine Hours", "Before: _____ hours", "After: _____ hours", "Total machine operating hours"))
        elements.extend(self.create_single_field_row("Production Rate", "_____ units/hour", "Average production rate"))
        elements.extend(self.create_single_field_row("Product Type / Industry", "_________________________________"))
        elements.append(Spacer(1, 0.1*inch))
        
        # Compressed Air System
        elements.append(Paragraph("Compressed Air System", self.styles['FieldLabel']))
        elements.extend(self.create_single_field_row("Compressed Air Power", "_____ kW", "Total compressed air system power"))
        elements.extend(self.create_single_field_row("Compressed Air Flow", "_____ CFM", "Compressed air flow rate"))
        elements.extend(self.create_single_field_row("Compressed Air Pressure", "_____ psi", "Operating pressure"))
        elements.append(Spacer(1, 0.1*inch))
        
        # Motors and Process Equipment
        elements.extend(self.create_single_field_row("Total Motor Horsepower", "_____ HP", "Total installed motor horsepower"))
        elements.extend(self.create_field_row("Process Heating Power", "Before: _____ kW", "After: _____ kW", "Process heating equipment power"))
        elements.extend(self.create_single_field_row("Pump Power", "_____ kW", "Pump system power"))
        elements.extend(self.create_single_field_row("Welding Equipment Power", "_____ kW", "Welding equipment power"))
        elements.extend(self.create_single_field_row("Conveyor Systems Power", "_____ kW", "Conveyor system power"))
        elements.extend(self.create_single_field_row("Material Handling Power", "_____ kW", "Material handling equipment power"))
        elements.extend(self.create_single_field_row("Process Cooling Power", "_____ kW", "Process cooling equipment power"))
        elements.extend(self.create_single_field_row("Water Treatment Power", "_____ kW", "Water treatment system power"))
        elements.extend(self.create_single_field_row("Ventilation Power", "_____ kW", "Ventilation system power"))
        elements.extend(self.create_field_row("HVAC Power", "Before: _____ kW", "After: _____ kW", "HVAC system power"))
        elements.extend(self.create_single_field_row("Lighting Power", "_____ kW", "Lighting system power"))
        elements.extend(self.create_single_field_row("Other Process Loads", "_____ kW", "Other process loads"))
        elements.append(Spacer(1, 0.1*inch))
        
        # Power Quality and Demand
        elements.extend(self.create_field_row("Power Factor", "Before: _____", "After: _____", "Average power factor (0-1)"))
        elements.extend(self.create_field_row("Peak Demand", "Before: _____ kW", "After: _____ kW", "Peak electrical demand"))
        elements.extend(self.create_single_field_row("Demand Charge Rate", "_____ $/kW", "Utility demand charge rate"))
        elements.append(Spacer(1, 0.2*inch))
        
        # Notes Section (renumbered from 6 to 7)
        elements.append(Paragraph("7. NOTES", self.styles['SectionHeader']))
        for i in range(8):
            elements.append(Paragraph("_" * 85, self.styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
        
        return elements

    def generate_general_form(self):
        """Generate General Energy Analysis form with electrical and financial configuration"""
        elements = self.generate_common_sections()
        
        # Electrical Configuration Section (renumbered from 5 to 6)
        elements.append(Paragraph("6. ELECTRICAL CONFIGURATION", self.styles['SectionHeader']))
        elements.extend(self.create_single_field_row("Number of Phases", "[ ] 1 (Single Phase)  [ ] 3 (Three Phase)"))
        elements.extend(self.create_single_field_row("Nominal Voltage", "_____ V", "System nominal voltage (e.g., 480V, 240V)"))
        elements.extend(self.create_single_field_row("Voltage Type", "[ ] Line-to-Line (LL)  [ ] Line-to-Neutral (LN)"))
        elements.extend(self.create_single_field_row("Transformer kVA Rating", "_____ kVA", "Rated kVA for loss scaling calculations"))
        elements.extend(self.create_single_field_row("Load Loss at Rated Load", "_____ W", "Total load loss at rated kVA (copper + stray)"))
        elements.extend(self.create_single_field_row("Core Loss", "_____ W", "No-load core loss (constant)"))
        elements.extend(self.create_single_field_row("Stray Loss Fraction", "_____ %", "Percentage of load loss that is stray loss"))
        elements.append(Spacer(1, 0.2*inch))
        
        # Additional Billing Information (renumbered from 6 to 7)
        elements.append(Paragraph("7. ADDITIONAL BILLING & FINANCIAL INFORMATION", self.styles['SectionHeader']))
        elements.extend(self.create_single_field_row("Project Cost", "_____ $", "Total project installation cost"))
        elements.extend(self.create_single_field_row("Last Monthly Bill (Total Cost)", "_____ $", "Client's last monthly utility bill total"))
        elements.extend(self.create_single_field_row("Target Power Factor", "_____ (0-1)", "Target power factor for normalization (e.g., 0.95)"))
        elements.extend(self.create_single_field_row("Power Factor in Billing", "[ ] Included  [ ] NOT Included", "Check if PF penalties are in billing"))
        elements.extend(self.create_single_field_row("Discount Rate", "_____ %", "Discount rate for present value calculations (e.g., 3%)"))
        elements.extend(self.create_single_field_row("Escalation Rate", "_____ %", "Annual escalation rate for savings (e.g., 2%)"))
        elements.extend(self.create_single_field_row("Analysis Period", "_____ years", "Project analysis period in years (e.g., 15)"))
        elements.extend(self.create_single_field_row("Non-Coincident Peak Demand Rate", "_____ $/kW-month", "Non-coincident peak demand rate"))
        elements.extend(self.create_single_field_row("CP Demand Rate", "_____ $/kW-month", "Coincident peak demand rate"))
        elements.append(Spacer(1, 0.2*inch))
        
        # Equipment Description (renumbered from 7 to 8)
        elements.append(Paragraph("8. EQUIPMENT DESCRIPTION", self.styles['SectionHeader']))
        elements.extend(self.create_single_field_row("Equipment Description", "_________________________________", "Description of equipment being analyzed"))
        elements.extend(self.create_single_field_row("Circuit Name/ID", "_________________________________", "Circuit identifier or name"))
        elements.append(Spacer(1, 0.2*inch))
        
        # Notes Section (renumbered from 8 to 9)
        elements.append(Paragraph("9. NOTES", self.styles['SectionHeader']))
        for i in range(8):
            elements.append(Paragraph("_" * 85, self.styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
        
        return elements


def main():
    """Generate all field forms"""
    print("Generating SYNEREX Field Data Collection Forms...")
    print(f"Logo path: {LOGO_PATH}")
    print(f"Logo exists: {LOGO_PATH.exists()}")
    
    forms = [
        ('general', 'General Energy Analysis'),
        ('cold_storage', 'Cold Storage Facility'),
        ('data_center', 'Data Center / GPU Facility'),
        ('healthcare', 'Healthcare Facility'),
        ('hospitality', 'Hospitality Facility'),
        ('manufacturing', 'Manufacturing & Industrial Facility'),
    ]
    
    for facility_type, facility_name in forms:
        output_path = OUTPUT_DIR / f"{facility_type}_field_form.pdf"
        generator = PDFFormGenerator(output_path, facility_type, facility_name)
        generator.generate_form()
    
    print("\nAll field forms generated successfully!")
    print(f"Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

