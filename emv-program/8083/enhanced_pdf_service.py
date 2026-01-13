#!/usr/bin/env python3
"""
Enhanced PDF Service - Port 8083
Handles PDF generation with SVG chart support using svglib (no Cairo dependency)
"""

import json
import os
import sys
import traceback
from pathlib import Path
from datetime import datetime
from io import StringIO

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge

# ReportLab imports
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.platypus.flowables import Flowable

# SVG support
try:
    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPDF
    HAVE_SVGLIB = True
    print("SVGLib available - SVG chart support enabled")
except ImportError:
    HAVE_SVGLIB = False
    print("SVGLib not available - SVG charts will be skipped")

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, origins=["http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:8082", "http://127.0.0.1:8082"])

# Configure upload size limit (256MB)
app.config["MAX_CONTENT_LENGTH"] = 256 * 1024 * 1024

# Create output directory
OUTPUT_DIR = Path("generated_pdfs")
OUTPUT_DIR.mkdir(exist_ok=True)


class SVGChartFlowable(Flowable):
    """Custom flowable to render SVG charts in PDF"""
    
    def __init__(self, svg_content, width=400, height=300):
        self.svg_content = svg_content
        self.width = width
        self.height = height
        
    def draw(self):
        if not HAVE_SVGLIB:
            # Fallback: draw a placeholder
            self.canv.setStrokeColor(colors.grey)
            self.canv.setFillColor(colors.lightgrey)
            self.canv.rect(0, 0, self.width, self.height, fill=1)
            self.canv.setFillColor(colors.black)
            self.canv.drawString(10, self.height/2, "Chart not available (SVGLib required)")
            return
            
        try:
            # Convert SVG to ReportLab graphics
            svg_io = StringIO(self.svg_content)
            drawing = svg2rlg(svg_io)
            
            if drawing:
                # Scale the drawing to fit
                drawing.scale(self.width/drawing.width, self.height/drawing.height)
                drawing.drawOn(self.canv, 0, 0)
            else:
                # Fallback if conversion fails
                self.canv.setStrokeColor(colors.grey)
                self.canv.setFillColor(colors.lightgrey)
                self.canv.rect(0, 0, self.width, self.height, fill=1)
                self.canv.setFillColor(colors.black)
                self.canv.drawString(10, self.height/2, "Chart conversion failed")
        except Exception as e:
            print(f"Error rendering SVG chart: {e}")
            # Fallback: draw a placeholder
            self.canv.setStrokeColor(colors.grey)
            self.canv.setFillColor(colors.lightgrey)
            self.canv.rect(0, 0, self.width, self.height, fill=1)
            self.canv.setFillColor(colors.black)
            self.canv.drawString(10, self.height/2, f"Chart error: {str(e)[:50]}")


def create_pdf_with_charts(data, output_path):
    """Create PDF with embedded SVG charts"""
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph("SYNEREX Power Analysis Report", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 20))
    
    # Client Information
    client_info = data.get('client_info', {})
    if client_info:
        story.append(Paragraph("Client Information", styles['Heading1']))
        client_table_data = [
            ['Field', 'Value'],
            ['Company', client_info.get('company', 'N/A')],
            ['Contact', client_info.get('contact', 'N/A')],
            ['Email', client_info.get('email', 'N/A')],
            ['Phone', client_info.get('phone', 'N/A')],
        ]
        client_table = Table(client_table_data, colWidths=[2*inch, 4*inch])
        client_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(client_table)
        story.append(Spacer(1, 20))
    
    # Charts Section
    charts_data = data.get('charts_data', {})
    if charts_data and HAVE_SVGLIB:
        story.append(Paragraph("Analysis Charts", styles['Heading1']))
        story.append(Spacer(1, 12))
        
        # Process each chart
        for chart_name, chart_content in charts_data.items():
            if isinstance(chart_content, str) and chart_content.strip().startswith('<svg'):
                story.append(Paragraph(f"Chart: {chart_name.replace('_', ' ').title()}", styles['Heading2']))
                story.append(Spacer(1, 6))
                
                # Create SVG chart flowable
                chart_flowable = SVGChartFlowable(chart_content, width=400, height=300)
                story.append(chart_flowable)
                story.append(Spacer(1, 12))
            else:
                story.append(Paragraph(f"Chart: {chart_name.replace('_', ' ').title()} - Data only", styles['Heading2']))
                story.append(Paragraph("Chart data available but not in SVG format", styles['Normal']))
                story.append(Spacer(1, 12))
    elif charts_data:
        story.append(Paragraph("Analysis Charts", styles['Heading1']))
        story.append(Paragraph("SVG chart support not available (SVGLib required)", styles['Normal']))
        story.append(Spacer(1, 12))
    
    # Statistical Analysis
    statistical_data = data.get('statistical_data', {})
    if statistical_data:
        story.append(Paragraph("Statistical Analysis", styles['Heading1']))
        story.append(Spacer(1, 12))
        
        # Create statistical table
        stats_table_data = [['Metric', 'Value']]
        for key, value in statistical_data.items():
            if isinstance(value, (int, float)):
                stats_table_data.append([key.replace('_', ' ').title(), f"{value:.4f}"])
            else:
                stats_table_data.append([key.replace('_', ' ').title(), str(value)])
        
        if len(stats_table_data) > 1:
            stats_table = Table(stats_table_data, colWidths=[3*inch, 2*inch])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(stats_table)
            story.append(Spacer(1, 20))
    
    # Summary
    story.append(Paragraph("Report Summary", styles['Heading1']))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Paragraph("This report contains comprehensive power analysis data including statistical analysis and visual charts.", styles['Normal']))
    
    # Build PDF
    doc.build(story)
    return True


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "service": "Enhanced PDF Generator", 
        "version": "1.0.0",
        "svg_support": HAVE_SVGLIB
    })


@app.route("/generate", methods=["POST"])
def generate_pdf():
    """Generate PDF from POST data with SVG chart support"""
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        print(f"Enhanced PDF Generation Request - Data size: {len(str(data))} characters")
        print(f"Enhanced PDF Generation - Received data with keys: {list(data.keys()) if data else 'None'}")
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"enhanced_report_{timestamp}.pdf"
        output_path = OUTPUT_DIR / filename
        
        # Create PDF with charts
        success = create_pdf_with_charts(data, output_path)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Enhanced PDF generated successfully",
                "filename": filename,
                "path": str(output_path),
                "svg_support": HAVE_SVGLIB
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to generate PDF"
            }), 500
            
    except Exception as e:
        print(f"Error in enhanced PDF generation: {e}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


def create_engineering_test_metrics_pdf(metrics_data, output_path):
    """Create PDF report for Engineering Test Metrics Dashboard"""
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    title = Paragraph("Engineering Test Metrics Dashboard", title_style)
    story.append(title)
    story.append(Spacer(1, 20))
    
    # Report Information
    report_info = Paragraph(
        f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        styles['Normal']
    )
    story.append(report_info)
    story.append(Spacer(1, 20))
    
    # M&V Requirements Status (Core utility requirements)
    mv_requirements = metrics_data.get("mv_requirements_status", {})
    if mv_requirements:
        story.append(Paragraph("M&V Requirements Status (Utility Rebate Submission)", styles['Heading1']))
        story.append(Spacer(1, 6))
        story.append(Paragraph("These three requirements must pass for utility rebate submission", styles['Normal']))
        story.append(Spacer(1, 12))
        
        mv_status = mv_requirements.get("status", "UNKNOWN")
        mv_compliant = mv_requirements.get("compliant_requirements", 0)
        mv_total = mv_requirements.get("total_requirements", 0)
        
        mv_summary_data = [
            ['Status', 'Compliant Requirements', 'Total Requirements'],
            [mv_status, f"{mv_compliant} / {mv_total}", str(mv_total)]
        ]
        
        mv_summary_table = Table(mv_summary_data, colWidths=[2*inch, 2*inch, 2*inch])
        mv_summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(mv_summary_table)
        story.append(Spacer(1, 12))
        
        # M&V Requirements Table
        requirements = mv_requirements.get("requirements", {})
        if requirements:
            mv_table_data = [['Requirement', 'Value', 'Requirement', 'Status', 'Standard']]
            for req_key, req_info in requirements.items():
                value = req_info.get("value")
                value_str = f"{value}{req_info.get('unit', '')}" if value is not None else "N/A"
                requirement = req_info.get("requirement", "")
                compliant = req_info.get("compliant")
                status_str = "PASS" if compliant else ("FAIL" if compliant is False else "N/A")
                standard = req_info.get("standard", "")
                metric_name = req_info.get("metric", req_key)
                
                mv_table_data.append([
                    metric_name,
                    value_str,
                    requirement,
                    status_str,
                    standard
                ])
            
            if len(mv_table_data) > 1:
                mv_table = Table(mv_table_data, colWidths=[1.5*inch, 1*inch, 1*inch, 0.8*inch, 1.2*inch])
                mv_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP')
                ]))
                story.append(mv_table)
                story.append(Spacer(1, 20))
    
    # Overall Compliance Summary (Dashboard Indicator)
    compliance_summary = metrics_data.get("compliance_summary", {})
    story.append(Paragraph("Overall Compliance Summary (Dashboard Indicator)", styles['Heading1']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(compliance_summary.get("note", "Overall status is a dashboard convenience indicator. Utility rebate submission requires the three M&V requirements to pass."), styles['Normal']))
    story.append(Spacer(1, 12))
    
    summary_data = [
        ['Metric', 'Value'],
        ['Compliant Metrics', f"{compliance_summary.get('compliant_metrics', 0)} / {compliance_summary.get('total_metrics', 0)}"],
        ['Compliance Score', f"{compliance_summary.get('compliance_score', 0)}%"],
        ['Overall Status', compliance_summary.get('overall_status', 'UNKNOWN')]
    ]
    
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Engineering Test Metrics
    story.append(Paragraph("Engineering Test Metrics", styles['Heading1']))
    story.append(Spacer(1, 12))
    
    metrics = metrics_data.get("metrics", {})
    
    # Create metrics table
    metrics_table_data = [
        ['Metric', 'Value', 'Unit', 'Limit', 'Status', 'Standard']
    ]
    
    for metric_name, metric_info in metrics.items():
        if metric_info.get("value") is not None:
            value = metric_info.get("value")
            unit = metric_info.get("unit", "")
            limit = metric_info.get("limit")
            compliant = metric_info.get("compliant", False)
            standard = metric_info.get("standard", "")
            
            # Handle string values (like status indicators) vs numeric values
            if isinstance(value, str):
                value_str = value
            elif isinstance(value, (int, float)):
                value_str = f"{value}{unit}" if unit else str(value)
            else:
                value_str = str(value)
            
            limit_str = str(limit) if limit is not None else "N/A"
            status_str = "COMPLIANT" if compliant else "NON-COMPLIANT"
            
            # Format metric name
            metric_display = metric_name.replace("_", " ").title()
            
            metrics_table_data.append([
                metric_display,
                value_str,
                unit,
                limit_str,
                status_str,
                standard
            ])
    
    if len(metrics_table_data) > 1:
        metrics_table = Table(metrics_table_data, colWidths=[1.5*inch, 1*inch, 0.5*inch, 0.8*inch, 1*inch, 1.2*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        story.append(metrics_table)
        story.append(Spacer(1, 20))
    
    # Detailed Metric Descriptions
    story.append(Paragraph("Metric Descriptions", styles['Heading1']))
    story.append(Spacer(1, 12))
    
    descriptions = []
    for metric_name, metric_info in metrics.items():
        if metric_info.get("value") is not None:
            metric_display = metric_name.replace("_", " ").title()
            description = metric_info.get("description", "")
            descriptions.append(f"{metric_display}: {description}")
    
    for desc in descriptions:
        story.append(Paragraph(desc, styles['Normal']))
        story.append(Spacer(1, 6))
    
    story.append(Spacer(1, 20))
    
    # Standards Applied
    standards = metrics_data.get("standards_applied", [])
    if standards:
        story.append(Paragraph("Standards Applied", styles['Heading1']))
        story.append(Spacer(1, 12))
        for standard in standards:
            story.append(Paragraph(f"- {standard}", styles['Normal']))
            story.append(Spacer(1, 6))
    
    story.append(PageBreak())
    
    # Build PDF
    doc.build(story)
    return True


@app.route("/generate-engineering-metrics", methods=["POST"])
def generate_engineering_metrics_pdf():
    """Generate PDF report for Engineering Test Metrics"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        engineering_metrics = data.get("engineering_test_metrics", {})
        if not engineering_metrics:
            return jsonify({"error": "No engineering test metrics data provided"}), 400
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"engineering_test_metrics_{timestamp}.pdf"
        output_path = OUTPUT_DIR / filename
        
        # Create PDF
        success = create_engineering_test_metrics_pdf(engineering_metrics, output_path)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Engineering Test Metrics PDF generated successfully",
                "filename": filename,
                "path": str(output_path)
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to generate PDF"
            }), 500
            
    except Exception as e:
        print(f"Error generating Engineering Test Metrics PDF: {e}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/status", methods=["GET"])
def status():
    """Service status"""
    return jsonify({
        "service": "Enhanced PDF Generator",
        "status": "running",
        "svg_support": HAVE_SVGLIB,
        "output_directory": str(OUTPUT_DIR)
    })


if __name__ == '__main__':
    print("Starting Enhanced PDF Generator Service on port 8083...")
    print(f"SVG Support: {'Enabled' if HAVE_SVGLIB else 'Disabled'}")
    print(f"Output directory: {OUTPUT_DIR}")
    print("Health check: http://localhost:8083/health")
    print("Generate PDF: POST http://localhost:8083/generate")
    print("Status: http://localhost:8083/status")
    print("-" * 50)
    
    # Windows-compatible Flask configuration
    app.run(host="0.0.0.0", port=8083, debug=False, use_reloader=False, threaded=True)




