import json,re,difflib
from collections import defaultdict
rows=json.load(open("parsed3.json"))

# --- OCR text fixes ---
def fix(t):
    s=" "+t+" "
    subs=[(r'\bIv\b','LV'),(r'\bIV\b','LV'),(r'\blv\b','LV'),(r'\bliv\b','LV'),
          (r'louls','louis'),(r'tlap','flap'),(r'tavorite','favorite'),
          (r'Micheal','Michael'),(r'\bti speedy','LV speedy'),
          (r'vanny vays','vanity bags'),(r'\bysi\b','ysl'),(r'\bYsl\b','YSL'),(r'\bysl\b','YSL'),
          (r'nermes','hermes'),(r'cuacn','coach'),(r'CHUlY pUISES','thrifting purses'),
          (r'crean','clean'),(r'yonna','donna'),(r'howls','howl\'s'),(r'\bLv\b','LV')]
    for a,b in subs: s=re.sub(a,b,s)
    s=re.sub(r'\s+',' ',s).strip()
    return s

# --- garbage fragments to drop (OCR noise / non-terms) ---
GARBAGE=set(x.lower() for x in [
 "cnn pcyr iyolai purse","p9 louis vuitton","1/Un best lv bags to get Iv denim bags",
 "•1l- louis vuitton microscopic bag","= v/.L/U hermes shopping hermes store how does hermes work Chanel flap",
 "real louis vuitton mini louis vuitton bag b 280K louis vuitton purses 1990 louis vuitton",
 "goyard side bag b 425K goyard prices","goyard pink bag limited edition $ 297K l goyard alpine backpack",
 "crean cuacn purse yonna coach purse","Go yard","pink louls vuitton",
])
def is_garbage(t):
    tl=t.lower()
    if tl in GARBAGE: return True
    # too much non-alpha noise
    letters=sum(c.isalpha() or c==' ' for c in t)
    if len(t)>0 and letters/len(t)<0.7: return True
    if re.search(r'\b[a-z]*[0-9]+[a-z]+\b',t.lower()) and 'lv' not in t.lower(): pass
    if re.search(r'[A-Z]{2,}[a-z]',t) and len(t.split())<=1: return True
    return False

clean=[]
for r in rows:
    t=fix(r["term"])
    if is_garbage(t): continue
    clean.append({"term":t,"pop":r["pop"],"pct":r["pct"],"nframes":r["nframes"]})

# --- fuzzy merge near-duplicates ---
clean.sort(key=lambda r:-(r["pop"] or 0))
merged=[]
def norm(s): return re.sub(r'[^a-z0-9 ]','',s.lower())
for r in clean:
    placed=False
    for m in merged:
        a,b=norm(r["term"]),norm(m["term"])
        ratio=difflib.SequenceMatcher(None,a,b).ratio()
        popclose = (r["pop"] and m["pop"] and abs(r["pop"]-m["pop"])/max(r["pop"],m["pop"])<0.05) or (r["pop"] is None or m["pop"] is None)
        if ratio>0.90 and (popclose or a==b):
            # keep longer/cleaner term, better pop, keep pct if missing
            if r["pop"] and (not m["pop"] or m["pop"]<r["pop"]): pass
            if not m["pct"] and r["pct"]: m["pct"]=r["pct"]
            if m["pop"] is None and r["pop"]: m["pop"]=r["pop"]
            m["nframes"]+=r["nframes"]
            # prefer term with more lowercase real words / longer
            if len(r["term"])>len(m["term"]) and r["pop"]==m["pop"]: m["term"]=r["term"]
            placed=True; break
    if not placed: merged.append(dict(r))

# --- brand tagging ---
BRANDS=[("Hermès",["hermes","birkin","kelly","picotin","constance","lindy","himalayan","togo","chypre","sellier"]),
 ("Chanel",["chanel"]),("Louis Vuitton",["louis vuitton","LV ","speedy","neverfull","pochette","alma","papillon","capucines","neonoe","montsouris","bumbag","boulogne","artsy","carryall","favorite mm","all in bb"]),
 ("Dior",["dior"]),("Gucci",["gucci","dionysus","ophidia","marmont","jackie","1947"]),
 ("Goyard",["goyard","anjou","artois","st louis"]),("Coach",["coach","tabby","rogue","nolita","etta"]),
 ("Balenciaga",["balenciaga","rodeo"]),("YSL",["ysl","saint laurent","cassandre","niki","kate","loulou"]),
 ("Celine",["celine","phantom","luggage"]),("Prada",["prada","cleo","bonnie","arque"]),
 ("Fendi",["fendi","peekaboo","baguette","fendigraphy"]),("Loewe",["loewe","puzzle","squeeze","amazona"]),
 ("Bottega",["bottega","jodie"]),("Miu Miu",["miu miu"]),("Telfar",["telfar"]),
 ("Givenchy",["givenchy","antigona","voyou","nightingale"]),("Jacquemus",["jacquemus","bambino","valerie"]),
 ("The Row",["the row","marlo"]),("Valentino",["valentino","garavani"]),("Margiela",["margiela"]),
 ("McQueen",["mcqueen"]),("Mulberry",["mulberry"]),("Chloé",["chloe","betty"]),("Michael Kors",["michael kors"]),
 ("Gerard Darel",["gerard darel"]),("Marc Jacobs",["marc jacobs"]),("Tom Ford",["tom ford"])]
def brandtag(t):
    tl=" "+t.lower()+" "
    for name,kw in BRANDS:
        for k in kw:
            if k.lower() in tl: return name
    if any(w in tl for w in ["thrift","thrifting","tj maxx","amazon","luxury","designer","purse","vintage","status","diaper","backpack","tote","handbag","resell","selling","pre owned"]):
        return "General / multi-brand"
    return "Other"

for m in merged:
    m["brand"]=brandtag(m["term"])

# --- saturation-check priority ---
# brands we actively cover / have pages for = higher content ROI
CORE={"Hermès","Chanel","Coach"}
STRONG={"Louis Vuitton","Dior","Gucci","Goyard"}
def pctnum(p):
    if not p: return 0
    if "1000" in p: return 1000
    m=re.match(r'([\d.]+)',p); return float(m.group(1)) if m else 0
def prio(m):
    pop=m["pop"] or 0
    score=pop/1000.0                      # base = popularity in K
    g=pctnum(m["pct"])
    score+= min(g,1000)*0.15              # trending boost
    if m["brand"] in CORE: score*=1.6
    elif m["brand"] in STRONG: score*=1.25
    elif m["brand"]=="General / multi-brand": score*=1.1
    elif m["brand"]=="Other": score*=0.6
    # comparison / question / worth-it terms = great content angles
    if re.search(r'\bvs\b|worth|why|how much|price|cost|real|fake|thrift|review|best|hierarchy',m["term"].lower()):
        score*=1.35
    return round(score,1)
for m in merged:
    m["prio"]=prio(m)

merged.sort(key=lambda r:-(r["pop"] or -1))
json.dump(merged,open("clean.json","w"),indent=1)
print(f"CLEANED unique terms: {len(merged)}  (numbered: {sum(1 for m in merged if m['pop'])})")
# tier counts
def tier(p):
    if p is None: return "?"
    if p>=1e6: return "1M+"
    if p>=500e3: return "500K-1M"
    if p>=300e3: return "300-500K"
    if p>=200e3: return "200-300K"
    if p>=100e3: return "100-200K"
    return "<100K"
from collections import Counter
print("By tier:",dict(Counter(tier(m["pop"]) for m in merged)))
print("By brand:",dict(Counter(m["brand"] for m in merged).most_common()))
