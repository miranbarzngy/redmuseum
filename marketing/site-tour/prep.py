"""Turns capture.js's full-page screenshots into the images tour.html scrolls.
    python3 prep.py   → img/home.jpg, img/booking.jpg, img/contact.jpg (984 px wide = 2× the phone screen)
                        img/header.jpg (the site's top bar + header, pinned over the page while it scrolls)
"""
import os
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
W = 984
HEADER = 345  # px of the 3× capture: dark opening-hours bar + logo header

os.makedirs(os.path.join(HERE, 'img'), exist_ok=True)
for name in ['home', 'booking', 'contact']:
    im = Image.open(os.path.join(HERE, 'cap', name + '.png')).convert('RGB')
    im.resize((W, round(im.height * W / im.width)), Image.LANCZOS).save(os.path.join(HERE, 'img', name + '.jpg'), quality=88)
im = Image.open(os.path.join(HERE, 'cap', 'booking.png')).convert('RGB').crop((0, 0, 1170, HEADER))
im.resize((W, round(HEADER * W / 1170)), Image.LANCZOS).save(os.path.join(HERE, 'img', 'header.jpg'), quality=92)
print('wrote img/')
