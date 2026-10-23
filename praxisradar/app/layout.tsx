import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'PraxisRadar · Köln',description:'Eure nächste Zahnarztpraxis. Angebote im Raum Köln vergleichen und prüfen.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="de"><body>{children}</body></html>}
