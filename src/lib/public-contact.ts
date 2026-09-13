const configured = (process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || 'boroobro').trim().replace(/^@/, '')
export const telegramUsername = /^[A-Za-z0-9_]{5,32}$/.test(configured) ? configured : 'boroobro'
export const telegramUrl = `https://t.me/${telegramUsername}`
