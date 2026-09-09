/**
 * Telegram Bot notification helper.
 * Sends messages to the admin chat via the Telegram Bot API.
 * Credentials are read from environment variables — never exposed to the frontend.
 */

export async function callTelegramApi(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || token === 'your_telegram_bot_token') {
    // Demo mode: credentials not configured — log instead of sending.
    console.warn('Telegram bot token is not configured')
    return { ok: false, demo: true }
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!data.ok) {
      console.error('Telegram API error:', data)
    }
    return data
  } catch (e) {
    console.error('Telegram request failed')
    return { ok: false, error: 'Telegram unavailable' }
  }
}

export async function sendTelegramMessage(text: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId || chatId === 'your_telegram_admin_chat_id') {
    console.warn('Telegram admin chat ID is not configured')
    return { ok: false, demo: true }
  }
  return callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
}

export function escapeTelegramHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function formatOrderNotification(opts: {
  orderNumber: string
  customerName: string
  phone: string
  email?: string
  telegram?: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: string
  adminUrl?: string
}) {
  const itemsText = opts.items
    .map((i) => `• ${escapeTelegramHtml(i.name)} ×${i.quantity} — ${formatTugrik(i.price * i.quantity)}`)
    .join('\n')
  const lines = [
    '🛒 <b>Шинэ захиалга</b>',
    '',
    `📦 Захиалгын дугаар: <b>${escapeTelegramHtml(opts.orderNumber)}</b>`,
    `👤 Худалдан авагч: ${escapeTelegramHtml(opts.customerName)}`,
    `📞 Утас: ${escapeTelegramHtml(opts.phone)}`,
    opts.email ? `✉️ И-мэйл: ${escapeTelegramHtml(opts.email)}` : '',
    opts.telegram ? `💬 Telegram: @${escapeTelegramHtml(opts.telegram.replace(/^@/, ''))}` : '',
    '',
    '🧾 <b>Бүтээгдэхүүнүүд:</b>',
    itemsText,
    '',
    `💰 Нийт дүн: <b>${formatTugrik(opts.total)}</b>`,
    `🏷 Төлөв: ${escapeTelegramHtml(opts.status)}`,
  ].filter(Boolean)
  if (opts.adminUrl) {
    lines.push('', `🔗 <a href="${escapeTelegramHtml(opts.adminUrl)}">Захиалга удирдах</a>`)
  }
  return lines.join('\n')
}

export function formatPaymentConfirmedNotification(opts: {
  orderNumber: string
  customerName: string
  total: number
  adminUrl?: string
}) {
  const lines = [
    '✅ <b>Төлбөр баталгаажлаа</b>',
    '',
    `📦 Захиалгаа: <b>${escapeTelegramHtml(opts.orderNumber)}</b>`,
    `👤 Худалдан авагч: ${escapeTelegramHtml(opts.customerName)}`,
    `💰 Нийт дүн: <b>${formatTugrik(opts.total)}</b>`,
    `🏷 Төлөв: Төлбөр төлөгдсөн`,
  ]
  if (opts.adminUrl) {
    lines.push('', `🔗 <a href="${escapeTelegramHtml(opts.adminUrl)}">Захиалга удирдах</a>`)
  }
  return lines.join('\n')
}

export function formatChatNotification(opts: {
  customerName: string
  phone?: string
  message: string
  adminUrl?: string
}) {
  const lines = [
    '💬 <b>Шинэ чатын мессеж</b>',
    '',
    `👤 ${escapeTelegramHtml(opts.customerName)}`,
    opts.phone ? `📞 ${escapeTelegramHtml(opts.phone)}` : '',
    `📝 ${escapeTelegramHtml(opts.message)}`,
  ].filter(Boolean)
  if (opts.adminUrl) {
    lines.push('', `🔗 <a href="${escapeTelegramHtml(opts.adminUrl)}">Чат удирдах</a>`)
  }
  return lines.join('\n')
}

export function formatTugrik(amount: number) {
  return new Intl.NumberFormat('mn-MN').format(amount) + ' ₮'
}
