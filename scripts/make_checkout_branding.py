from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
assets = root / 'public' / 'assets'
yellow = '#FFC629'
dark = '#0B0D11'
white = '#F5F4EF'
font_path = assets / 'Montserrat-Black.ttf'

def font(size):
    return ImageFont.truetype(str(font_path), size)

def letterspace(draw, xy, text, face, fill, gap):
    x, y = xy
    for character in text:
        draw.text((x, y), character, font=face, fill=fill, anchor='lt')
        x += draw.textlength(character, font=face) + gap

# Extend the site's existing B monogram and Montserrat wordmark.
icon = Image.new('RGBA', (512, 512), dark)
draw = ImageDraw.Draw(icon)
draw.rounded_rectangle((18, 18, 494, 494), radius=86, fill=dark)
draw.text((256, 244), 'B', font=font(380), fill=yellow, anchor='mm')
icon.save(assets / 'checkout-icon.png', optimize=True)

logo = Image.new('RGBA', (760, 250), (0, 0, 0, 0))
draw = ImageDraw.Draw(logo)
draw.rounded_rectangle((8, 16, 222, 230), radius=32, fill=dark, outline=yellow, width=6)
draw.text((115, 118), 'B', font=font(166), fill=yellow, anchor='mm')
draw.text((270, 39), 'LADO B', font=font(106), fill=white, anchor='lt')
letterspace(draw, (276, 164), 'DO MERCADO', font(36), white, 10)
logo.save(assets / 'checkout-logo.png', optimize=True)
print('Checkout logo and icon generated.')
