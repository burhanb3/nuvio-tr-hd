'use strict';
const aliases = {eng:'en',english:'en',ingilizce:'en',tur:'tr',turkish:'tr',türkçe:'tr',turkce:'tr',fra:'fr',fre:'fr',french:'fr',fransizca:'fr',spa:'es',spanish:'es',deu:'de',ger:'de',german:'de',ita:'it',italian:'it',por:'pt',portuguese:'pt',rus:'ru',russian:'ru',jpn:'ja',japanese:'ja',kor:'ko',korean:'ko',zho:'zh',chi:'zh',chinese:'zh',ara:'ar',arabic:'ar',nld:'nl',dut:'nl',dutch:'nl',pol:'pl',polish:'pl',swe:'sv',dan:'da',nor:'no',fin:'fi',ell:'el',gre:'el',heb:'he',fas:'fa',per:'fa',ukr:'uk',ron:'ro',rum:'ro',ces:'cs',cze:'cs',hun:'hu',tha:'th',vie:'vi',ind:'id',hin:'hi',hindi:'hi',tam:'ta',tel:'te',mal:'ml',ben:'bn'};
const priority = ['tr','en','fr','es','de','it','pt','ja','ko','zh','ru','ar','nl','pl','sv','da','no','fi','el','he','fa','uk','ro','cs','hu','th','vi','id','ta','te','ml','bn','hi'];
function languageCode(value) {
  const raw=String(value||'').trim().toLowerCase().split(/[-_]/)[0], code=aliases[raw]||raw;
  return /^[a-z]{2}$/.test(code)&&!['xx','un','zz'].includes(code)?code:null;
}
function languageCodes(values) {
  return [...new Set((values||[]).flatMap(v=>String(v||'').split(/[\s/,;+|]+/)).map(languageCode).filter(Boolean))];
}
function orderedLanguages(values) {
  const rank=c=>c==='hi'?1000:priority.includes(c)?priority.indexOf(c):100;
  return languageCodes(values).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));
}
function languageSummary(values, maximum=5) {
  const codes=orderedLanguages(values),shown=codes.slice(0,maximum).map(c=>c.toUpperCase()).join('/');
  return shown+(codes.length>maximum?' +'+(codes.length-maximum):'');
}
module.exports={languageCode,languageCodes,orderedLanguages,languageSummary};
