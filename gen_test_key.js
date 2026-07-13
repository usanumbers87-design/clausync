const nacl = require('tweetnacl');
const bs = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fd = (s) => { const p=s.replace(/-/g,'+').replace(/_/g,'/'); const pad=p.length%4; return Uint8Array.from(atob(pad?p+'==='.slice(pad):p),c=>c.charCodeAt(0)); };

const SK = '8K7SAqHkqigeLQhiTbDfyMTYOg7eSkVofJwPQgHRmj0';
const seed = fd(SK);
const kp = nacl.sign.keyPair.fromSeed(seed);

const uid = Array.from({length:8},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0').toUpperCase()).join('');
const now = Math.floor(Date.now()/1000);
const exp = now + 365*86400;
const pl = {uid, sub: 'test@example.com', iat: now, exp, fea: ['all']};
const pb = new TextEncoder().encode(JSON.stringify(pl));
const sig = nacl.sign.detached(pb, kp.secretKey);
const cl = new Uint8Array(64 + pb.length);
cl.set(sig, 0);
cl.set(pb, 64);
const key = 'CLAUSYNC-' + bs(cl);
console.log('LICENSE KEY:', key);
