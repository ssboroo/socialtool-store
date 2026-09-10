import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createPaymentIntent,createCheckoutSession,WireApiError} from '../src/lib/wire.ts'
test('Wire request contracts: auth, minor units, stable keys, operators and typed errors', async () => {
 const original=global.fetch, key=process.env.WIRE_MN_API_KEY, ops=process.env.WIRE_MN_ALLOWED_OPERATORS
 const calls=[]
 try {
 process.env.WIRE_MN_API_KEY='sk_live_local_mock_only'; delete process.env.WIRE_MN_ALLOWED_OPERATORS
 global.fetch=async (url,opts)=>{calls.push({url,...opts}); return Response.json({id:'pi_mock',url:'https://pay.wire.mn/c/mock'})}
 await createPaymentIntent({orderId:'order-a',amount:500})
 await createPaymentIntent({orderId:'order-a',amount:500})
 assert.equal(JSON.parse(calls[0].body).amount,50000)
 assert.equal(JSON.parse(calls[0].body).allowed_operators,undefined)
 assert.equal(calls[0].headers.Authorization,'Bearer sk_live_local_mock_only')
 assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key'])
 await createCheckoutSession({orderId:'order-a',paymentIntentId:'pi_one',successUrl:'https://socialtool.store/'})
 await createCheckoutSession({orderId:'order-a',paymentIntentId:'pi_two',successUrl:'https://socialtool.store/'})
 assert.notEqual(calls[2].headers['Idempotency-Key'],calls[3].headers['Idempotency-Key'])
 assert.equal(new URLSearchParams(calls[2].body).get('payment_intent'),'pi_one')
 process.env.WIRE_MN_ALLOWED_OPERATORS='sandbox'
 await assert.rejects(createPaymentIntent({orderId:'order-b',amount:1}),e=>e.code==='operator_configuration')
 process.env.WIRE_MN_API_KEY='sk_test_local_mock_only'
 await createPaymentIntent({orderId:'test',amount:1})
 assert.deepEqual(JSON.parse(calls.at(-1).body).allowed_operators,['sandbox'])
 global.fetch=async()=>Response.json({error:{code:'idempotency_in_flight',request_id:'req_mock',message:'private provider content'}},{status:409})
 await assert.rejects(createPaymentIntent({orderId:'test',amount:1}),e=>e instanceof WireApiError && e.status===409 && e.code==='idempotency_in_flight' && e.requestId==='req_mock' && !e.message.includes('private'))
 } finally {global.fetch=original; if(key===undefined) delete process.env.WIRE_MN_API_KEY;else process.env.WIRE_MN_API_KEY=key;if(ops===undefined)delete process.env.WIRE_MN_ALLOWED_OPERATORS;else process.env.WIRE_MN_ALLOWED_OPERATORS=ops}
})
