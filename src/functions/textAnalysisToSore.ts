const pos = require('pos')

const tagSuffix = (() => {
  let tagCount = {}
  return (tag: string, increament = false) => {
    if (increament) {
      if(!tagCount[tag]) tagCount[tag] = 0
      tagCount[tag]++
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
  patternObject['updated_date'] = current_date
  patternObject['updated_time'] = current_time
  for (let i in taggedWords) {
    var taggedWord = taggedWords[i]
    var word = taggedWord[0]
    var tag = taggedWord[1]
    if([',','.',':','(',')', ';', '\'', '"' ].includes(word)) continue
    if (Object.keys(patternObject).includes(tag)) {
        // console.log('if tag iterated: ',Object.keys(patternObject).includes(tag), Object.keys(patternObject), '-tag: ', tag)
        tagSuffix(tag, true)
        patternObject[tag + tagSuffix(tag)] = word
      } else {
      // console.log(word + ' /' + tag)
      patternObject[tag] = word
    }
  }
  console.table(patternObject)
  return patternObject
}
