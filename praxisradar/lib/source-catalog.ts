export const sourceCatalog=[
{name:'apoBank – Praxis- und Apothekenbörse',url:'https://praxisboerse.apobank.de/',kind:'Praxisbörse',note:'Öffentliche Angaben; weitere Details können Anmeldung oder Beratung erfordern.'},
{name:'dental bauer – Praxisbörse',url:'https://www.dentalbauer.de/dienstleistungen/praxisboerse',kind:'Praxisbörse',note:'Praxisangebote mit Kennzahlen und Exposés.'},
{name:'blaudental – Objektbörse',url:'https://www.blaudental.de/objektboerse/praxisboerse/',kind:'Objektbörse',note:'Praxisabgaben, Beteiligungen und Praxisräume; reine Labor-/Inventarangebote getrennt prüfen.'},
{name:'KZV / ZÄK Westfalen-Lippe',url:'https://www.zahnaerzte-wl.de/praxisboerse/',kind:'Kammerbörse',note:'Details ohne Zugang nicht sichtbar. Auch Praxisbörsentage und persönliche Vermittlung.'},
{name:'IMMO.DENTAL / GERL',url:'https://immo.dental/praxisboerse/',kind:'Praxisbörse',note:'Praxisübernahmen und Praxisimmobilien; bestehende Räume von Ausbaupotenzial unterscheiden.'},
{name:'Prof. Dr. Bischoff & Partner',url:'https://www.bischoffundpartner.de/',kind:'Beratung',note:'Beratung und Kontakte; öffentliche Angebote über Wunschpraxis.'},
{name:'Wunschpraxis – Bischoff & Partner',url:'https://wunschpraxis.bischoffundpartner.de/',kind:'Praxisvermittlung',note:'Öffentliche Praxisangebote und Übernahmemodelle.'},
{name:'Böker Wirtschaftsberatung',url:'https://www.praxiskaufen.de/praxisvermittlung/',kind:'Praxisvermittlung',note:'Aktuelle Praxisbörse der Wirtschaftsberatung Böker; bundesweite Angebote.'},
{name:'Dentalvermittlung GmbH',url:'https://www.dentalvermittlung.de/',kind:'Stellenbörse / Kontakte',note:'Schwerpunkt Personal und Stellenanzeigen, keine bestätigte Praxisverkaufsbörse. Personal- und Kontaktweg separat prüfen.'},
{name:'Zahnärztekammer Nordrhein',url:'https://www.zahnaerztekammernordrhein.de/',kind:'Kammer / weitere Wege',note:'Niederlassung, Praxisabgabeseminare und Kontakte. Marktplatz über Dentoffert.'},
{name:'Dentoffert',url:'https://www.dentoffert.de/',kind:'Praxismarkt / Kleinanzeigen',note:'Praxisabgaben, Praxisgesuche, Räume, Inventar und Stellenanzeigen; Angebotsart beachten.'},
{name:'Concura',url:'https://www.concura.de/boerse/praxisangebote/',kind:'Praxisvermittlung',note:'Bisherige Suchquelle bleibt erhalten.'},
{name:'TAPE Praxisbörse',url:'https://praxisboerse.tape-praxis.de/praxis-angebote',kind:'Praxisbörse',note:'Bisherige Suchquelle bleibt erhalten.'}
];
export function sourceInfo(url:string){return sourceCatalog.find(s=>s.url===url)}
