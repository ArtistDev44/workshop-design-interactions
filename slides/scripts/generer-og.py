"""Prompt 94 : image Open Graph du diaporama (1200×630), au visuel Pixel Design System.
Fond #0D0C0C, barre primaire #D4031C, titre en JetBrains Mono, capture réelle du jeu à droite.
Usage : python3 slides/scripts/generer-og.py  (PIL ; JetBrains Mono installée sur le poste)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ICI = Path(__file__).resolve().parent.parent
POLICES = Path('/usr/share/fonts/truetype/jetbrains-mono-zorin-os')
gras = lambda t: ImageFont.truetype(str(POLICES / 'JetBrainsMono-ExtraBold.ttf'), t)
normal = lambda t: ImageFont.truetype(str(POLICES / 'JetBrainsMono-Regular.ttf'), t)

im = Image.new('RGB', (1200, 630), '#0D0C0C')
d = ImageDraw.Draw(im)
# Capture réelle du jeu, à droite, assombrie et cadrée (blanc 15 %)
cap = Image.open(ICI / 'public/img/bureau.webp').convert('RGB').resize((640, 360))
voile = Image.new('RGB', cap.size, '#0D0C0C')
cap = Image.blend(cap, voile, 0.35)
im.paste(cap, (520, 190))
d.rectangle([518, 188, 1161, 551], outline='#3d3c3c', width=2)
# Barre primaire et titre
d.rectangle([0, 0, 24, 630], fill='#D4031C')
d.text((72, 70), 'PATRIMOINE.EXE · NTE001', font=normal(28), fill='#FFFFFF')
d.text((72, 130), 'NANTES EN', font=gras(64), fill='#FFFFFF')
d.text((72, 204), 'RÉGULATION', font=gras(64), fill='#FFFFFF')
d.rectangle([72, 292, 312, 298], fill='#D4031C')
for i, ligne in enumerate(['Rejouer une semaine réelle', 'du réseau nantais, en salle', 'de contrôle. Aucun événement', 'inventé.']):
    d.text((72, 350 + i * 38), ligne, font=normal(26), fill='#FFFFFF')
d.rectangle([72, 540, 470, 584], fill='#FFC138')
d.text((86, 548), 'Présentation · ESD 2026', font=gras(22), fill='#0D0C0C')
d.text((520, 572), 'workshop-design-interactions.pages.dev/presentation/', font=normal(20), fill='#BFBFBF')
im.save(ICI / 'public/og-image.png', optimize=True)
print('og-image.png', im.size)
