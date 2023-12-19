export class DateProcessor {
  private birthday: Record<string, string | number>
  private processedArray: any[]
  constructor(birthday: Record<string, string | number>) {
    this.birthday = birthday
  }

  get currentDate() {
    const date = new Date()
    return {
      year_current: date.getFullYear(),
      month_current: date.getMonth() + 1,
      day_current: date.getDate(),
    }
  }

  private separateDigits(number: number | string): string[] {
    let digits = number.toString().split('')
    return digits
  }

  private sumDigits(numArr: string[]): number {
    let sum = numArr.reduce((total, current) => total + Number(current), 0)
    return sum
  }

  private organizeToArray(date: Record<string, string | number>): any {
    let dateArg = Object.values(date)
    let analysedDate = []
    let i = 0
    const analyseDate = (num: number | string, j = 0) => {
      if (i < 3) {
        if (j < 3) {
          let separatedNumber = this.separateDigits(num)
          j === 0 && (analysedDate[i] = [])
          analysedDate[i].push(separatedNumber)
          let sum = this.sumDigits(separatedNumber)
          analyseDate(sum, ++j)
        } else {
          i++
          analyseDate(dateArg[i])
        }
      }
      return
    }
    analyseDate(dateArg[0])

    return analysedDate
  }

  private addAnalysisResult(dateArray: Array<any>) {
    let analyseDigits = this.sumDigits(dateArray.map((date) =>
      date[1]
    ).flat())
    let separatedAnalyseDigits = this.separateDigits(analyseDigits)
    let digitalRootAnalysis = this.sumDigits(separatedAnalyseDigits)
    let separatedDRA = this.separateDigits(digitalRootAnalysis)
    dateArray.push([separatedAnalyseDigits, separatedDRA])
    return dateArray
  }

  public processDates() {
    let preProcessedArray = [this.birthday, this.currentDate].map((date) =>
      this.organizeToArray(date)
    )

    this.processedArray = (
      preProcessedArray.map((individual) => this.addAnalysisResult(individual))
    )

    return {
      analysisOfBD: preProcessedArray[0],
      analysisOfCD: preProcessedArray[1],
    }
  }
}
