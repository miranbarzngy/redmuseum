s=open('museum.tpl.html').read()
n,d=open('assets/qr.txt').read().split('|'); n2,d2=open('assets/qr2.txt').read().split('|')
s=s.replace('{{QN2b}}',str(int(n2)+4)).replace('{{QR2}}',d2).replace('{{QN2}}',str(int(n)+4)).replace('{{QR}}',d)
open('museum.html','w').write(s)
