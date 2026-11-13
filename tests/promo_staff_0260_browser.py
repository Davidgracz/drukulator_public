"""0.26.0: panel pracowniczy — zakładka „Kody rabatowe”: lista ze statusami, formularz z podglądem i szybkimi ustawieniami okresu
ważności, generator kodu, zapis, błąd walidacji z serwera, edycja, włączanie/wyłączanie, usuwanie oraz kod i zniżka w szczegółach zlecenia.
Panel uruchamiany z atrapą API (serwer w pamięci przeglądarki)."""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
src=(root/'staff-panel.php').read_text()
html=src[src.index('?><!doctype html>')+2:]
def _php(m):
    code=m.group(0)
    if 'wp_json_encode' in code: return '{"display_name":"Test","is_admin":true}'
    if 'esc_html' in code: return 'Test'
    if 'Administrator' in code: return 'Administrator'
    return ''   # if/endif — panel renderowany tak, jakby użytkownik miał wszystkie uprawnienia
html=re.sub(r"<\?php.*?\?>",_php,html,flags=re.S)
assert '<?php' not in html,re.findall(r'<\?php.{0,80}',html)[:3]
def promo(i,code,typ,val,status,**kw):
    d={"id":i,"code":code,"label":"","discount_type":typ,"discount_value":val,"min_total":0,"valid_from":"","valid_to":"","max_uses":None,"used_count":0,"discount_sum":0,
       "active":status!='disabled',"status":status,"created_by":"Anna","created_at":"2026-11-01 10:00:00","updated_at":"2026-11-01 10:00:00"}
    d.update(kw); return d
codes=[
  promo(5,'WIOSNA10','percent',10,'active',label='Kampania wiosenna',valid_from='2026-11-01',valid_to='2026-12-31',max_uses=10,used_count=3,discount_sum=123.4),
  promo(4,'RABAT25','amount',25,'active',min_total=100),
  promo(3,'STARY','percent',5,'expired',valid_to='2026-10-01'),
  promo(2,'WYLACZ','percent',15,'disabled'),
  promo(1,'JUTRO','amount',10,'scheduled',valid_from='2027-01-01'),
  promo(6,'ZUZYTY','percent',20,'exhausted',max_uses=1,used_count=1),
]
order={"order_id":"D24-PROMO-1","order_name":"","status":"received","total":270.0,"items":[{"title":"Ulotki","price":300.0,"description":"A5"}],"customer_name":"Jan Nowak","customer_email":"jan@example.com",
 "customer_phone":"500","pickup":"Odbiór osobisty","notes":"","promo_code":"WIOSNA10","discount":30.0,"public_note":"","internal_note":"","assigned_staff_id":None,"assigned_name":"","priority":"normal","due_date":"",
 "production_started_at":"","production_finished_at":"","work_started_at":"","work_seconds":0,"ready_notified_at":"","history":[{"status":"received","label":"Zapytanie otrzymane","at":"2026-11-12 10:00:00"}],"created_at":"2026-11-12 10:00:00","updated_at":"2026-11-12 10:00:00"}
plain={**order,"order_id":"D24-PLAIN-1","promo_code":"","discount":0.0,"total":50.0,"updated_at":"2026-11-11 10:00:00"}
boot={"success":True,"csrf":"tok","user":{"id":1,"is_admin":True,"permissions":[],"display_name":"Test"},"orders":[order,plain],"staff":[],"statuses":{"received":"Zapytanie otrzymane"},"production_summary":{},"production_priorities":{},
      "permissions_catalog":{"promo_manage":"Kody rabatowe (tworzenie i edycja)"},"promo_codes":codes}
SERVER='''([bootPayload])=>{
  window.__calls=[]; let list=JSON.parse(JSON.stringify(bootPayload.promo_codes)); let nextId=10;
  const reply=(status,obj)=>({ok:status<400,status,json:async()=>obj});
  window.fetch=async (u,opt)=>{
    u=String(u);
    if(opt&&opt.method==='POST'){
      const d=JSON.parse(opt.body); window.__calls.push(d);
      if(d.csrf!=='tok') return reply(403,{success:false,message:'Sesja wygasła. Odśwież panel.'});
      if(d.action==='promo_save'){
        if(String(d.discount_value).trim()==='') return reply(400,{success:false,message:'Podaj wysokość zniżki.',promo_codes:list});
        const code=String(d.code||'').toUpperCase();
        if(!d.id){
          if(list.some(x=>x.code===code)) return reply(400,{success:false,message:'Kod „'+code+'” już istnieje.',promo_codes:list});
          list=[{id:nextId++,code,label:d.label,discount_type:d.discount_type,discount_value:Number(String(d.discount_value).replace(',','.')),min_total:Number(String(d.min_total||0).replace(',','.')),valid_from:d.valid_from,valid_to:d.valid_to,
                 max_uses:d.max_uses===''?null:Number(d.max_uses),used_count:0,discount_sum:0,active:!!d.active,status:d.active?'active':'disabled'},...list];
          return reply(200,{success:true,message:'Kod „'+code+'” został utworzony.',promo_codes:list});
        }
        list=list.map(x=>x.id===d.id?{...x,label:d.label,discount_type:d.discount_type,discount_value:Number(String(d.discount_value).replace(',','.')),min_total:Number(String(d.min_total||0).replace(',','.')),valid_from:d.valid_from,valid_to:d.valid_to,max_uses:d.max_uses===''?null:Number(d.max_uses),active:!!d.active,status:d.active?'active':'disabled'}:x);
        return reply(200,{success:true,message:'Zapisano zmiany kodu.',promo_codes:list});
      }
      if(d.action==='promo_toggle'){ list=list.map(x=>x.id===d.id?{...x,active:!!d.active,status:d.active?'active':'disabled'}:x); return reply(200,{success:true,message:d.active?'Kod został włączony.':'Kod został wyłączony.',promo_codes:list}); }
      if(d.action==='promo_delete'){ list=list.filter(x=>x.id!==d.id); return reply(200,{success:true,message:'Kod został usunięty.',promo_codes:list}); }
      return reply(400,{success:false,message:'Nieobsługiwana operacja.'});
    }
    return reply(200,{...bootPayload,promo_codes:list});
  };
}'''
def cards(page): return page.locator('.pr-card')
def card(page,code): return page.locator('.pr-card',has=page.locator('.pr-code',has_text=code))
def norm(s): return re.sub(r'\s+',' ',s.replace(' ',' ')).strip()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (1300,390):
        page=browser.new_page(viewport={'width':width,'height':900},locale='pl-PL')
        errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
        dialogs=[]; page.on('dialog',lambda d:(dialogs.append(d.message),d.accept()))
        page.set_content('<!doctype html><html><head></head><body></body></html>')
        page.evaluate(SERVER,[boot]); page.set_content(html); page.evaluate(SERVER,[boot]); page.wait_for_timeout(500)
        page.locator('button[data-tab="promo"]').first.click(); page.wait_for_selector('#promoList .pr-card',timeout=8000)
        assert page.locator('#tab-promo').is_visible()
        # --- lista: statusy, zniżki, okres, użycie
        assert cards(page).count()==6 and norm(page.locator('#promoCount').inner_text())=='6 kodów',norm(page.locator('#promoCount').inner_text())
        st={c:norm(card(page,c).locator('.pr-pill').inner_text()) for c in ('WIOSNA10','RABAT25','STARY','WYLACZ','JUTRO','ZUZYTY')}
        assert st=={'WIOSNA10':'Aktywny','RABAT25':'Aktywny','STARY':'Wygasł','WYLACZ':'Wyłączony','JUTRO':'Zaplanowany','ZUZYTY':'Wyczerpany'},st
        w=norm(card(page,'WIOSNA10').inner_text())
        assert '−10%' in w and 'od 2026-11-01 do 2026-12-31' in w and '3 / 10 użyć' in w and '123,40 zł' in w and 'Kampania wiosenna' in w,w
        r=norm(card(page,'RABAT25').inner_text()); assert '−25,00 zł' in r and 'bez ograniczenia czasu' in r and 'Min. produkty: 100,00 zł' in r and '0 użyć' in r,r
        # --- formularz: podgląd, szybkie okresy, generator
        assert page.locator('#promoFormTitle').inner_text()=='Nowy kod rabatowy' and page.locator('#promoCancel').is_hidden()
        page.locator('#promoValue').fill('15'); page.locator('#promoMax').fill('50'); page.locator('#promoMin').fill('100,50')
        pv=norm(page.locator('#promoPreview').inner_text()); assert '15% zniżki' in pv and 'maks. 50 użyć' in pv and '100,50 zł' in pv and 'bez ograniczenia czasu' in pv,pv
        page.locator('[data-promo-preset="14"]').click()
        today,plus14=page.evaluate('''()=>{const f=n=>{const d=new Date();d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};return [f(0),f(14)]}''')
        assert page.locator('#promoFrom').input_value()==today and page.locator('#promoTo').input_value()==plus14,(page.locator('#promoFrom').input_value(),page.locator('#promoTo').input_value())
        assert f'od {today} do {plus14} włącznie' in norm(page.locator('#promoPreview').inner_text())
        page.locator('[data-promo-preset="none"]').click(); assert page.locator('#promoFrom').input_value()=='' and page.locator('#promoTo').input_value()==''
        page.locator('[data-promo-preset="today"]').click(); assert page.locator('#promoFrom').input_value()==today and page.locator('#promoTo').input_value()==''
        page.locator('#promoType').select_option('amount'); assert page.locator('#promoValueLabel').inner_text()=='Wysokość zniżki (zł)'
        assert 'zł zniżki' in norm(page.locator('#promoPreview').inner_text())
        page.locator('#promoType').select_option('percent')
        page.locator('#promoGenerate').click(); gen=page.locator('#promoCode').input_value(); assert re.fullmatch(r'DRUK-[A-HJ-NP-Z2-9]{6}',gen),gen
        # --- błąd z serwera: komunikat przy formularzu, nic nie jest czyszczone
        page.locator('#promoCode').fill('lato15'); assert page.locator('#promoCode').input_value()=='LATO15'      # wielkie litery od razu
        page.locator('#promoValue').fill(''); page.locator('#promoSave').click(); page.wait_for_timeout(300)
        assert page.locator('#promoMsg').is_visible() and 'Podaj wysokość zniżki.' in page.locator('#promoMsg').inner_text()
        assert page.locator('#promoCode').input_value()=='LATO15' and cards(page).count()==6
        # --- zapis nowego kodu
        page.locator('#promoValue').fill('15'); page.locator('#promoLabel').fill('Test ulotka'); page.locator('[data-promo-preset="30"]').click(); page.locator('#promoSave').click(); page.wait_for_timeout(400)
        call=page.evaluate('window.__calls.at(-1)'); plus30=page.evaluate('''()=>{const d=new Date();d.setDate(d.getDate()+30);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}''')
        assert call=={'action':'promo_save','id':0,'code':'LATO15','label':'Test ulotka','discount_type':'percent','discount_value':'15','min_total':'100,50','valid_from':today,'valid_to':plus30,'max_uses':'50','active':True,'csrf':'tok'},call
        assert cards(page).count()==7 and norm(card(page,'LATO15').locator('.pr-pill').inner_text())=='Aktywny'
        assert page.locator('#promoCode').input_value()=='' and page.locator('#promoFormTitle').inner_text()=='Nowy kod rabatowy' and page.locator('#promoMsg').is_hidden()
        assert cards(page).first.locator('.pr-code').inner_text()=='LATO15'          # najnowszy na górze
        # duplikat
        page.locator('#promoCode').fill('LATO15'); page.locator('#promoValue').fill('5'); page.locator('#promoSave').click(); page.wait_for_timeout(300)
        assert 'już istnieje' in page.locator('#promoMsg').inner_text() and cards(page).count()==7
        page.locator('#promoCode').fill(''); page.locator('#promoValue').fill('')
        # --- edycja
        card(page,'LATO15').locator('[data-promo-edit]').click(); page.wait_for_timeout(200)
        assert page.locator('#promoFormTitle').inner_text()=='Edycja kodu LATO15' and page.locator('#promoCode').is_disabled() and page.locator('#promoCode').input_value()=='LATO15'
        assert page.locator('#promoValue').input_value()=='15' and page.locator('#promoMin').input_value()=='100,5' and page.locator('#promoMax').input_value()=='50' and page.locator('#promoFrom').input_value()==today
        assert page.locator('#promoCancel').is_visible() and page.locator('#promoSave').inner_text()=='Zapisz zmiany'
        page.locator('#promoGenerate').click(); assert page.locator('#promoCode').input_value()=='LATO15'            # generator nie nadpisuje kodu przy edycji
        page.locator('#promoValue').fill('20'); page.locator('#promoSave').click(); page.wait_for_timeout(400)
        call=page.evaluate('window.__calls.at(-1)'); assert call['id']==10 and call['discount_value']=='20' and call['action']=='promo_save',call
        assert '−20%' in norm(card(page,'LATO15').inner_text()) and page.locator('#promoFormTitle').inner_text()=='Nowy kod rabatowy'
        card(page,'RABAT25').locator('[data-promo-edit]').click(); page.locator('#promoCancel').click()
        assert page.locator('#promoFormTitle').inner_text()=='Nowy kod rabatowy' and page.locator('#promoCode').input_value()=='' and not page.locator('#promoCode').is_disabled()
        # --- włączanie / wyłączanie
        card(page,'LATO15').locator('[data-promo-toggle]').click(); page.wait_for_timeout(300)
        assert norm(card(page,'LATO15').locator('.pr-pill').inner_text())=='Wyłączony' and norm(card(page,'LATO15').locator('[data-promo-toggle]').inner_text())=='Włącz'
        assert page.evaluate('window.__calls.at(-1)')=={'action':'promo_toggle','id':10,'active':False,'csrf':'tok'}
        card(page,'LATO15').locator('[data-promo-toggle]').click(); page.wait_for_timeout(300)
        assert norm(card(page,'LATO15').locator('.pr-pill').inner_text())=='Aktywny'
        # --- usuwanie z potwierdzeniem
        card(page,'STARY').locator('[data-promo-delete]').click(); page.wait_for_timeout(300)
        assert dialogs and 'Usunąć kod STARY?' in dialogs[-1],dialogs
        assert cards(page).count()==6 and card(page,'STARY').count()==0
        # --- zlecenie: kod i zniżka w szczegółach
        page.locator('button[data-tab="orders"]').first.click(); page.wait_for_selector('.order-row',timeout=5000)
        page.locator('.order-row',has_text='D24-PROMO-1').first.click(); page.wait_for_timeout(300)
        d=norm(page.locator('#orderDetail').inner_text()); assert 'Kod rabatowy WIOSNA10' in d and '−30,00 zł' in d,d[:600]
        page.locator('.order-row',has_text='D24-PLAIN-1').first.click(); page.wait_for_timeout(300)
        assert 'Kod rabatowy' not in norm(page.locator('#orderDetail').inner_text())
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        page.locator('button[data-tab="promo"]').first.click()
        dims=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})'); assert dims['scroll']<=dims['inner']+1,(width,dims)
        assert not errors,errors
        print('PASS staff promo panel width',width,flush=True)
        page.close()
    browser.close()
print('PASS promo_staff_0260_browser')
