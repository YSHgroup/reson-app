import { useState, useCallback } from 'react'
import { DateProcessor } from '../classes/DateProcessor'

const counterIndividualNumber = (numArr: number[] | string[]) => {
  let q = new Array<number>(9)
  q.fill(0)
  q.forEach((_, i) => {
    q[i] = numArr.filter((num) => num === (i + 1).toString()).length
  })
  return q
}

export const usePersonalAnalysis = (date: Record<string, string | number>): [number[][], ()=>void] => {
  const [value, setValue] = useState<number[][]>([[]])
  const resultAnalysis = useCallback<() => void>(
    () => {
      const keys = Object.keys(date).reverse()
      const userObject = keys.reduce((obj, key) => {
        obj[key] = date[key]
        return obj
      }, {})
      const result = new DateProcessor(userObject)
      const { analysisOfBD, analysisOfCD } = result.processDates()
      const resultOfAnalysis = {
        birthdayProperty: analysisOfBD.flat(2),
        dateProperty: analysisOfCD.flat(2),
      }
      const qOfAnalysis = Object.values(resultOfAnalysis).map((eachProperty) =>
        counterIndividualNumber(eachProperty)
      )
      setValue(qOfAnalysis)
      return qOfAnalysis
    },
    [date]
  )
  return [ value, resultAnalysis ]
}
