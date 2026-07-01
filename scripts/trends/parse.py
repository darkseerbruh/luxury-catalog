import re, json
from collections import defaultdict, Counter

CHROME={"saved","topics","outlines","canvas"}
def is_chrome(s):
    l=s.strip().lower()
    return l in CHROME or ":" in s or l.startswith("no more")
def clean_num(s):
    t=s.strip().strip("•,.-A$l|= ").strip()
    m=re.match(r'^([\d][\d.,]*)\s*([KM])?\.?$', t)
    if not m: return None
    num=float(m.group(1).replace(",","")); u=m.group(2)
    if u=="K": num*=1e3
    elif u=="M": num*=1e6
    return num
def get_pct(s):
    if "%" not in s: return None
    m=re.search(r'(1000%\+|\d[\d.]*%\+?)', s.replace(" ",""))
    return m.group(1) if m else None
def is_term(s):
    if is_chrome(s) or "%" in s: return False
    if clean_num(s) is not None: return False
    if not re.search(r'[a-z]', s): return False
    if len(s.strip())<4: return False
    if re.match(r'^[A-Za-z]{1,3}$', s.strip()): return False
    return True

frames=open("ocr_all.txt").read().split("=====")
pop_by=defaultdict(list); pct_by=defaultdict(list); frames_by=defaultdict(set); disp={}

for fi,fr in enumerate(frames):
    items=[]
    for l in fr.strip().splitlines():
        if "\t" not in l: continue
        ys,txt=l.split("\t",1); txt=txt.strip()
        if is_chrome(txt): continue
        items.append((float(ys),txt))
    # classify
    terms=[]; nums=[]; pcts=[]
    for y,txt in items:
        p=get_pct(txt)
        if p is not None: pcts.append((y,p)); continue
        n=clean_num(txt)
        if n is not None: nums.append((y,n)); continue
        if is_term(txt): terms.append((y,txt))
    terms.sort(key=lambda t:-t[0])
    for i,(ty,txt) in enumerate(terms):
        y_below = terms[i+1][0] if i+1<len(terms) else -1.0
        key=re.sub(r'\s+',' ',txt.lower()); disp.setdefault(key,txt)
        frames_by[key].add(fi)
        # number in band (below term, above next term)
        band_nums=[n for (ny,n) in nums if y_below < ny < ty]
        band_pcts=[p for (py,p) in pcts if y_below < py < ty]
        if band_nums: pop_by[key].append(band_nums[0])
        if band_pcts: pct_by[key].append(band_pcts[0])

rows=[]
for key in disp:
    pops=pop_by.get(key,[])
    pop=Counter(pops).most_common(1)[0][0] if pops else None
    pcts=pct_by.get(key,[])
    pct=Counter(pcts).most_common(1)[0][0] if pcts else None
    rows.append({"term":disp[key],"pop":pop,"pct":pct,"nframes":len(frames_by[key])})
rows.sort(key=lambda r:-(r["pop"] if r["pop"] is not None else -1))
def fmt(n):
    if n is None: return "  ??  "
    if n>=1e6: return f"{n/1e6:.2f}M"
    if n>=1e3: return f"{n/1e3:.1f}K"
    return str(int(n))
known=[r for r in rows if r["pop"] is not None]
unk=[r for r in rows if r["pop"] is None]
print(f"TOTAL unique: {len(rows)} | numbered: {len(known)} | no-number: {len(unk)}")
json.dump(rows,open("parsed3.json","w"),indent=1)
print("saved parsed3.json")
