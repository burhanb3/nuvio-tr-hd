'use strict';
function base64Bytes(value,maximum=12000) {
  if(typeof value!=='string'||value.length>maximum||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',out=[];let buffer=0,bits=0;
  for(const c of value.replace(/=+$/,'')){buffer=(buffer<<6)|alphabet.indexOf(c);bits+=6;
    if(bits>=8){bits-=8;out.push((buffer>>bits)&255);buffer&=(1<<bits)-1;}}
  return Uint8Array.from(out);
}
module.exports={base64Bytes};
