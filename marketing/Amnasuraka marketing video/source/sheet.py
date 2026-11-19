import sys, glob
from PIL import Image
files = sys.argv[2:]
out = sys.argv[1]
H = 900
ims = [Image.open(f).resize((int(1080*H/1920), H)) for f in files]
W = sum(i.width for i in ims) + 8*len(ims)
s = Image.new('RGB', (W, H), (60,60,60)); x = 0
for i in ims: s.paste(i, (x, 0)); x += i.width + 8
s.save(out, quality=85)
