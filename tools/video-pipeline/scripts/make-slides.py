import os
from PIL import Image, ImageDraw, ImageFont

SP="/private/tmp/claude-501/-Users-ariellecoambes-Documents-luxury-catalog/115480b7-255b-453e-8e33-2d44c32346e9/scratchpad/slides"
os.makedirs(SP, exist_ok=True)
W,H = 1080,1350
INK=(23,24,28); IVORY=(239,233,222); GOLD=(198,161,91); MUTED=(150,146,138); LINE=(60,60,66)

SER="/System/Library/Fonts/Supplemental/Georgia.ttf"
SERB="/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
SERI="/System/Library/Fonts/Supplemental/Georgia Italic.ttf"
SANS="/System/Library/Fonts/Helvetica.ttc"
def f(path,sz): return ImageFont.truetype(path,sz)

def tw(d,t,ft): return d.textlength(t,font=ft)
def wrap(d,t,ft,maxw):
    words=t.split(); lines=[]; cur=""
    for w in words:
        test=(cur+" "+w).strip()
        if tw(d,test,ft)<=maxw: cur=test
        else:
            if cur: lines.append(cur)
            cur=w
    if cur: lines.append(cur)
    return lines
def draw_center(d,cx,y,t,ft,fill,ls=0):
    if ls:
        total=sum(tw(d,c,ft)+ls for c in t)-ls
        x=cx-total/2
        for c in t:
            d.text((x,y),c,font=ft,fill=fill); x+=tw(d,c,ft)+ls
    else:
        d.text((cx-tw(d,t,ft)/2,y),t,font=ft,fill=fill)
def block_center(d,cx,y,lines,ft,fill,lh):
    for ln in lines:
        draw_center(d,cx,y,ln,ft,fill); y+=lh
    return y

def base(eyebrow=True):
    im=Image.new("RGB",(W,H),INK); d=ImageDraw.Draw(im)
    if eyebrow:
        draw_center(d,W/2,120,"LUXURY CATALOG   THE DATA",f(SANS,26),GOLD,ls=6)
        d.line((W/2-40,170,W/2+40,170),fill=GOLD,width=2)
    return im,d
def footer(d,brand=True,follow=None):
    y=H-150
    # gold diamond
    cx=W/2
    d.polygon([(cx,y-14),(cx+11,y),(cx,y+14),(cx-11,y)],fill=GOLD)
    if follow:
        draw_center(d,W/2,y+30,follow,f(SANS,30),MUTED,ls=2)
    if brand:
        draw_center(d,W/2,y+ (70 if follow else 30),"luxurycatalog.com",f(SANS,28),IVORY,ls=3)

# ---------- HERO: Chanel Classic Flap leather/hardware spread ----------
# Slide 1 cover (question)
im,d=base()
lines=wrap(d,"Same Chanel flap. Same size. Why do two sell $2,500 apart?",f(SERB,74),W-200)
block_center(d,W/2,430,lines,f(SERB,74),IVORY,90)
draw_center(d,W/2,H-250,"swipe to see what moves the price",f(SERI,34),MUTED)
footer(d)
im.save(f"{SP}/hero1.png")

# Slide 2
im,d=base()
lines=wrap(d,"It isn't the size.",f(SERB,80),W-200)
y=block_center(d,W/2,360,lines,f(SERB,80),IVORY,96)
lines2=wrap(d,"It's the leather and the hardware.",f(SERB,80),W-220)
block_center(d,W/2,y+30,lines2,f(SERB,80),GOLD,96)
draw_center(d,W/2,y+300,"two Mediums, same shape, different skin",f(SERI,34),MUTED)
footer(d)
im.save(f"{SP}/hero2.png")

# Slide 3 data
im,d=base()
draw_center(d,W/2,250,"Chanel Classic Flap",f(SERB,56),IVORY)
draw_center(d,W/2,320,"Medium",f(SERI,40),MUTED)
# rows
def row(y,label_lines,val):
    lyf=f(SANS,40); vf=f(SERB,88)
    yy=y
    for ln in label_lines:
        d.text((130,yy),ln,font=lyf,fill=IVORY); yy+=50
    draw_center(d,W-300,y-6,val,vf,GOLD)
d.line((130,470,W-130,470),fill=LINE,width=2)
row(540,["Caviar leather","gold hardware"],"$7,200")
d.line((130,690,W-130,690),fill=LINE,width=2)
row(760,["Lambskin leather","silver hardware"],"$4,700")
d.line((130,910,W-130,910),fill=LINE,width=2)
cap=wrap(d,"Median resale ask, TheRealReal, June 2026 (n=116). Our estimate from live listings, not an appraisal. Refresh before you buy.",f(SANS,26),W-260)
block_center(d,W/2,975,cap,f(SANS,26),MUTED,38)
footer(d,brand=False)
im.save(f"{SP}/hero3.png")

# Slide 4 worth-it hedge
im,d=base()
lines=wrap(d,"Buying to hold value? Caviar and gold held strongest in our data.",f(SERB,60),W-200)
y=block_center(d,W/2,320,lines,f(SERB,60),IVORY,76)
lines2=wrap(d,"Just love lambskin? That's worth it to you too.",f(SERB,60),W-200)
y=block_center(d,W/2,y+40,lines2,f(SERB,60),GOLD,76)
draw_center(d,W/2,y+60,"Your call, not a verdict.",f(SERI,42),MUTED)
footer(d,brand=False)
im.save(f"{SP}/hero4.png")

# Slide 5 CTA
im,d=base()
lines=wrap(d,"The full leather-by-leather breakdown is on Luxury Catalog.",f(SERB,66),W-200)
block_center(d,W/2,400,lines,f(SERB,66),IVORY,82)
footer(d,follow="FOLLOW FOR THE DATA BEHIND EVERY BAG")
im.save(f"{SP}/hero5.png")

# ---------- SIGNATURE cover ----------
im,d=base(eyebrow=False)
draw_center(d,W/2,150,"LUXURY CATALOG",f(SANS,28),GOLD,ls=8)
lines=wrap(d,"The bags behind the brand",f(SERB,88),W-160)
y=block_center(d,W/2,470,lines,f(SERB,88),IVORY,104)
draw_center(d,W/2,y+30,"a few from my own collection",f(SERI,40),MUTED)
draw_center(d,W/2,H-250,"swipe",f(SANS,30),GOLD,ls=6)
footer(d,brand=True)
im.save(f"{SP}/sig_cover.png")

print("slides done:", sorted(os.listdir(SP)))
