export function orderProgress(status: string, paymentStatus?: string | null) {
  if (status === 'CANCELLED') return { step: -1, title: 'Захиалга цуцлагдсан', description: 'Дэлгэрэнгүй мэдээллийг захиалгын чатаар лавлаарай.' }
  if (status === 'DELIVERED') return { step: 2, title: 'Захиалга хүргэгдсэн', description: 'Таны бүтээгдэхүүн бэлэн боллоо. Хүргэлтийн мэдээлэл, зааврыг доороос харна уу.' }
  if (status === 'PAID' || paymentStatus === 'PAID') return { step: 1, title: 'Захиалга баталгаажсан', description: 'Төлбөр бүртгэгдлээ. Таны захиалгыг хүргэхээр бэлтгэж байна.' }
  return { step: 0, title: 'Төлбөр хүлээгдэж байна', description: 'Захиалга бүртгэгдсэн. Төлбөр баталгаажсаны дараа бэлтгэж эхэлнэ.' }
}
