export type TavernVersion='original'|'upgraded';
export function isTavernVariant(key:string){return key==='tavern'||key==='tavern-upgrade';}
export function resolveTavernVariant(preferred:TavernVersion,upgradedAvailable:boolean,originalAvailable:boolean):'tavern'|'tavern-upgrade'|null{
 if(preferred==='upgraded'&&upgradedAvailable)return 'tavern-upgrade';
 if(originalAvailable)return 'tavern';
 return upgradedAvailable?'tavern-upgrade':null;
}
