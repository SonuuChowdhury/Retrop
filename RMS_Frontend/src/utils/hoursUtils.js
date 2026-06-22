/**
 * Returns the current open/closed status based on hours schedule.
 * @param {Array} schedule
 * @returns {{ isOpen: boolean, todayEntry: object|null, nextOpen: string|null }}
 */
export function getCurrentStatus(schedule) {
  if (!schedule || schedule.length === 0) {
    return { isOpen: false, todayEntry: null, nextOpen: null }
  }

  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon ... 6=Sat
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = dayNames[day]

  const todayEntry = schedule.find((entry) => {
    if (entry.isClosed) return false
    const daysStr = entry.days.toLowerCase()
    const todayLower = todayName.toLowerCase()
    // Simple match: "monday – thursday" or "sunday"
    if (daysStr.includes('–') || daysStr.includes('-')) {
      const [startDay, endDay] = daysStr.split(/[–-]/).map((d) => d.trim())
      const startIndex = dayNames.findIndex((d) => d.toLowerCase().startsWith(startDay.substring(0, 3)))
      const endIndex = dayNames.findIndex((d) => d.toLowerCase().startsWith(endDay.substring(0, 3)))
      // Handle wrap-around (e.g., Fri-Sun)
      if (startIndex <= endIndex) {
        return day >= startIndex && day <= endIndex
      } else {
        return day >= startIndex || day <= endIndex
      }
    }
    return daysStr.includes(todayLower.substring(0, 3))
  })

  if (!todayEntry) return { isOpen: false, todayEntry: null, nextOpen: null }

  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = parseTime(todayEntry.open)
  const closeMinutes = parseTime(todayEntry.close)

  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes

  return { isOpen, todayEntry, nextOpen: isOpen ? todayEntry.close : todayEntry.open }
}