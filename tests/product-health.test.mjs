import test from 'node:test'
import assert from 'node:assert/strict'
import { productHealth } from '../src/lib/product-health.ts'
const valid={id:'abc',name:'Canva Pro',slug:'canva-pro',shortDesc:'Professional design subscription',description:'A detailed product description with delivery terms and setup instructions.',price:19999,oldPrice:25000,image:'/products/example.svg',icon:'brand:canva',category:'Design',categoryId:'cat',available:true,downloadUrl:null,duration:'1 жил',requiresOrderLink:false}
test('valid paid product has no health warnings',()=>{assert.deepEqual(productHealth(valid),[])})
test('missing description, imagery and wrong prices produce correct severity',()=>{
 const rows=productHealth({...valid,image:null,oldPrice:1,shortDesc:'',description:'',icon:'Package'})
 for(const code of ['image','old_price','short_desc','description','icon'])assert.ok(rows.some(i=>i.code===code),code)
})
test('free downloads must have a URL and cannot require post link',()=>{
 const rows=productHealth({...valid,price:0,oldPrice:null,duration:null,downloadUrl:null,requiresOrderLink:true})
 assert.ok(rows.some(i=>i.code==='free_url'))
 assert.ok(rows.some(i=>i.code==='order_link'&&i.severity==='critical'))
})
test('unsafe download URL rejected by diagnostic',()=>{
 const rows=productHealth({...valid,downloadUrl:'http://example.org/program.exe'})
 assert.ok(rows.some(i=>i.code==='download_url'&&i.severity==='critical'))
})
