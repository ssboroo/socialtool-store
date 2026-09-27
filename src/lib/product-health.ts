export type HealthProduct = {
 id:string;name:string;slug:string;shortDesc:string;description:string;price:number;oldPrice:number|null;
 image:string|null;icon:string;category:string;categoryId:string;available:boolean;downloadUrl:string|null;duration:string|null;requiresOrderLink:boolean;
}
export type HealthIssue={code:string;severity:'critical'|'warning'|'info';message:string}
export function productHealth(p:HealthProduct):HealthIssue[]{
 const issues:HealthIssue[]=[]
 const add=(severity:HealthIssue['severity'],code:string,message:string)=>issues.push({code,severity,message})
 if(!p.name.trim())add('critical','name','Нэр байхгүй')
 if(!p.categoryId||!p.category.trim())add('critical','category','Ангилал байхгүй')
 if(!Number.isSafeInteger(p.price)||p.price<0)add('critical','price','Үнэ буруу')
 if(p.oldPrice!==null&&p.oldPrice<=p.price)add('warning','old_price','Хуучин үнэ одоогийн үнээс их байх ёстой')
 if(!p.slug.trim())add('critical','slug','Slug хоосон')
 if(!p.image)add('warning','image','Бүтээгдэхүүний зураг оруулаагүй')
 if(!p.shortDesc?.trim()||p.shortDesc.trim().length<15)add('warning','short_desc','Товч тайлбар дутуу')
 if(!p.description?.trim()||p.description.trim().length<35)add('warning','description','Дэлгэрэнгүй тайлбар дутуу')
 if(!p.icon||p.icon==='Package')add('info','icon','Брэндийн логог шалгана уу')
 if(p.price===0&&!p.downloadUrl)add('warning','free_url','Үнэгүй програм татах холбоосгүй')
 if(p.downloadUrl){try{const url=new URL(p.downloadUrl);if(url.protocol!=='https:')add('critical','download_url','Татах холбоос HTTPS биш')}catch{add('critical','download_url','Татах холбоос буруу')}}
 if(p.image&&/^https?:/.test(p.image)){try{const u=new URL(p.image);if(u.protocol!=='https:')add('warning','remote_image','Зургийн HTTPS холбоос шалгана уу')}catch{add('warning','remote_image','Зургийн холбоос буруу')}}
 if(p.requiresOrderLink&&p.price===0)add('critical','order_link','Үнэгүй бараанд захиалгын линк шаардаж байна')
 if(p.price>0&&!p.duration)add('info','term','Эрхийн хугацааг шалгана уу')
 return issues
}
