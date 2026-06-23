#!/usr/bin/env python3
"""
Generate all whitelabel asset sizes from a single PNG input image.

This script takes a PNG image and generates all the required sizes for whitelabeling
according to the vendor branding requirements.

Usage:
    python3 generate-whitelabel-assets.py input.png [--output-dir OUTPUT_DIR]

Requirements:
    pip install Pillow
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is not installed. Please install it with:")
    print("  pip install Pillow")
    sys.exit(1)


# Image size definitions based on vendor requirements
# 'source' indicates which input file to use: 'rect' for rectangular logo, 'square' for square/box logo
IMAGE_SIZES = {
    # Frontend Images
    'images/logo-small.png': {'width': 135, 'maintain_aspect': True, 'source': 'rect'},
    'images/logo-big.png': {'width': 225, 'maintain_aspect': True, 'source': 'rect'},
    'images/logo-big1.png': {'width': 225, 'maintain_aspect': True, 'source': 'rect'},
    'images/synerex-logo-sm.png': {'width': 110, 'maintain_aspect': True, 'source': 'rect'},
    'images/synerex-welcome2.png': {'width': 1000, 'maintain_aspect': True, 'source': 'rect'},
    'images/ubill-tracker-logo.png': {'width': 138, 'height': 34, 'maintain_aspect': False, 'source': 'rect'},
    'images/ubill-cast-logo.png': {'width': 138, 'height': 34, 'maintain_aspect': False, 'source': 'rect'},
    'images/favicon.ico': {'width': 32, 'height': 32, 'maintain_aspect': False, 'source': 'square'},
    
    # PDF Resources (300 DPI)
    'pdf-resources/logo.png': {'width': 250, 'maintain_aspect': True, 'dpi': 300, 'source': 'rect'},
    'pdf-resources/bill-logo.png': {'width': 250, 'maintain_aspect': True, 'dpi': 300, 'source': 'rect'},
    'pdf-resources/bill-cover.png': {'width': 2550, 'height': 3300, 'maintain_aspect': False, 'dpi': 300, 'source': 'rect'},
    'pdf-resources/proposal-cover.png': {'width': 2550, 'height': 3300, 'maintain_aspect': False, 'dpi': 300, 'source': 'rect'},
}


def resize_image(img, target_width, target_height=None, maintain_aspect=True, dpi=None):
    """
    Resize an image to the target dimensions.
    
    Args:
        img: PIL Image object
        target_width: Target width in pixels
        target_height: Target height in pixels (optional if maintain_aspect is True)
        maintain_aspect: If True, maintain aspect ratio and use target_width as max width
        dpi: DPI setting for the output image (for PDF resources)
    
    Returns:
        Resized PIL Image object
    """
    original_width, original_height = img.size
    
    if maintain_aspect:
        # Calculate height to maintain aspect ratio
        aspect_ratio = original_height / original_width
        target_height = int(target_width * aspect_ratio)
    elif target_height is None:
        # If no height specified and not maintaining aspect, use original height
        target_height = original_height
    
    # Resize with high-quality resampling
    resized = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    # Set DPI if specified
    if dpi:
        resized.info['dpi'] = (dpi, dpi)
    
    return resized


def load_and_prepare_image(input_path):
    """
    Load and prepare an image for processing.
    
    Args:
        input_path: Path to the input PNG image
    
    Returns:
        PIL Image object in RGBA mode
    """
    input_path = Path(input_path)
    
    if not input_path.exists():
        raise FileNotFoundError(f"Input file '{input_path}' does not exist.")
    
    try:
        img = Image.open(input_path)
        print(f"Loaded image: {img.size[0]}x{img.size[1]} pixels, mode: {img.mode}")
    except Exception as e:
        raise Exception(f"Error opening image: {e}")
    
    # Convert to RGBA if not already (to preserve transparency)
    if img.mode != 'RGBA':
        print(f"Converting image from {img.mode} to RGBA to preserve transparency...")
        if img.mode == 'RGB':
            img = img.convert('RGBA')
        else:
            # Create alpha channel for non-RGB images
            img = img.convert('RGBA')
    
    return img


def generate_assets(rect_input_path, square_input_path, output_dir=None):
    """
    Generate all whitelabel assets from the input images.
    
    Args:
        rect_input_path: Path to the rectangular logo PNG image
        square_input_path: Path to the square/box logo PNG image
        output_dir: Directory to save generated images (default: ./whitelabel-assets)
    """
    # Load both input images
    print("Loading rectangular logo...")
    rect_img = load_and_prepare_image(rect_input_path)
    
    print("Loading square logo...")
    square_img = load_and_prepare_image(square_input_path)
    
    if output_dir:
        output_dir = Path(output_dir)
    else:
        output_dir = Path('whitelabel-assets')
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    generated_count = 0
    
    # Generate each required asset
    for output_path, config in IMAGE_SIZES.items():
        output_file = output_dir / output_path
        
        # Create subdirectory if needed
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Select the appropriate source image
        source_type = config.get('source', 'rect')
        if source_type == 'square':
            img = square_img
        else:
            img = rect_img
        
        # Resize image
        target_width = config['width']
        target_height = config.get('height')
        maintain_aspect = config.get('maintain_aspect', True)
        dpi = config.get('dpi')
        
        resized = resize_image(
            img, 
            target_width, 
            target_height=target_height,
            maintain_aspect=maintain_aspect,
            dpi=dpi
        )
        
        # Save the image
        # For favicon, save as ICO format; otherwise PNG
        if output_path.endswith('.ico'):
            # Convert to ICO format for favicon
            # ICO format requires specific sizes, so we'll create a multi-size ICO
            # Create square versions at common favicon sizes
            ico_sizes = [(16, 16), (32, 32), (48, 48)]
            ico_images = []
            for size in ico_sizes:
                # Make sure it's square by cropping/resizing to center
                ico_img = resized.resize(size, Image.Resampling.LANCZOS)
                ico_images.append(ico_img)
            # Save as ICO with multiple sizes
            resized.save(output_file, 'ICO', sizes=[(img.width, img.height) for img in ico_images])
        else:
            # Use PNG format to preserve transparency
            resized.save(output_file, 'PNG', optimize=True)
        
        print(f"Generated: {output_path} ({resized.size[0]}x{resized.size[1]} pixels" + 
              (f", {dpi} DPI" if dpi else "") + f", source: {source_type})")
        generated_count += 1
    
    print(f"\n✓ Successfully generated {generated_count} assets in: {output_dir}")
    print(f"\nDirectory structure:")
    print(f"  {output_dir}/")
    print(f"  ├── images/")
    print(f"  │   ├── logo-small.png")
    print(f"  │   ├── logo-big.png")
    print(f"  │   ├── logo-big1.png")
    print(f"  │   ├── synerex-logo-sm.png")
    print(f"  │   ├── synerex-welcome2.png")
    print(f"  │   ├── ubill-tracker-logo.png")
    print(f"  │   └── ubill-cast-logo.png")
    print(f"  └── pdf-resources/")
    print(f"      ├── logo.png")
    print(f"      ├── bill-logo.png")
    print(f"      ├── bill-cover.png")
    print(f"      └── proposal-cover.png")
    print(f"\nNote: For cover images (bill-cover.png, proposal-cover.png), you may need")
    print(f"to manually adjust or create custom designs as they require specific")
    print(f"dimensions (8.5\" × 11\" at 300 DPI).")


def main():
    parser = argparse.ArgumentParser(
        description='Generate all whitelabel asset sizes from two PNG images (rectangular and square).',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 generate-whitelabel-assets.py rect_logo.png square_logo.png
  python3 generate-whitelabel-assets.py rect_logo.png square_logo.png --output-dir ./my-branding
  python3 generate-whitelabel-assets.py rect.png box.png --output-dir ./whitelabel/harmoniq

The script will generate all required images in the correct directory structure:
  - Frontend images (logo-small.png, logo-big.png, favicon.ico, etc.)
  - PDF resources (logo.png, bill-cover.png, etc.)

Rectangular logo is used for most logos; square logo is used for favicon and square formats.
All images maintain transparency and aspect ratio (except for fixed-size covers).
        """
    )
    
    parser.add_argument(
        'rect_input',
        help='Path to the rectangular logo PNG image (for most logos)'
    )
    
    parser.add_argument(
        'square_input',
        help='Path to the square/box logo PNG image (for favicon and square formats)'
    )
    
    parser.add_argument(
        '--output-dir',
        dest='output_dir',
        help='Directory to save generated images (default: ./whitelabel-assets)'
    )
    
    args = parser.parse_args()
    
    generate_assets(args.rect_input, args.square_input, args.output_dir)


if __name__ == '__main__':
    main()
