export default (context, inject) => {
  const now = new Date()
  const pt1 = prevMonth(now)
  const pt2 = prevMonth(pt1)
  const pt3 = prevMonth(pt2)
  const ret = {
    now: now.getFullYear() + '-' + (now.getMonth() + 1),
    pt1: pt1.getFullYear() + '-' + (pt1.getMonth() + 1),
    pt2: pt2.getFullYear() + '-' + (pt2.getMonth() + 1),
    pt3: pt3.getFullYear() + '-' + (pt3.getMonth() + 1),
  }
  inject('ofd', ret)
}

function prevMonth(now) {
  const month = now.getMonth()
  const prev = new Date(now.getTime())
  prev.setMonth(prev.getMonth() - 1)
  while (prev.getMonth() === month)
    prev.setDate(prev.getDate() - 1)
  return prev
}
