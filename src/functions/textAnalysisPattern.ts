const pos = require('pos')

const tagSuffix = (() => {
  let i = 0
  let tagCount = {}
  return (tag: string, increament = false) => {
    if (increament) {
      tagCount[tag] = ++i
    } else return tagCount[tag].toString()
  }
})()

export const textAnalysisPattern = (text: string, email: string) => {
  var words = new pos.Lexer().lex(text) // Tokenze the text

  // Perform part-of-speech tagging
  var tagger = new pos.Tagger()
  var taggedWords = tagger.tag(words)
  
  // Get digits for date
  var today = new Date()
  var Y = today.getFullYear()
  var M = today.getMonth() + 1
  var D = today.getDate()
  var h = today.getHours()
  var m = today.getMinutes()
  var s = today.getSeconds()
  var current_date = Y + '/' + M + '/' + D
  var current_time = h + ':' + m + ':' + s

  // Align the variables to return
  let patternObject: any = {}
  patternObject['current_date'] = current_date
  patternObject['current_time'] = current_time
  for (let i in taggedWords) {
    var taggedWord = taggedWords[i]
    var word = taggedWord[0]
    var tag = taggedWord[1]
    if (Object.keys(patternObject).includes(tag)) {
        // console.log('if tag iterated: ',Object.keys(patternObject).includes(tag), Object.keys(patternObject), '-tag: ', tag)
      tagSuffix(tag, true)
      patternObject[tag + tagSuffix(tag)] = word
    } else {
      console.log(word + ' /' + tag)
      patternObject[tag] = word
    }
  }
  return patternObject
}
