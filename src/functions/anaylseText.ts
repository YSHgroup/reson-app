const isNumeric = (character: string | number): boolean => !isNaN(+character)
const countOfChar = (char: string, charArr: string[]) => charArr.reduce((count, current) => {
    char === current && count++
    return count
},0) 

export const analyseText = (textObject: Record<string, any[]>) => {
  let textArray = []
  let indexesOfNum = []
  textObject['text'].forEach((obj) => {
    delete obj['updated_time']
    delete obj['updated_date']
    textArray.push(Object.values(obj))
  })
  textArray = textArray.flat(2)
  textArray.forEach((elem, i) => isNumeric(elem) && indexesOfNum.push(i)) // push the index of the numerical to a variable
  indexesOfNum.forEach((index) => textArray.splice(index, 1)) // remove numerical elements in the array
  let uniqueCharArray = new Set(textArray) // remove duplicates
  textArray = Array.from(uniqueCharArray)
  textArray = textArray.filter(string => string.length >= 3 )
  textArray.sort((a, b) => countOfChar(b, textArray) - countOfChar(a, textArray))
//   console.log('analysis text------sort-->', textArray)
  return textArray
}
