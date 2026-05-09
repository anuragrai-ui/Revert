import type { Environment } from '../types';

const TOKEN_URLS: Record<Environment, string> = {
  stg: 'https://ng-web.certifyos.com/api/users/access-token',
  production: 'https://ng.certifyos.com/api/users/access-token',
};

/**
 * Generates the bookmarklet JS source that:
 * 1. Fetches the CertifyOS access-token JSON (same-origin, cookies included)
 * 2. Opens the Revert app with #token=<jwt> so it's picked up automatically
 *
 * Each step logs progress via alert() so the user can see exactly what happened.
 */
export function generateBookmarkletCode(appUrl: string, env: Environment): string {
  const tokenUrl = TOKEN_URLS[env];

  const raw = `
(function(){
  var u='${tokenUrl}';
  var app='${appUrl}';
  var host=location.hostname;
  console.log('[Bookmarklet] Running on: '+host);
  console.log('[Bookmarklet] Fetching: '+u);
  fetch(u,{credentials:'include'})
    .then(function(r){
      console.log('[Bookmarklet] HTTP status: '+r.status);
      if(!r.ok){alert('[Bookmarklet] Token endpoint returned HTTP '+r.status);return r.text().then(function(t){console.log('[Bookmarklet] Body: '+t);});}
      return r.json().then(function(d){
        console.log('[Bookmarklet] Response keys: '+Object.keys(d).join(', '));
        console.log('[Bookmarklet] accessToken type: '+typeof d.accessToken);
        console.log('[Bookmarklet] accessToken preview: '+(d.accessToken?d.accessToken.substring(0,20)+'...':'NULL'));
        var t=d.accessToken;
        if(!t){alert('[Bookmarklet] accessToken is null.\\nAre you logged in on '+host+'?\\nTry refreshing this page first.');return;}
        var target=app+'#token='+encodeURIComponent(t);
        console.log('[Bookmarklet] Opening: '+target.substring(0,80)+'...');
        alert('[Bookmarklet] Token found! Opening Revert app...');
        window.open(target,'_blank');
      });
    })
    .catch(function(e){
      console.error('[Bookmarklet] Error:',e);
      alert('[Bookmarklet] Failed: '+e.message+'\\n\\nMake sure you are on a certifyos.com page.');
    });
})();
`.trim();

  return 'javascript:' + encodeURIComponent(raw);
}

export function getBookmarkletLabel(env: Environment): string {
  return env === 'stg' ? '🔑 Revert Token (STG)' : '🔑 Revert Token (Prod)';
}
