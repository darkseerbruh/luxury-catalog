#!/usr/bin/env python3
import os, sys, textwrap
from PIL import Image, ImageDraw, ImageFont
P = os.path.expanduser("~/Documents/handbag-products/_clean")

def font(sz, bold=False):
    for fp in ["/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
               "/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(fp):
            try: return ImageFont.truetype(fp, sz)
            except: pass
    return ImageFont.load_default()

def path(idn):
    for d in ("good","thumbnails"):
        p=os.path.join(P,d,f"IMG_{idn}.jpg")
        if os.path.exists(p): return p
    return None

# (id, label, confident?)
HERMES=[
 ("7601","Kelly long wallet · teal · gold hw",1),
 ("7607","Kelly Sellier ~25 · rose pink · gold hw",1),
 ("7614","Kelly ~28 · raspberry · gold hw",1),
 ("7615","Kelly Sellier ~28 · Rouge H box · gold hw",1),
 ("7620","Kelly Retourne ~32 · pink togo · palladium hw",1),
 ("7634","Birkin 25 Swift · red · palladium (tag: 'Swift Birkin')",1),
 ("7637","Birkin · anise green · palladium hw",1),
 ("7640","Birkin ~35 · red togo · palladium hw",1),
 ("7645","Birkin HIMALAYA · crocodile · palladium hw",1),
 ("7815","Roulis · purple ostrich · palladium hw",1),
 ("7820","Evelyne · red (perforated H)",1),
 ("7850","Lindy · blue · palladium hw",1),
 ("7824","Constance ~24 · rose pink · palladium hw",1),
 ("7829","Constance · bright blue · gold hw",1),
 ("7833","Constance SIZE COMPARISON (blue + pink)",1),
 ("7834","Picotin Lock? · lime green",0),
 ("7837","tan Hermes · 24/24 or Garden Party?",0),
 ("7843","tan box-leather Hermes · structured",0),
 ("7846","burgundy Hermes · Halzan?",0),
 ("7853","Hermes 2002 · tan/gold",0),
 ("7814","mixed Hermes thumbs · Constance + others?",0),
]
OTHER=[
 ("4203","YSL Kate · suede/pony?",0),
 ("4209","YSL Sunset · black grained",1),
 ("4211","YSL Sunset? · black",0),
 ("4207","YSL Kate · tweed + velvet (2 colors)",1),
 ("8201","Chanel Classic Flap · iridescent caviar",1),
 ("2919","Chanel WOC / wallet?",0),
 ("8196","Chanel Boy",1),
 ("3305","Chanel belt/bum · emerald (your call)",1),
 ("1734","Chanel seasonal · 'wallet' in name?",0),
]

def build(items, out, title):
    cols=4; cw=440; cell_img=300; lab_h=64; pad=14; th=54
    rows=(len(items)+cols-1)//cols
    W=cols*cw+(cols+1)*pad
    H=th+rows*(cell_img+lab_h+pad)+pad
    sheet=Image.new("RGB",(W,H),(247,246,244))
    d=ImageDraw.Draw(sheet)
    d.text((pad,14),title,fill=(20,20,20),font=font(24,bold=True))
    d.text((pad,40),"green dot = fairly confident   amber dot = best guess, verify",fill=(110,110,110),font=font(13))
    for i,(idn,label,conf) in enumerate(items):
        r,c=divmod(i,cols)
        x=pad+c*(cw+pad); y=th+r*(cell_img+lab_h+pad)+pad
        p=path(idn)
        if p:
            im=Image.open(p).convert("RGB"); im.thumbnail((cw,cell_img))
            sheet.paste(im,(x+(cw-im.width)//2,y+(cell_img-im.height)//2))
        dot=(46,160,67) if conf else (224,168,0)
        d.ellipse([x,y+cell_img+8,x+12,y+cell_img+20],fill=dot)
        d.text((x+18,y+cell_img+6),f"IMG_{idn}",fill=(0,0,0),font=font(14,bold=True))
        wrapped=textwrap.wrap(label,width=46)[:2]
        for li,ln in enumerate(wrapped):
            d.text((x,y+cell_img+26+li*16),ln,fill=(55,55,55),font=font(13))
    sheet.save(out,quality=92)
    print("wrote",out)

build(HERMES, os.path.join(P,"_GUESSES_hermes.jpg"), "Hermes — name/size/color guesses (check vs photo)")
build(OTHER, os.path.join(P,"_GUESSES_other.jpg"), "Other brands — name guesses (check vs photo)")
