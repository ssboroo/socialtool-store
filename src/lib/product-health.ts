type HealthProduct = {
  id:string; name:string; slug:string; shortDesc:string; description:string; price:number; oldPrice:number|null;
  image:string|null; icon:string; category:string; categoryId:string; available:boolean; features:string|null;
  duration:string|null; downloadUrl:string|null; tutorialVideoUrl:string|null; instructionImages:string|null;
  requiresOrderLink:boolean
}
export type ProductHealthIssue={productId:string;productName:string;severity:'critical'|'warning'|'info';code:string;message:string}

function validHttp(value:string|null){if(!value)return true;try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'}catch{return value.startsWith('/')}}
export function inspectProduct(product:HealthProduct):ProductHealthIssue[]{
  const issues:ProductHealthIssue[]=[]
  const add=(severity:ProductHealthIssue['severity'],code:string,message:string)=>issues.push({productId:product.id,productName:product.name,severity,code,message})
  if(!product.name.trim())add('critical','missing_name','Нэр хоосон байна')
  if(!product.categoryId||!product.category.trim())add('critical','missing_category','Ангилал дутуу байна')
  if(product.price<0||!Number.isSafeInteger(product.price))add('critical','invalid_price','Үнэ буруу байна')
  if(product.oldPrice!=null&&product.oldPrice<=product.price)add('warning','old_price','Хуучин үнэ одоогийн үнээс их байх ёстой')
  if(!product.shortDesc.trim()||product.shortDesc.trim().length<12)add('warning','short_description','Товч тайлбар хэт богино байна')
  if(!product.description.trim()||product.description.trim().length<40)add('warning','description','Дэлгэрэнгүй тайлбар дутуу байна')
  if(!product.features?.trim())add('info','features','Онцлог/боломжууд оруулаагүй байна')
  if(!product.image&&!product.icon.trim())add('warning','visual','Зураг болон icon байхгүй байна')
  if(product.image&&!validHttp(product.image))add('critical','image_url','Бүтээгдэхүүний зурагны холбоос буруу байна')
  if(product.downloadUrl&&!validHttp(product.downloadUrl))add('critical','download_url','Татах холбоос буруу байна')
  if(product.tutorialVideoUrl&&!validHttp(product.tutorialVideoUrl))add('warning','tutorial_url','Заавар видеоны холбоос буруу байна')
  if(product.instructionImages){
    try{const list=JSON.parse(product.instructionImages);if(!Array.isArray(list))throw new Error()}catch{if(!product.instructionImages.split(/[;\n]/).every(v=>!v.trim()||validHttp(v.trim())))add('warning','instruction_images','Зааврын зургуудын мэдээлэл буруу байна')}
  }
  if(product.price===0&&!product.downloadUrl)add('warning','free_without_download','Үнэгүй бараанд татах холбоос алга')
  if(product.price>0&&product.downloadUrl)add('critical','paid_download_conflict','Төлбөртэй бараанд үнэгүй татах холбоос тохируулсан байна')
  if(product.requiresOrderLink&&product.price===0)add('warning','order_link_free','Үнэгүй бараанд захиалгын линк шаардаж байна')
  if(!/^[a-z0-9\u0400-\u04ff-]+$/i.test(product.slug))add('info','slug','Slug стандарт бус тэмдэгт агуулж байна')
  return issues
}
