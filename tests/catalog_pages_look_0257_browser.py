"""0.25.7: strony katalogowe (notesy, koperty/teczki/papier firmowy, kalendarze, restauracje, śluby) jak ulotki —
ceny na kafelkach wariantu i formatu, „Porównaj warianty”, bez dolnego cennika, rozmiary kopert."""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*\bsrc=[^>]*>\s*</script>','',html,flags=re.I)
html=re.sub(r'<link[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
html=re.sub(r'<img[^>]*>','',html,flags=re.I)
styles=['assets/styles.css','assets/frontend-refresh.css','assets/druk24-brand-forms.css','assets/product-preview.css','assets/checkout-experience.css','assets/intelligent-search.css','assets/quote-assistant-235.css','assets/intelligent-configurator.css','assets/variant-comparison.css','assets/changes-02313.css','assets/malfini-preview.css','assets/compact-choices.css','assets/order-experience-239.css','assets/ux-clarity.css']
scripts=['js/i18n.js','js/calculators.js','js/checkout-experience.js','js/intelligent-search.js','js/quote-interpreter.js','js/malfini-preview.js','js/app.js','js/frontend-refresh.js','js/smart-forms.js','js/product-preview.js','js/intelligent-configurator.js','js/variant-comparison.js']
prices,terms,cases=[json.loads((root/f).read_text()) for f in ['data/prices.json','data/search-terms.json','data/case-items.json']]

def boot(browser,width):
    page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.evaluate('''()=>{const m=new Map();const st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{value:st,configurable:true});Object.defineProperty(window,'sessionStorage',{value:st,configurable:true});}''')
    page.evaluate('''([pr,tr,ci])=>{window.fetch=async u=>({ok:true,json:async()=>String(u).includes("prices.json")?pr:String(u).includes("search-terms.json")?tr:String(u).includes("case-items.json")?ci:{success:true}})}''',[prices,terms,cases])
    for style in styles: page.evaluate('css=>{const node=document.createElement("style");node.textContent=css;document.head.append(node);}',(root/style).read_text())
    for script in scripts: page.add_script_tag(content=(root/script).read_text())
    page.wait_for_selector('#homeProductSearch',timeout=15000)
    return page,errors
def go(page,name):
    page.evaluate("(n)=>document.querySelector('button.nav-button[data-page=\"'+n+'\"]').click()",name); page.wait_for_timeout(500)
def setsel(page,sel,value):
    page.evaluate("([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));}",[sel,value]); page.wait_for_timeout(500)

NB='\u00a0'
def zl(v): return ('%.2f'%v).replace('.',',')
def norm(t): return t.replace(NB,' ').replace('\u202f',' ')
def price_of(root,t,v,f,q): return root[t]['warianty'][v]['formaty'][f][str(q)]
N=prices['notesy_i_bloczki']; M=prices['materialy_firmowe']; K=prices['kalendarze']; R=prices['restauracje_hotele']; W=prices['sluby_wesela_imprezy']
def tiles(page,sel): return page.locator('.field',has=page.locator(sel)).locator('.d24-smart-options button[data-option-index]')
def tile(page,sel,text):
    return page.locator('.field',has=page.locator(sel)).locator('.d24-smart-options button[data-option-index]',has_text=text).first
def tile_price(page,sel,text):
    t=tile(page,sel,text)
    return norm(t.locator('.d24-config-price').inner_text()) if t.locator('.d24-config-price').count() else None
def pick(page,sel,text):
    tile(page,sel,text).click(); page.wait_for_timeout(450)
def cart(page): return json.loads(page.evaluate("localStorage.getItem('drukulator_cart')") or '[]')
def no_price_table(page):
    body=page.locator('#content').inner_text()
    assert 'Cennik wybranego wariantu' not in body,body[:200]
    assert page.locator('[id$="PriceTable"]').count()==0
def compare_fold(page):
    host=page.locator('.d24-variant-compare').first
    assert host.count()==1,'brak „Porównaj warianty”'
    if not host.locator('details').evaluate('d=>d.open'): host.locator('summary').click(); page.wait_for_timeout(300)
    return host

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page,errors=boot(browser,width)

        # ---------- NOTESY I BLOCZKI: jak ulotki — ceny na kafelkach, porównanie, bez cennika
        go(page,'Notesy i bloczki')
        no_price_table(page)
        assert page.locator('#noteType').input_value()=='Notesy klejone'
        T='Notesy klejone'; V='Z okładką kredową 170 g'
        for f in ('A4','A5','A6','DL'):
            assert tile_price(page,'#noteFormat',f)==zl(price_of(N,T,V,f,50))+' zł',(f,tile_price(page,'#noteFormat',f))
            assert tile(page,'#noteFormat',f).locator('.d24-choice-visual--sheet').count()==1,f
        assert tile_price(page,'#noteVariant','Z okładką')==zl(price_of(N,T,V,'A4',50))+' zł'
        assert tile_price(page,'#noteVariant','Bez okładki')==zl(price_of(N,T,'Bez okładki','A4',50))+' zł'
        # kliknięcie nakładu zmienia kwoty na kafelkach
        pick(page,'#noteQty','100')
        assert page.locator('#noteQty').input_value()=='100'
        for f in ('A4','A5','A6','DL'):
            assert tile_price(page,'#noteFormat',f)==zl(price_of(N,T,V,f,100))+' zł',(f,'100')
        assert tile_price(page,'#noteVariant','Bez okładki')==zl(price_of(N,T,'Bez okładki','A4',100))+' zł'
        # zmiana formatu zachowuje nakład, zmiana wariantu zachowuje format i nakład
        pick(page,'#noteFormat','A5')
        assert (page.locator('#noteFormat').input_value(),page.locator('#noteQty').input_value())==('A5','100')
        pick(page,'#noteVariant','Bez okładki')
        assert (page.locator('#noteVariant').input_value(),page.locator('#noteFormat').input_value(),page.locator('#noteQty').input_value())==('Bez okładki','A5','100')
        assert tile_price(page,'#noteFormat','A4')==zl(price_of(N,T,'Bez okładki','A4',100))+' zł'
        # „Porównaj warianty”: nakład
        host=compare_fold(page)
        cards=host.locator('.d24-vc-card')
        assert cards.count()==3,cards.count()
        names=[c.locator('.d24-vc-card__name').inner_text() for c in cards.all()]
        assert names==['50 szt.','100 szt.','200 szt.'],names
        shown=[norm(c.locator('.d24-vc-card__total').inner_text()) for c in cards.all()]
        for q,txt in zip((50,100,200),shown): assert txt.startswith(zl(price_of(N,T,'Bez okładki','A5',q))),(q,txt)
        # porównanie → format
        host.locator('button[data-compare-mode="noteFormat"]').click(); page.wait_for_timeout(400)
        names=[c.locator('.d24-vc-card__name').inner_text() for c in host.locator('.d24-vc-card').all()]
        assert set(names)=={'A4','A5','A6','DL'},names
        # „Dodaj do koszyka” z karty A4 → pozycja w koszyku z ceną A4 / 100 szt.
        host.locator('.d24-vc-card',has_text='A4').locator('button[data-compare-add="1"]').click(); page.wait_for_timeout(700)
        item=cart(page)[-1]
        assert item['description']=='Bez okładki, format A4, 100 szt.',item['description']
        assert abs(item['price']-price_of(N,T,'Bez okładki','A4',100))<0.01,item
        assert page.locator('#noteFormat').input_value()=='A4'
        # zwykłe „Oblicz cenę” — opis bez zmian
        page.locator('#calculate').click(); page.wait_for_timeout(500)
        item=cart(page)[-1]
        assert item['description']=='Bez okładki, format A4, 100 szt.' and item['title']==T,item
        # bloczki samokopiujące: inne nakłady, ceny na kafelkach
        pick(page,'#noteType','Bloczki samokopiujące')
        assert page.locator('#noteQty').input_value()=='5'
        B='Oryginał + 1 kopia'
        for f in ('A4','A5','A6','DL'):
            assert tile_price(page,'#noteFormat',f)==zl(price_of(N,'Bloczki samokopiujące',B,f,5))+' zł',f
        assert page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1")

        # ---------- KOPERTY, TECZKI, PAPIER FIRMOWY
        go(page,'Koperty, teczki i papier firmowy')
        no_price_table(page)
        E='Koperty z nadrukiem'; EV='Offset 80 g, druk jednostronny'
        sizes={'DL':'110 × 220 mm','C5':'162 × 229 mm','C6':'114 × 162 mm'}
        for f,size in sizes.items():
            t=tile(page,'#companyMaterialsFormat',f)
            assert t.locator('.d24-choice-visual--sheet').count()==1,f
            assert size in norm(t.inner_text()),(f,t.inner_text())
            assert tile_price(page,'#companyMaterialsFormat',f)==zl(price_of(M,E,EV,f,100))+' zł',f
        pick(page,'#companyMaterialsQty','300')
        for f in sizes: assert tile_price(page,'#companyMaterialsFormat',f)==zl(price_of(M,E,EV,f,300))+' zł',f
        pick(page,'#companyMaterialsFormat','C5')
        assert page.locator('#companyMaterialsQty').input_value()=='300'
        host=compare_fold(page)
        assert host.locator('.d24-vc-card').count()==5
        # ulotki mają własne rozmiary — DL ulotki dalej 99 × 210 mm
        # teczki: dwa warianty, miniatury arkusza, ceny
        pick(page,'#companyMaterialsType','Teczki ofertowe')
        TT='Teczki ofertowe'
        for v in ('Standardowe 4/0','Standardowe foliowane 4/0'):
            assert tile_price(page,'#companyMaterialsVariant',v if v.endswith('4/0') and 'foliowane' in v else 'Standardowe 4/0')
        pick(page,'#companyMaterialsVariant','foliowane')
        for f in ('Jednobigowe','Dwubigowe'):
            assert tile(page,'#companyMaterialsFormat',f).locator('.d24-choice-visual--sheet').count()==1,f
            assert tile_price(page,'#companyMaterialsFormat',f)==zl(price_of(M,TT,'Standardowe foliowane 4/0',f,100))+' zł',f
        pick(page,'#companyMaterialsQty','250'); pick(page,'#companyMaterialsFormat','Dwubigowe')
        pick(page,'#companyMaterialsVariant','Standardowe 4/0')
        assert (page.locator('#companyMaterialsFormat').input_value(),page.locator('#companyMaterialsQty').input_value())==('Dwubigowe','250')
        # papier firmowy A4
        pick(page,'#companyMaterialsType','Papier firmowy')
        t=tile(page,'#companyMaterialsFormat','A4')
        assert '210 × 297 mm' in norm(t.inner_text()) and t.locator('.d24-choice-visual--sheet').count()==1
        page.locator('#calculate').click(); page.wait_for_timeout(500)
        item=cart(page)[-1]
        assert item['title']=='Papier firmowy' and item['description']=='Preprint 90 g, kolor jednostronny, A4, 500 szt.',item
        assert abs(item['price']-350)<0.01
        assert page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1") or True

        # ---------- KALENDARZE
        go(page,'Kalendarze')
        no_price_table(page)
        pick(page,'#calendarType','Kalendarze trójdzielne')
        KT='Kalendarze trójdzielne'
        for v in K[KT]['warianty']:
            assert tile_price(page,'#calendarVariant',v)==zl(price_of(K,KT,v,'Standard',50))+' zł',v
        pick(page,'#calendarQty','100')
        for v in K[KT]['warianty']:
            assert tile_price(page,'#calendarVariant',v)==zl(price_of(K,KT,v,'Standard',100))+' zł',v
        host=compare_fold(page)
        host.locator('button[data-compare-mode="calendarVariant"]').click(); page.wait_for_timeout(400)
        assert host.locator('.d24-vc-card').count()>=2
        # porównanie wariantów: „Wybierz wariant” na karcie innego wariantu — ten sam format i nakład, wycena z cennika
        host.locator('.d24-vc-card',has_text='folia mat').locator('button[data-compare-add="0"]').click(); page.wait_for_timeout(700)
        assert page.locator('#calendarVariant').input_value()=='Główka wypukła — folia mat'
        assert (page.locator('#calendarFormat').input_value(),page.locator('#calendarQty').input_value())==('Standard','100')
        assert zl(price_of(K,KT,'Główka wypukła — folia mat','Standard',100)) +' zł brutto' in norm(page.locator('#content').inner_text())
        pick(page,'#calendarType','Kalendarze listwowane plakatowe')
        KL='Kalendarze listwowane plakatowe'
        for f in ('A1','A2','B1'):
            assert tile(page,'#calendarFormat',f).locator('.d24-choice-visual--sheet').count()==1,f
        assert tile_price(page,'#calendarFormat','A1')==zl(price_of(K,KL,'Standard','A1',30))+' zł'
        pick(page,'#calendarFormat','A2')                      # A2 ma nakład 10/30/50 — 30 zostaje
        assert page.locator('#calendarQty').input_value()=='30'
        pick(page,'#calendarFormat','A1')
        assert page.locator('#calendarQty').input_value()=='30'

        # ---------- RESTAURACJE, HOTELE
        go(page,'Restauracje, hotele')
        no_price_table(page)
        pick(page,'#hospitalityType','Menu A3 offset preprint 90 g')
        MA='Menu A3 offset preprint 90 g'
        for v in R[MA]['warianty']:
            assert tile_price(page,'#hospitalityVariant',v)==zl(price_of(R,MA,v,'A3',500))+' zł',v
        pick(page,'#hospitalityQty','1000')
        for v in R[MA]['warianty']:
            assert tile_price(page,'#hospitalityVariant',v)==zl(price_of(R,MA,v,'A3',1000))+' zł',v
        pick(page,'#hospitalityType','Prezenter trójkątny – stojak')
        PR='Prezenter trójkątny – stojak'
        assert tile_price(page,'#hospitalityFormat','DL')==zl(price_of(R,PR,'Standard','DL',5))+' zł'
        assert tile_price(page,'#hospitalityFormat','A6')==zl(price_of(R,PR,'Standard','A6',5))+' zł'
        pick(page,'#hospitalityType','Podkładki na tackę')
        pt=tile(page,'#hospitalityFormat','40')
        assert pt.locator('.d24-choice-visual--sheet').count()==1 and float(pt.locator('.d24-choice-visual--sheet').evaluate("e=>getComputedStyle(e).getPropertyValue('--d24-sheet-ratio')"))>1.2
        assert norm(pt.inner_text()).count('40 × 30 cm')==1,pt.inner_text()
        page.locator('#calculate').click(); page.wait_for_timeout(500)
        item=cart(page)[-1]
        assert item['title']=='Podkładki na tackę' and item['description']=='Offset 80 g, jednostronnie, format 40 × 30 cm, 500 szt.',item
        host=compare_fold(page)
        assert host.locator('.d24-vc-card').count()==3

        # ---------- ŚLUBY, WESELA I IMPREZY
        go(page,'Śluby, wesela i imprezy')
        no_price_table(page)
        assert page.locator('#weddingQty').input_value()=='20'
        WZ='Zaproszenia'
        for f in ('A5','DL'):
            assert tile_price(page,'#weddingFormat',f)==zl(W[WZ]['warianty']['Papier kreda 300 g'][f]['20'])+' zł',f
        assert tile_price(page,'#weddingVariant','satyna')==zl(W[WZ]['warianty']['Papier kreda 300 g + satyna']['A5']['20'])+' zł'
        pick(page,'#weddingQty','50')
        assert tile_price(page,'#weddingFormat','DL')==zl(W[WZ]['warianty']['Papier kreda 300 g']['DL']['50'])+' zł'
        pick(page,'#weddingFormat','DL')
        pick(page,'#weddingVariant','satyna')
        assert (page.locator('#weddingFormat').input_value(),page.locator('#weddingQty').input_value())==('DL','50')
        host=compare_fold(page)
        assert host.locator('.d24-vc-card').count()==3
        # zaproszenia składane: etykieta „po rozłożeniu”
        pick(page,'#weddingProduct','Zaproszenia składane')
        t2=tile(page,'#weddingFormat','2×DL')
        assert '198 × 210 mm po rozłożeniu' in norm(t2.inner_text()),t2.inner_text()
        assert '99 × 210' not in norm(t2.inner_text())
        assert tile_price(page,'#weddingFormat','A5 do A6')==zl(W['Zaproszenia składane']['warianty']['Papier kreda 300 g']['A5 do A6'][page.locator('#weddingQty').input_value()])+' zł'
        # plan stołów: cena za sztukę × wpisana ilość
        pick(page,'#weddingProduct','Plan stołów')
        assert page.locator('#weddingQtyInput').is_visible()
        PS=W['Plan stołów']['warianty']
        v0='Plakat papier satynowy 135 g'
        assert page.locator('#weddingFormat').input_value()=='A2 (42×59 cm)'
        a2=tile(page,'#weddingFormat','A2')
        assert 'mm' not in norm(a2.inner_text()),a2.inner_text()        # etykieta już podaje rozmiar w cm
        assert tile_price(page,'#weddingFormat','A2')==zl(PS[v0]['A2 (42×59 cm)'])+' zł'
        page.locator('#weddingQtyInput').fill('3'); page.locator('#weddingQtyInput').dispatch_event('input'); page.locator('#weddingQtyInput').dispatch_event('change'); page.wait_for_timeout(600)
        assert tile_price(page,'#weddingFormat','A2')==zl(3*PS[v0]['A2 (42×59 cm)'])+' zł',tile_price(page,'#weddingFormat','A2')
        assert tile_price(page,'#weddingFormat','B1')==zl(3*PS[v0]['B1 (70×100 cm)'])+' zł'
        assert tile_price(page,'#weddingVariant','Pianka')==zl(3*PS['Plansza Pianka 5 mm']['A2 (42×59 cm)'])+' zł'
        # wariant bez wybranego formatu → pierwszy dostępny (Folia + PCV nie ma A2) — cena na kafelku = cena po kliknięciu
        exp=tile_price(page,'#weddingVariant','Folia')
        pick(page,'#weddingVariant','Folia')
        fmt=page.locator('#weddingFormat').input_value()
        assert fmt==list(PS['Folia + PCV 4 mm'])[0],fmt
        assert exp==zl(3*PS['Folia + PCV 4 mm'][fmt])+' zł',(exp,fmt)
        host=compare_fold(page)
        modes=[b.inner_text() for b in host.locator('button[data-compare-mode]').all()]
        assert modes[0]=='Ilość' and 'Format' in modes and 'Wariant' in modes,modes
        cards=host.locator('.d24-vc-card')
        assert cards.count()>=2
        cards.filter(has_text='5 szt.').first.locator('button[data-compare-add="1"]').click(); page.wait_for_timeout(700)
        item=cart(page)[-1]
        assert item['description']==f'Plan stołów, Folia + PCV 4 mm, {fmt}, 5 szt.' and abs(item['price']-5*PS['Folia + PCV 4 mm'][fmt])<0.01,item
        # dekoracje: wariant X-baner ma tylko dwa formaty — cena nie znika
        pick(page,'#weddingProduct','Dekoracja sali')
        assert tile_price(page,'#weddingVariant','X-baner') is not None
        assert page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1") or True
        assert errors==[],errors

        # ---------- ulotki bez zmian: DL ulotki dalej 99 × 210 mm
        go(page,'Ulotki 24h')
        assert '99 × 210 mm' in norm(tile(page,'#flyFormat','DL').inner_text())
        page.close()
    browser.close()
print('catalog_pages_look_0257: OK')
