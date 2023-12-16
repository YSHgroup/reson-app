export class GenNumForDate {
  private date: { month: number; day: number }
  private Prefix: number[]
  private Suffix: number[]
  constructor() {
    this.date = this.currentDate
    this.Prefix = [16, 20, 24, 30]
    this.Suffix = [14, 13, 12, 11, 90, 80, 70, 60, 50, 40, 30, 20, 10]
  }

  get currentDate() {
    let date = new Date()
    return {
      month: date.getMonth() + 1,
      day: date.getDate(),
    }
  }

  private calcPrefix({month, day}: {month: number, day: number}) {
    let indexFistDay = Math.floor((month - 1) * 2 / this.Suffix.length)
    let indexFistDay_suffix = (month - 1) * 2 % this.Suffix.length
    let prefix = this.Prefix[Math.floor((day + indexFistDay_suffix - 1) / this.Suffix.length) + indexFistDay]
    console.log('first index of prefix: ', indexFistDay)
    return prefix
  }

  private calcSufFix({month, day}: {month: number, day: number}) {
    let indexFistDay = (month - 1) * 2 % this.Suffix.length
    // console.log('index first day: ',day, indexFistDay, (day + indexFistDay - 1) % this.Suffix.length)
    let suffix = this.Suffix[(day + indexFistDay - 1) % this.Suffix.length]
    return suffix
  }

  public getNum() {
      // console.log('class day-->', this.date.day)
      let suffix = this.calcSufFix(this.date).toString()
      let prefix = this.calcPrefix(this.date).toString()

    console.log('class number for date', prefix)
    return prefix + suffix
  }
}
