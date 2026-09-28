/**
 * Met Train PRO — Country → Language registry
 * Shared keys with Man Power: mp_country, mp_lang
 */
window.MT_LOCALES = {
  // Default country first
  IN: {
    name: 'India', nameNative: 'भारत', flag: '🇮🇳',
    langs: [
      {code:'hi', label:'हिं', title:'हिन्दी'},
      {code:'en', label:'EN', title:'English'},
      {code:'gu', label:'ગુ', title:'ગુજરાતી'},
      {code:'ta', label:'த', title:'தமிழ்'},
      {code:'te', label:'తె', title:'తెలుగు'},
      {code:'kn', label:'ಕ', title:'ಕನ್ನಡ'},
      {code:'bn', label:'বা', title:'বাংলা'},
      {code:'or', label:'ଓ', title:'ଓଡ଼ିଆ'}
    ]
  },
  GULF: {
    name: 'Gulf', nameNative: 'الخليج', flag: '🌴',
    langs: [
      {code:'en', label:'EN', title:'English'},
      {code:'hi', label:'हिं', title:'हिन्दी'},
      {code:'ar', label:'ع', title:'العربية'},
      {code:'ur', label:'اُر', title:'اردو'},
      {code:'bn', label:'বা', title:'বাংলা'}
    ]
  },
  CN: {
    name: 'China', nameNative: '中国', flag: '🇨🇳',
    langs: [
      {code:'zh', label:'中', title:'中文'},
      {code:'en', label:'EN', title:'English'}
    ]
  },
  EU: {
    name: 'Europe', nameNative: 'Europe', flag: '🇪🇺',
    langs: [
      {code:'en', label:'EN', title:'English'},
      {code:'de', label:'DE', title:'Deutsch'},
      {code:'it', label:'IT', title:'Italiano'},
      {code:'es', label:'ES', title:'Español'},
      {code:'tr', label:'TR', title:'Türkçe'}
    ]
  },
  AM: {
    name: 'Americas', nameNative: 'Américas', flag: '🌎',
    langs: [
      {code:'en', label:'EN', title:'English'},
      {code:'es', label:'ES', title:'Español'},
      {code:'pt', label:'PT', title:'Português'}
    ]
  },
  SEA: {
    name: 'SE Asia', nameNative: 'ASEAN', flag: '🌏',
    langs: [
      {code:'en', label:'EN', title:'English'},
      {code:'th', label:'ไท', title:'ไทย'},
      {code:'id', label:'ID', title:'Indonesia'},
      {code:'vi', label:'VI', title:'Tiếng Việt'}
    ]
  }
};

window.MT_COUNTRY_ORDER = ['IN','GULF','CN','EU','AM','SEA'];

function mtGetCountry(){
  try{ return localStorage.getItem('mp_country') || 'IN'; }catch(e){ return 'IN'; }
}
function mtSetCountry(c){
  if(!window.MT_LOCALES[c]) c='IN';
  try{ localStorage.setItem('mp_country', c); }catch(e){}
  return c;
}
function mtGetLang(){
  try{ return localStorage.getItem('mp_lang') || localStorage.getItem('mt_lang') || 'hi'; }catch(e){ return 'hi'; }
}
function mtSetLang(l){
  try{
    localStorage.setItem('mp_lang', l);
    localStorage.setItem('mt_lang', l);
  }catch(e){}
  return l;
}
function mtDefaultLangForCountry(c){
  var loc = window.MT_LOCALES[c] || window.MT_LOCALES.IN;
  return (loc.langs[0] && loc.langs[0].code) || 'en';
}
function mtLangsForCountry(c){
  var loc = window.MT_LOCALES[c] || window.MT_LOCALES.IN;
  return loc.langs.slice();
}
