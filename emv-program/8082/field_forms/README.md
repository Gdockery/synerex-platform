# SYNEREX Field Data Collection Forms

## Overview

This directory contains printable PDF forms for field workers to collect facility-specific data on-site before entering it into the SYNEREX UI. Each form is designed for a specific facility type and includes all necessary fields for accurate data entry.

## Available Forms

1. **cold_storage_field_form.pdf** - For cold storage warehouses and food processing facilities
2. **data_center_field_form.pdf** - For data centers, GPU facilities, and server rooms
3. **healthcare_field_form.pdf** - For hospitals, clinics, and medical centers
4. **hospitality_field_form.pdf** - For hotels, restaurants, and resorts
5. **manufacturing_field_form.pdf** - For manufacturing plants and industrial facilities

## Features

- **Synerex Logo** - Professional branding on every page
- **Print-Ready** - Optimized for 8.5" x 11" paper
- **Comprehensive Fields** - All required inputs for each facility type
- **Before/After Comparison** - Side-by-side columns for baseline and measurement periods
- **Notes Section** - Space for additional observations and comments
- **Page Numbers** - Automatic page numbering
- **Confidentiality Notice** - Footer indicates internal use only

## How to Use

1. **Print the Appropriate Form**
   - Select the form that matches your facility type
   - Print on standard 8.5" x 11" paper
   - Print multiple copies if needed for multiple projects

2. **Fill Out On-Site**
   - Take the form to the facility
   - Complete all relevant sections
   - Use checkboxes for selections
   - Write measurements and values in the provided spaces
   - Add notes in the notes section

3. **Enter Data into UI**
   - Use the completed form as reference
   - Navigate to the appropriate facility-specific analysis page in SYNEREX
   - Enter data from the form into the corresponding UI fields
   - Verify all values are entered correctly

## Form Sections

Each form includes:

### Common Sections (All Forms)
- **Project Information** - Client, facility address, contact info
- **Test Parameters** - Test type, circuit, periods, meter specs
- **Weather Data** - Temperature and humidity (before/after)
- **Billing Information** - Utility rates and account information

### Facility-Specific Sections

#### Cold Storage
- Product type and weight (before/after)
- Storage capacity and utilization
- Storage temperature setpoint
- Storage duration
- Turnover rate

#### Data Center / GPU
- Facility type and area
- Number of racks and GPUs
- IT equipment power (before/after)
- Cooling power (before/after)
- UPS capacity and efficiency
- Compute capacity and GPU utilization

#### Healthcare
- Facility type and area
- Number of beds and operating rooms
- Patient days (before/after)
- Occupancy rate
- Medical equipment power
- HVAC and ventilation info
- Backup generator and UPS capacity

#### Hospitality
- Facility type and area
- Number of rooms and seats
- Occupied room-nights (before/after)
- Guest count
- Meals served (before/after)
- Kitchen equipment power
- Laundry power and loads
- Pool/spa information

#### Manufacturing & Industrial
- Facility type and area
- Production lines and machines
- Operating hours and shifts
- Units produced (before/after)
- Machine hours (before/after)
- Compressed air system
- Motor horsepower
- Process equipment power
- Peak demand and power factor

## Regenerating Forms

To regenerate the PDF forms (e.g., after updating fields or logo):

```bash
cd synerex-oneform/8082/field_forms
python generate_field_forms.py
```

## Requirements

- Python 3.7+
- reportlab library (`pip install reportlab`)
- Pillow library for image handling (`pip install Pillow`)

## Version

**Version 3.8** - Includes all facility-specific analysis capabilities

**Last Updated:** November 2025


