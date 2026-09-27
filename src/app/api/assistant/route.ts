import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { smartSearch, normalizeSearchText } from '@/lib/smart-search'

function safe(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):''}
export async function POST(req:NextRequest){
  try{
    const body=await req.json()
    const message=safe(body.message,500)
    if(message.length<2)return NextResponse.json({error:'Асуултаа арай дэлгэрэнгүй бичнэ үү'},{status:400})
    const q=normalizeSearchText(message)
    const [products,faqs]=await Promise.all([
      db.product.findMany({where:{available:true},select:{
        id:true,name:true,slug:true,shortDesc:true,description:true,category:true,features:true,price:true,oldPrice:true,
        image:true,icon:true,featured:true,available:true,duration:true
      }}),
      db.faq.findMany({orderBy:{order:'asc'},take:30})
    ])
    const matches=smartSearch(products,message,4)
    const faq=faqs.find(f=>{const needle=normalizeSearchText(f.question);return needle.split(' ').filter(w=>w.length>3).some(w=>q.includes(w))})
    let answer=''
    if(/захиал|төлбөр|qpay|хэрхэн авах|яаж авах/.test(q)){
      answer='Бүтээгдэхүүнээ сонгоод сагсанд нэмнэ. Дараа нь захиалгын мэдээллээ бөглөж QPay-аар төлбөрөө баталгаажуулна. Линк шаарддаг үйлчилгээ бол төлбөрийн хэсэгт пост/профайл/видеоны холбоосоо оруулна.'
    }else if(/ямар|аль|санал|recommend|хэрэгтэй|тохирох/.test(q)&&matches.length){
      answer='Таны бичсэн хэрэгцээнд хамгийн ойр бүтээгдэхүүнүүдийг оллоо. Доорх сонголтуудын тайлбар, хугацаа, үнийг харьцуулаарай.'
    }else if(matches.length){
      answer='Таны асуулттай холбоотой бүтээгдэхүүнүүдийг оллоо. Хүсвэл “аль нь надад тохирох вэ?” гэж хэрэгцээгээ дэлгэрүүлж бичээрэй.'
    }else if(faq){
      answer=faq.answer
    }else{
      answer='Энэ асуултад каталогоос шууд тохирох зүйл олдсонгүй. Хэрэгтэй платформ, зорилго, төсөв эсвэл бүтээгдэхүүний нэрээ бичвэл би каталогоос ойролцоо сонголт санал болгоно.'
    }
    return NextResponse.json({
      answer,
      products:matches.map(p=>({id:p.id,name:p.name,shortDesc:p.shortDesc,category:p.category,price:p.price,oldPrice:p.oldPrice,image:p.image,icon:p.icon,duration:p.duration})),
      source:matches.length?'catalog':faq?'faq':'assistant'
    })
  }catch{return NextResponse.json({error:'Зөвлөх түр ажиллахгүй байна'},{status:500})}
}
