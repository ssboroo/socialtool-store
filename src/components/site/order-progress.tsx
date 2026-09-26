import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { orderProgress } from '@/lib/order-progress'

export function OrderProgress({ status, paymentStatus, paidAt }: { status: string; paymentStatus?: string | null; paidAt?: string | null }) {
  const progress = orderProgress(status, paymentStatus)
  const Icon = progress.step < 0 ? XCircle : progress.step === 0 ? Clock : CheckCircle2
  return <div className="order-progress" data-step={progress.step}>
    <div className="order-progress-heading"><Icon size={22}/><div><h3>{progress.title}</h3><p>{progress.description}</p></div></div>
    {progress.step >= 0 && <ol aria-label="Захиалгын явц">{['Захиалга үүссэн', 'Төлбөр баталгаажсан', 'Хүргэгдсэн'].map((label, index) => <li key={label} data-complete={index <= progress.step} aria-current={index === progress.step ? 'step' : undefined}><span aria-hidden="true">{index <= progress.step ? '✓' : index + 1}</span>{label}</li>)}</ol>}
    {paidAt && <p className="order-paid-at">Төлбөр баталгаажсан: {new Date(paidAt).toLocaleString('mn-MN')}</p>}
  </div>
}
