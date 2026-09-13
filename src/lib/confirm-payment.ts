import { db } from '@/lib/db'
import { toMinorUnits } from '@/lib/wire'

/** Never fulfill an order for a different amount, currency or intent. */
export function paymentMatches(intent: { id: string; amount: number; currency: string }, payment: { wirePaymentIntentId: string | null; amount: number }) {
  return intent.id === payment.wirePaymentIntentId && intent.currency === 'MNT' && Number.isSafeInteger(intent.amount) && intent.amount === toMinorUnits(payment.amount)
}

/** Exactly one concurrent caller wins the transition and sends a notification. */
export async function confirmPayment(paymentId: string, intentId: string, transactionId?: string) {
  return db.$transaction(async tx => {
    const updated = await tx.payment.updateMany({
      where: { id: paymentId, wirePaymentIntentId: intentId, status: { not: 'PAID' } },
      data: { status: 'PAID', paidAt: new Date(), ...(transactionId ? { wireTransactionId: transactionId } : {}) },
    })
    if (!updated.count) return false
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } })
    await tx.order.updateMany({ where: { id: payment.orderId, status: { in: ['PENDING_PAYMENT', 'PENDING', 'FAILED', 'EXPIRED'] } }, data: { status: 'PAID', paymentId } })
    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } })
    if (order.chatSessionId) {
      await tx.chatMessage.create({ data: {
        sessionId: order.chatSessionId,
        sender: 'system',
        content: `Таны төлбөр амжилттай бүртгэгдлээ ✅

Бид тантай удахгүй холбогдож барааг хүргэнэ. Түр хүлээгээрэй.

Захиалгын дугаар: ${order.orderNumber}`,
      } })
      await tx.chatSession.update({ where: { id: order.chatSessionId }, data: { lastMessageAt: new Date() } })
    }
    return true
  })
}
