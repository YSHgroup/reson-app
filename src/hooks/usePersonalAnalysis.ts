import { useState, useEffect } from 'react'
import { DateProcessor } from '../class/DateProcessor'

const counterIndividualNumber = (numArr: number[] | string[]) => {
  let q = new Array<number>(9)
  q.fill(0)
  q.forEach((_, i) => {
    q[i] = numArr.filter((num) => num === (i + 1).toString()).length
  })
  console.log('q: ', q)
  return q
}

export const usePersonalAnalysis = (date: Record<string, string | number>) => {
  const keys = Object.keys(date).reverse()
  const userObject = keys.reduce((obj, key) => {
    obj[key] = date[key]
    return obj
  }, {})
  const [value, setValue] = useState(userObject)

  console.log('personal analysis value: ', value)
  const result = new DateProcessor(value)
  const { analysisOfBD, analysisOfCD } = result.processDates()
  const resultOfAnalysis = {
    birthdayProperty: analysisOfBD.flat(2),
    dateProperty: analysisOfCD.flat(2),
  }
  const qOfAnalysis = Object.values(resultOfAnalysis).map((eachProperty) =>
    counterIndividualNumber(eachProperty)
  )
  // console.log('class result: ', Object.values(result.currentDate)[0].toString().split(''))
  console.log(
    'use class to calculate the result: ',
    resultOfAnalysis,
    qOfAnalysis
  )
  return { ...value }
}
