import test from 'node:test'
import assert from 'node:assert/strict'
import { smartSearch, scoreSearchProduct } from '../src/lib/smart-search.ts'
import { inspectProduct } from '../src/lib/product-health.ts'

const products=[
  {id:'1',name:'ChatGPT Plus',shortDesc:'OpenAI эрх',description:'AI assistant',category:'AI Tool',features:'GPT;AI',price:50000,available:true,featured:true},
  {id:'2',name:'Google AI Pro',shortDesc:'Gemini Veo Flow',description:'Google AI',category:'AI Tool',features:'Gemini;Veo',price:70000,available:true,featured:true},
  {id:'3',name:'Counter-Strike 2 Prime Account',shortDesc:'CS2 account',description:'Gaming',category:'Gaming',features:'Prime',price:60000,available:true,featured:false},
  {id:'4',name:'Microsoft Office 2027 Pro',shortDesc:'Office license',description:'Word Excel',category:'Software',features:'Word;Excel',price:45000,available:true,featured:false},
]

test('smart search understands aliases, typos and marketplace abbreviations',()=>{
  assert.equal(smartSearch(products,'gpt',3)[0].id,'1')
  assert.equal(smartSearch(products,'google flow',3)[0].id,'2')
  assert.equal(smartSearch(products,'cs2',3)[0].id,'3')
  assert.equal(smartSearch(products,'microsft office',3)[0].id,'4')
  assert.ok(scoreSearchProduct(products[0],'чат жпт')>0)
})

test('unknown search does not invent a result',()=>{
  assert.deepEqual(smartSearch(products,'definitely-unknown-product-xyz',5),[])
})

const base={
  id:'p1',name:'Example Product',slug:'example-product',shortDesc:'Товч тайлбар хангалттай',
  description:'Энэ бол хангалттай урт бүтээгдэхүүний дэлгэрэнгүй тайлбар юм.',
  price:10000,oldPrice:15000,image:'/products/default/generic.svg',icon:'Package',
  category:'Software',categoryId:'cat1',available:true,features:'Feature one;Feature two',
  duration:null,downloadUrl:null,tutorialVideoUrl:null,instructionImages:null,requiresOrderLink:false
}

test('product health accepts a normal paid product',()=>{
  assert.deepEqual(inspectProduct(base),[])
})

test('product health catches conflicting price, links and incomplete content',()=>{
  const issues=inspectProduct({...base,price:0,oldPrice:0,shortDesc:'short',description:'tiny',downloadUrl:null,requiresOrderLink:true})
  const codes=new Set(issues.map(i=>i.code))
  assert.ok(codes.has('old_price'))
  assert.ok(codes.has('short_description'))
  assert.ok(codes.has('description'))
  assert.ok(codes.has('free_without_download'))
  assert.ok(codes.has('order_link_free'))
})
