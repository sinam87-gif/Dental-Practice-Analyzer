export function platformClientError(error:unknown,hostname=typeof window==='undefined'?'':window.location.hostname):string{
 const message=error instanceof Error?error.message:String(error);
 if(/Failed to fetch|fetch failed|Load failed|NetworkError/i.test(message))return ['127.0.0.1','localhost'].includes(hostname)
  ?'Die lokale Vorschau ist nicht erreichbar. Bitte den lokalen App-Server starten und diese Seite neu laden. Eure gespeicherten Daten werden dadurch nicht gelöscht.'
  :'Die App ist gerade nicht erreichbar. Bitte Verbindung prüfen und erneut versuchen. Eure gespeicherten Daten bleiben erhalten.';
 return message;
}
