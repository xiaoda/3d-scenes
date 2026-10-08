export type AssetKey='barrel'|'door'|'floor';
export const base='/assets/town/';
export const catalog={
 barrel:{id:'wine_barrel_01',title:'旧木酒桶',tag:'候选 / 待视觉认可',note:'保留木条、铁箍与桶口的真实几何。检查近景贴图密度和侧后方，不把“加载成功”当画质通过。'},
 door:{id:'large_castle_door',title:'拱形木门',tag:'细部基准 / 非酒馆定稿',note:'保留约 3 米原尺寸，用于检验木、铁与门体厚度。城门语汇偏重，不能直接当作已选定的酒馆门；背面也必须检查。'},
 floor:{id:'cobblestone_floor_08',title:'铺石地面',tag:'材质候选 / 需控制重复',note:'每次平铺对应 2 × 2 米。颜色、法线、粗糙度、AO 与小幅位移共同参与；不是逐块独立石头，掠射角与远处重复仍需检查。'}
} as const;
export interface AssetRecord {id:string;name:string;author:string;license:string;source:string;model?:string;hdri?:string;textures?:Record<string,string>;files:{path:string;bytes:number;sha256:string}[]}
export interface Manifest {assets:AssetRecord[];p1Accepted:boolean;building:{status:string}}
