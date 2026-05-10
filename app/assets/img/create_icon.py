#!/usr/bin/env python3
"""
Generate CB Query Analyzer App Icon from SVG favicon
Creates .icns (macOS) and .ico (Windows) from the website favicon

Design: Blue gradient background (#007acc to #00b4d8) with white "CB" text
Matches the website favicon.svg

Requirements: pip install Pillow cairosvg

Run: python create_icon.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_cb_icon_from_scratch(size=1024):
    """
    Recreate the favicon design at high resolution
    Blue gradient background with white CB text
    """
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors from favicon.svg
    blue_top = (0, 122, 204)      # #007acc
    blue_bottom = (0, 180, 216)   # #00b4d8
    white = (255, 255, 255)
    
    # Padding and corner radius
    padding = size // 16  # 4/64 ratio from SVG
    corner_radius = size * 14 // 64  # rx="14" from 64px SVG
    
    # Draw gradient background with rounded rectangle
    # Create gradient by drawing horizontal lines
    rect_left = padding
    rect_top = padding
    rect_right = size - padding
    rect_bottom = size - padding
    rect_height = rect_bottom - rect_top
    
    # First, create a mask for rounded rectangle
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [rect_left, rect_top, rect_right, rect_bottom],
        radius=corner_radius,
        fill=255
    )
    
    # Create gradient image
    gradient = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient)
    
    for y in range(rect_top, rect_bottom):
        # Diagonal gradient (top-left to bottom-right as in SVG)
        progress = (y - rect_top) / rect_height
        r = int(blue_top[0] + (blue_bottom[0] - blue_top[0]) * progress)
        g = int(blue_top[1] + (blue_bottom[1] - blue_top[1]) * progress)
        b = int(blue_top[2] + (blue_bottom[2] - blue_top[2]) * progress)
        gradient_draw.line([(rect_left, y), (rect_right, y)], fill=(r, g, b, 255))
    
    # Apply mask to gradient
    gradient.putalpha(mask)
    img = Image.alpha_composite(img, gradient)
    draw = ImageDraw.Draw(img)
    
    # Draw "CB" text
    font_size = int(size * 26 / 64)  # 26px in 64px SVG
    
    # Try different fonts
    font = None
    font_paths = [
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/Library/Fonts/Arial Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",  # Windows
    ]
    
    for font_path in font_paths:
        try:
            font = ImageFont.truetype(font_path, font_size)
            break
        except:
            continue
    
    if font is None:
        font = ImageFont.load_default()
    
    text = "CB"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center text
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - bbox[1]  # Adjust for baseline
    
    # Draw text
    draw.text((text_x, text_y), text, fill=white, font=font)
    
    return img

def create_iconset(base_img, output_dir):
    """Create macOS .iconset folder with all required sizes"""
    iconset_dir = os.path.join(output_dir, "QueryAnalyzer.iconset")
    os.makedirs(iconset_dir, exist_ok=True)
    
    sizes = [16, 32, 64, 128, 256, 512, 1024]
    
    for size in sizes:
        # Regular resolution
        resized = base_img.resize((size, size), Image.LANCZOS)
        resized.save(os.path.join(iconset_dir, f"icon_{size}x{size}.png"))
        
        # @2x resolution (except for 1024)
        if size <= 512:
            resized_2x = base_img.resize((size * 2, size * 2), Image.LANCZOS)
            resized_2x.save(os.path.join(iconset_dir, f"icon_{size}x{size}@2x.png"))
    
    print(f"✅ Created iconset at: {iconset_dir}")
    return iconset_dir

def create_ico(base_img, output_path):
    """Create Windows .ico file"""
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    icons = []
    
    for size in sizes:
        resized = base_img.resize(size, Image.LANCZOS)
        # Convert to RGB for ICO (some versions don't support RGBA well)
        if resized.mode == 'RGBA':
            # Create white background for small sizes
            bg = Image.new('RGBA', size, (255, 255, 255, 0))
            bg = Image.alpha_composite(bg, resized)
            icons.append(bg)
        else:
            icons.append(resized)
    
    icons[0].save(output_path, format='ICO', sizes=sizes)
    print(f"✅ Created Windows icon: {output_path}")

if __name__ == "__main__":
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("🎨 Creating CB Query Analyzer icon...")
    print("   Design: Matching website favicon")
    print("   Colors: #007acc → #00b4d8 gradient + white CB")
    
    # Create base icon at high resolution
    icon = create_cb_icon_from_scratch(1024)
    
    # Save PNG
    png_path = os.path.join(output_dir, "app_icon.png")
    icon.save(png_path)
    print(f"✅ Created PNG: {png_path}")
    
    # Create iconset for macOS
    iconset_dir = create_iconset(icon, output_dir)
    
    # Create .ico for Windows
    ico_path = os.path.join(output_dir, "app_icon.ico")
    create_ico(icon, ico_path)
    
    print("\n📦 Next steps:")
    print(f"   macOS: iconutil -c icns {iconset_dir}")
    print("   This creates: QueryAnalyzer.icns")
    print("\n   Or run: iconutil -c icns QueryAnalyzer.iconset -o QueryAnalyzer.icns")
