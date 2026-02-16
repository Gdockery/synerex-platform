"""Meter Certificate PDF generator. Ported from api/services/pdf/generators/meter-certificate.js."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer


def generate(serial_number, logo_path=None):
    """Generate meter calibration certificate. serial_number from meter.meterSerialNumber."""
    serial_number = serial_number or "N/A"

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    story = []

    # Logo (optional)
    if logo_path:
        try:
            from reportlab.platypus import Image
            from pathlib import Path
            if Path(logo_path).exists():
                img = Image(logo_path, width=250, height=80)
                story.append(img)
                story.append(Spacer(1, 12))
        except Exception:
            pass

    # Contact info
    story.append(Spacer(1, 60))

    # Title
    story.append(Paragraph("Power Scout Certificate of Calibration", ParagraphStyle(name="Title", fontSize=20, alignment=1, spaceAfter=20)))

    # Main table: Date, Time, Serial Number | Technician, Part#, Description
    data = [
        ["Date:", "October 06 2016", "Serial Number:", str(serial_number)],
        ["Technician:", "CAW", "Part#:", "PS3037-S-N"],
        ["Description:", "Firmware Version: 4.73", "Description:", "PS2027 Serial Modbus No Display Set 200A CTs"],
        ["MAC ID ADDRESS:", " ", " ", " "],
    ]
    tbl = Table(data, colWidths=[1.2 * inch, 1.2 * inch, 1.5 * inch, 2.5 * inch])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 20))

    # Logger Measurements header
    story.append(Paragraph("Logger Measurements", ParagraphStyle(name="H2", fontSize=10, spaceAfter=8)))

    # Volts measurement table
    volts_data = [
        ["Volts Measurement", "Voltage Reading", "Voltage Reference", "Percent Error", "Pass/Error"],
        ["L1 Measurement", "310.241", "310.661", "0.135", "PASS"],
        ["L1 Measurement", "310.241", "310.661", "0.135", "PASS"],
        ["L1 Measurement", "310.241", "310.661", "0.135", "PASS"],
    ]
    volts_tbl = Table(volts_data, colWidths=[1.2 * inch, 1 * inch, 1 * inch, 1 * inch, 0.8 * inch])
    volts_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e0e0")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    story.append(volts_tbl)
    story.append(Spacer(1, 20))

    # Calibration reference
    story.append(Paragraph("Calibration Reference Instruments Used", ParagraphStyle(name="H2", fontSize=10, spaceAfter=6)))
    story.append(Paragraph("DMM: Agilent Technologies 34461A, Serial #: MY53202979", ParagraphStyle(name="Ref", fontSize=10)))
    story.append(Paragraph("DMM: Agilent Technologies 34411A, Serial #: MY48004275", ParagraphStyle(name="Ref", fontSize=10)))
    story.append(Paragraph("The calibration of this device is traceable to the National Institute of Standards and Technology (NIST) using the above reference instruments", ParagraphStyle(name="Ref", fontSize=10)))

    doc.build(story)
    buf.seek(0)
    return buf
