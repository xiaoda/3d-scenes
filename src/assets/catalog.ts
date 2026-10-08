export type AssetKey='barrel'|'door'|'floor'|'tavern'|'shack'|'tavern-upgrade';
export const base='/assets/town/';
export const catalog={
 'tavern-upgrade':{id:'tavern-facade-v1',title:'石砌酒馆 · 立面升级',tag:'立面效果已获认可 / 保留原版对照',note:'石墙使用真实 2K PBR 与 2.5 米尺度 UV；窗面改为低饱和深色，补实体格栅和 6 厘米门厚。木梁、屋瓦仍为原图；不含室内，也不宣称整栋完整 PBR。'},
 tavern:{id:'daniel-tavern',title:'石砌酒馆 · 原始版',tag:'第一批已获阶段认可 / 原件对照',note:'保留你已认可的完整轮廓、原始几何与颜色图，不覆盖文件。可与立面升级版同机位对比；低分辨率石墙、蓝色窗面及部分贴片门窗仍是原版限制。'},
 shack:{id:'spiral-shack',title:'茅草小屋',tag:'辅助建筑候选 / 非主角替代',note:'原作者定位俯视 RPG；保留两张 2K 图与茅草 Alpha 边缘。它可以作为远处附属屋的候选，但不能因为容易下载就替代写实街角酒馆。'},
 barrel:{id:'wine_barrel_01',title:'旧木酒桶',tag:'候选 / 待视觉认可',note:'保留木条、铁箍与桶口的真实几何。检查近景贴图密度和侧后方，不把“加载成功”当画质通过。'},
 door:{id:'large_castle_door',title:'拱形木门',tag:'细部基准 / 非酒馆定稿',note:'保留约 3 米原尺寸，用于检验木、铁与门体厚度。城门语汇偏重，不能直接当作已选定的酒馆门；背面也必须检查。'},
 floor:{id:'cobblestone_floor_08',title:'铺石地面',tag:'材质候选 / 需控制重复',note:'每次平铺对应 2 × 2 米。颜色、法线、粗糙度、AO 与小幅位移共同参与；不是逐块独立石头，掠射角与远处重复仍需检查。'}
} as const;
export interface AssetRecord {id:string;name:string;author:string;license:string;source:string;materialSource?:string;model?:string;hdri?:string;textures?:Record<string,string>;textureLabel?:string;files:{path:string;bytes:number;sha256:string}[]}
export interface Manifest {assets:AssetRecord[];p1Accepted:boolean;building:{status:string}}
