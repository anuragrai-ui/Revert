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
 * Works from *any* page under certifyos.com (ng-web or ng).
 */
export function generateBookmarkletCode(appUrl: string, env: Environment): string {
  const tokenUrl = TOKEN_URLS[env];

  // The bookmarklet code runs inside the user's certifyos.com tab
  const raw = `
(function(){
  var u='${tokenUrl}';
  var app='${appUrl}';
  fetch(u,{credentials:'include'})
    .then(function(r){return r.json()})
    .then(function(d){
      var t=d.accessToken;
      if(!t){alert('CertifyOS returned null token.\\nMake sure you are logged in to CertifyOS.');return;}
      window.open(app+'#token='+encodeURIComponent(t),'_blank');
    })
    .catch(function(e){alert('Failed to fetch token: '+e.message);});
})();
`.trim();

  return 'javascript:' + encodeURIComponent(raw);
}

export function getBookmarkletLabel(env: Environment): string {
  return env === 'stg' ? '🔑 Revert Token (STG)' : '🔑 Revert Token (Prod)';
}
