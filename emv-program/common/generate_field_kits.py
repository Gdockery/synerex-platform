#!/usr/bin/env python3
"""
Synerex Field Kit Generator
Creates comprehensive Field Kit checklists for US and Canada/EU regions
"""

import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime

class FieldKitGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
        
    def setup_custom_styles(self):
        """Setup custom paragraph styles for the Field Kit"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='FieldKitTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='FieldKitSection',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=16,
            textColor=colors.darkgreen
        ))
        
        # Checklist item style
        self.styles.add(ParagraphStyle(
            name='FieldKitItem',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            leftIndent=20
        ))
        
        # Signature style
        self.styles.add(ParagraphStyle(
            name='FieldKitSignature',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=8,
            alignment=TA_LEFT
        ))

    def create_us_field_kit(self, output_path):
        """Create US Field Kit checklist"""
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        story = []
        
        # Logo and Title
        try:
            logo_path = "8082/static/synerex_logo_transparent.png"
            if os.path.exists(logo_path):
                logo = Image(logo_path, width=2*inch, height=0.5*inch)
                logo.hAlign = 'CENTER'
                story.append(logo)
                story.append(Spacer(1, 10))
        except Exception as e:
            print(f"Warning: Could not load logo: {e}")
            story.append(Paragraph("SYNEREX FIELD KIT CHECKLIST", self.styles['FieldKitTitle']))
        
        story.append(Paragraph("FIELD KIT CHECKLIST", self.styles['FieldKitTitle']))
        story.append(Paragraph("Pre-Installation Site Assessment - US Version", self.styles['FieldKitSection']))
        story.append(Spacer(1, 20))
        
        # Site Information
        story.append(Paragraph("SITE INFORMATION COLLECTION", self.styles['FieldKitSection']))
        site_items = [
            "□ Facility name and complete address: _____________________________",
            "□ Primary contact name and phone number: ________________________",
            "□ Secondary contact name and phone number: _______________________", 
            "□ Utility company name and account number: _______________________",
            "□ Service voltage and configuration (e.g., 480V, 3-phase): ________",
            "□ Main electrical panel location and accessibility: _________________",
            "□ Emergency contact information: _________________________________",
            "□ Site access requirements and restrictions: _______________________"
        ]
        for item in site_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 12))
        
        # Electrical System Assessment
        story.append(Paragraph("ELECTRICAL SYSTEM ASSESSMENT", self.styles['FieldKitSection']))
        electrical_items = [
            "□ Main electrical panel location identified: _______________________",
            "□ Available electrical capacity verified (minimum 50A required): ____",
            "□ Existing power factor correction equipment noted: _________________",
            "□ Load profile analysis completed: _______________________________",
            "□ Voltage measurements taken at installation point: _________________",
            "□ Current measurements taken during peak load: ____________________",
            "□ Harmonic distortion levels measured: _____________________________",
            "□ Grounding system condition verified: _____________________________",
            "□ Electrical code compliance confirmed: __________________________"
        ]
        for item in electrical_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 12))
        
        # Installation Requirements
        story.append(Paragraph("INSTALLATION REQUIREMENTS", self.styles['FieldKitSection']))
        installation_items = [
            "□ Mounting location identified and approved: _______________________",
            "□ Clearance requirements met (minimum 3 feet on all sides): ________",
            "□ Ventilation adequate for heat dissipation: ________________________",
            "□ Access for maintenance and service: _______________________________",
            "□ Cable routing path planned: _____________________________________",
            "□ Safety barriers and warning signs planned: _______________________",
            "□ Environmental conditions suitable (temperature, humidity): __________",
            "□ Structural support adequate for equipment weight: _________________"
        ]
        for item in installation_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 12))
        
        # Safety Requirements
        story.append(Paragraph("SAFETY REQUIREMENTS", self.styles['FieldKitSection']))
        safety_items = [
            "□ Lockout/tagout procedures reviewed and approved: __________________",
            "□ Personal protective equipment (PPE) requirements identified: _______",
            "□ Emergency procedures documented and posted: ______________________",
            "□ First aid kit available on site: ___________________________________",
            "□ Fire extinguisher requirements met: _______________________________",
            "□ Safety training completed for all personnel: _______________________",
            "□ Hazard identification and risk assessment completed: _______________",
            "□ Emergency contact numbers posted: _________________________________"
        ]
        for item in safety_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 12))
        
        # Documentation
        story.append(Paragraph("DOCUMENTATION REQUIREMENTS", self.styles['FieldKitSection']))
        doc_items = [
            "□ Site photos taken from multiple angles: _____________________________",
            "□ Electrical measurements recorded: __________________________________",
            "□ Electrical drawings reviewed and updated: __________________________",
            "□ Permits obtained from local authorities: _____________________________",
            "□ Utility approval documentation: ____________________________________",
            "□ Insurance certificates current: _____________________________________",
            "□ Installation plan approved by customer: _____________________________",
            "□ Safety plan approved by site supervisor: _____________________________"
        ]
        for item in doc_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 20))
        
        # Technician Notes Section
        story.append(Paragraph("TECHNICIAN NOTES", self.styles['FieldKitSection']))
        story.append(Spacer(1, 8))
        
        # Create notes table with right-justified lines
        notes_data = [
            ['Notes:', '_________________________________________________________________'],
            ['', '_________________________________________________________________'],
            ['', '_________________________________________________________________'],
            ['', '_________________________________________________________________'],
            ['', '_________________________________________________________________']
        ]
        
        notes_table = Table(notes_data, colWidths=[1*inch, 6*inch])
        notes_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        story.append(notes_table)
        story.append(Spacer(1, 20))
        
        # Signature section
        story.append(Paragraph("INSTALLATION SIGN-OFF", self.styles['FieldKitSection']))
        story.append(Spacer(1, 12))
        
        # Create signature table
        signature_data = [
            ['Installation Date:', '_________________', 'Technician:', '_________________'],
            ['Customer Approval:', '_________________', 'Supervisor:', '_________________'],
            ['Utility Approval:', '_________________', 'Safety Officer:', '_________________']
        ]
        
        signature_table = Table(signature_data, colWidths=[2*inch, 2*inch, 2*inch, 2*inch])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        story.append(signature_table)
        story.append(Spacer(1, 20))
        
        # Footer
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 
                              self.styles['FieldKitSignature']))
        story.append(Paragraph("Synerex Energy Solutions - Field Kit v1.0", 
                              self.styles['FieldKitSignature']))
        
        doc.build(story)

    def create_canada_eu_field_kit(self, output_path):
        """Create Canada/EU Field Kit checklist"""
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        story = []
        
        # Logo and Title
        try:
            logo_path = "8082/static/synerex_logo_transparent.png"
            if os.path.exists(logo_path):
                logo = Image(logo_path, width=2*inch, height=0.5*inch)
                logo.hAlign = 'CENTER'
                story.append(logo)
                story.append(Spacer(1, 10))
        except Exception as e:
            print(f"Warning: Could not load logo: {e}")
            story.append(Paragraph("SYNEREX FIELD KIT CHECKLIST", self.styles['FieldKitTitle']))
        
        story.append(Paragraph("FIELD KIT CHECKLIST", self.styles['FieldKitTitle']))
        story.append(Paragraph("Pre-Installation Site Assessment - Canada/EU Version", self.styles['FieldKitSection']))
        story.append(Spacer(1, 20))
        
        # Site Information
        story.append(Paragraph("SITE INFORMATION COLLECTION", self.styles['FieldKitSection']))
        site_items = [
            "□ Facility name and complete address",
            "□ Primary contact name and phone number",
            "□ Secondary contact name and phone number", 
            "□ Utility company name and account number",
            "□ Service voltage and configuration (e.g., 400V, 3-phase)",
            "□ Main electrical panel location and accessibility",
            "□ Emergency contact information",
            "□ Site access requirements and restrictions"
        ]
        for item in site_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 12))
        
        # Electrical System Assessment
        story.append(Paragraph("ELECTRICAL SYSTEM ASSESSMENT", self.styles['FieldKitSection']))
        electrical_items = [
            "□ Main electrical panel location identified",
            "□ Available electrical capacity verified (minimum 25kVA required)",
            "□ Existing power factor correction equipment noted",
            "□ Load profile analysis completed",
            "□ Voltage measurements taken at installation point",
            "□ Current measurements taken during peak load",
            "□ Harmonic distortion levels measured",
            "□ Grounding system condition verified",
            "□ Electrical code compliance confirmed (CSA/CE standards)"
        ]
        for item in electrical_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 12))
        
        # Installation Requirements
        story.append(Paragraph("INSTALLATION REQUIREMENTS", self.styles['FieldKitSection']))
        installation_items = [
            "□ Mounting location identified and approved",
            "□ Clearance requirements met (minimum 1 meter on all sides)",
            "□ Ventilation adequate for heat dissipation",
            "□ Access for maintenance and service",
            "□ Cable routing path planned",
            "□ Safety barriers and warning signs planned",
            "□ Environmental conditions suitable (temperature, humidity)",
            "□ Structural support adequate for equipment weight"
        ]
        for item in installation_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 12))
        
        # Safety Requirements
        story.append(Paragraph("SAFETY REQUIREMENTS", self.styles['FieldKitSection']))
        safety_items = [
            "□ Lockout/tagout procedures reviewed and approved: __________________",
            "□ Personal protective equipment (PPE) requirements identified: _______",
            "□ Emergency procedures documented and posted: ______________________",
            "□ First aid kit available on site: ___________________________________",
            "□ Fire extinguisher requirements met: _______________________________",
            "□ Safety training completed for all personnel: _______________________",
            "□ Hazard identification and risk assessment completed: _______________",
            "□ Emergency contact numbers posted: _________________________________"
        ]
        for item in safety_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 12))
        
        # Regulatory Compliance
        story.append(Paragraph("REGULATORY COMPLIANCE", self.styles['FieldKitSection']))
        compliance_items = [
            "□ CSA standards compliance verified: _______________________________",
            "□ CE marking requirements met: _____________________________________",
            "□ Local electrical codes reviewed: __________________________________",
            "□ Environmental regulations compliance: _____________________________",
            "□ Workplace safety regulations met: _________________________________",
            "□ Energy efficiency standards compliance: ___________________________",
            "□ Noise level requirements met: ______________________________________",
            "□ Documentation requirements fulfilled: _____________________________"
        ]
        for item in compliance_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 12))
        
        # Documentation
        story.append(Paragraph("DOCUMENTATION REQUIREMENTS", self.styles['FieldKitSection']))
        doc_items = [
            "□ Site photos taken from multiple angles",
            "□ Electrical measurements recorded (metric units)",
            "□ Electrical drawings reviewed and updated",
            "□ Permits obtained from local authorities",
            "□ Utility approval documentation",
            "□ Insurance certificates current",
            "□ Installation plan approved by customer",
            "□ Safety plan approved by site supervisor"
        ]
        for item in doc_items:
            story.append(Paragraph(item, self.styles['FieldKitItem']))
        
        story.append(Spacer(1, 20))
        
        # Technician Notes Section
        story.append(Paragraph("TECHNICIAN NOTES", self.styles['FieldKitSection']))
        story.append(Spacer(1, 8))
        
        # Create notes table with right-justified lines
        notes_data = [
            ['Notes:', '_________________________________________________________________'],
            ['', '_________________________________________________________________'],
            ['', '_________________________________________________________________'],
            ['', '_________________________________________________________________'],
            ['', '_________________________________________________________________']
        ]
        
        notes_table = Table(notes_data, colWidths=[1*inch, 6*inch])
        notes_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        story.append(notes_table)
        story.append(Spacer(1, 20))
        
        # Signature section
        story.append(Paragraph("INSTALLATION SIGN-OFF", self.styles['FieldKitSection']))
        story.append(Spacer(1, 12))
        
        # Create signature table
        signature_data = [
            ['Installation Date:', '_________________', 'Technician:', '_________________'],
            ['Customer Approval:', '_________________', 'Supervisor:', '_________________'],
            ['Utility Approval:', '_________________', 'Safety Officer:', '_________________']
        ]
        
        signature_table = Table(signature_data, colWidths=[2*inch, 2*inch, 2*inch, 2*inch])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        story.append(signature_table)
        story.append(Spacer(1, 20))
        
        # Footer
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 
                              self.styles['FieldKitSignature']))
        story.append(Paragraph("Synerex Energy Solutions - Field Kit v1.0 (Canada/EU)", 
                              self.styles['FieldKitSignature']))
        
        doc.build(story)

    def generate_all_field_kits(self, output_dir="8082/assets/field-kit"):
        """Generate all Field Kit PDFs"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        print("Generating Field Kit PDFs...")
        
        # Generate US Field Kit
        us_path = str(output_path / "Synerex_Field_Kit_Checklist.pdf")
        self.create_us_field_kit(us_path)
        print(f"Generated US Field Kit: {us_path}")
        
        # Generate Canada/EU Field Kit
        canada_eu_path = str(output_path / "Synerex_Field_Kit_Checklist_CanadaEU.pdf")
        self.create_canada_eu_field_kit(canada_eu_path)
        print(f"Generated Canada/EU Field Kit: {canada_eu_path}")
        
        print("Field Kit generation completed successfully!")

if __name__ == "__main__":
    generator = FieldKitGenerator()
    generator.generate_all_field_kits()
