import { prisma } from '../src/lib/prisma'

const questionSets = {
  JavaScript: [
    {
      id: 'javascript-1',
      prompt: 'What does Array.prototype.map() return?',
      options: ['A new array', 'The original array', 'A boolean', 'An iterator only'],
      correctIndex: 0,
    },
    {
      id: 'javascript-2',
      prompt: 'Which declaration creates a block-scoped variable that can be reassigned?',
      options: ['var', 'let', 'const', 'function'],
      correctIndex: 1,
    },
    {
      id: 'javascript-3',
      prompt: 'What is the result of typeof null?',
      options: ['"null"', '"undefined"', '"object"', '"boolean"'],
      correctIndex: 2,
    },
    {
      id: 'javascript-4',
      prompt: 'Which method converts a JSON string into a JavaScript value?',
      options: ['JSON.stringify', 'JSON.parse', 'Object.fromEntries', 'String.decode'],
      correctIndex: 1,
    },
    {
      id: 'javascript-5',
      prompt: 'When does a Promise finally callback run?',
      options: [
        'Only when it resolves',
        'Only when it rejects',
        'After it settles, whether fulfilled or rejected',
        'Before its then callback',
      ],
      correctIndex: 2,
    },
    {
      id: 'javascript-6',
      prompt: 'Which operator returns its right operand when the left operand is null or undefined?',
      options: ['||', '&&', '??', '?.'],
      correctIndex: 2,
    },
    {
      id: 'javascript-7',
      prompt: 'What does Object.freeze(obj) do?',
      options: [
        'Deep-freezes every nested object',
        'Prevents top-level properties from being added or changed',
        'Serializes the object',
        'Creates an immutable copy',
      ],
      correctIndex: 1,
    },
    {
      id: 'javascript-8',
      prompt: 'Which statement about async functions is correct?',
      options: [
        'They always return a Promise',
        'They can only contain one await',
        'They run in a separate thread',
        'They cannot throw errors',
      ],
      correctIndex: 0,
    },
  ],
  React: [
    {
      id: 'react-1',
      prompt: 'Why should list elements have stable keys?',
      options: [
        'To help React match items across renders',
        'To make CSS selectors shorter',
        'To prevent all rerenders',
        'To enable server components',
      ],
      correctIndex: 0,
    },
    {
      id: 'react-2',
      prompt: 'When should an effect cleanup function run?',
      options: [
        'Only after the component unmounts',
        'Before the effect reruns and when the component unmounts',
        'Before the first effect runs',
        'After every state update, regardless of dependencies',
      ],
      correctIndex: 1,
    },
    {
      id: 'react-3',
      prompt: 'What is a controlled input?',
      options: [
        'An input whose value is driven by React state',
        'An input that cannot receive focus',
        'An input rendered only on the server',
        'An input without an onChange handler',
      ],
      correctIndex: 0,
    },
    {
      id: 'react-4',
      prompt: 'What does useMemo primarily do?',
      options: [
        'Memoizes a calculated value between renders',
        'Schedules a state update',
        'Runs a callback after paint',
        'Creates a context provider',
      ],
      correctIndex: 0,
    },
    {
      id: 'react-5',
      prompt: 'Where should a side effect such as subscribing to an event live?',
      options: ['During render', 'In an effect', 'In a state initializer', 'In a JSX expression'],
      correctIndex: 1,
    },
    {
      id: 'react-6',
      prompt: 'What does lifting state up mean?',
      options: [
        'Moving shared state to a common ancestor',
        'Replacing state with refs',
        'Moving all state to the server',
        'Using a reducer for every component',
      ],
      correctIndex: 0,
    },
    {
      id: 'react-7',
      prompt: 'What does React.StrictMode help identify in development?',
      options: [
        'Potentially unsafe patterns and impure effects',
        'Slow network requests',
        'CSS specificity conflicts',
        'Missing production environment variables',
      ],
      correctIndex: 0,
    },
    {
      id: 'react-8',
      prompt: 'What is the purpose of a React context?',
      options: [
        'Share values through a subtree without passing props at every level',
        'Replace all component state',
        'Store data persistently in a database',
        'Run code on the server',
      ],
      correctIndex: 0,
    },
  ],
  SQL: [
    {
      id: 'sql-1',
      prompt: 'Which clause filters rows before grouping?',
      options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'],
      correctIndex: 1,
    },
    {
      id: 'sql-2',
      prompt: 'What does a LEFT JOIN preserve?',
      options: [
        'All rows from the left table',
        'Only matching rows from both tables',
        'All rows from the right table',
        'Only rows with NULL values',
      ],
      correctIndex: 0,
    },
    {
      id: 'sql-3',
      prompt: 'Which aggregate counts non-NULL values in a column?',
      options: ['COUNT(column)', 'SUM(column)', 'ROWS(column)', 'TOTAL(column)'],
      correctIndex: 0,
    },
    {
      id: 'sql-4',
      prompt: 'Which clause filters grouped aggregate results?',
      options: ['WHERE', 'HAVING', 'FROM', 'DISTINCT'],
      correctIndex: 1,
    },
    {
      id: 'sql-5',
      prompt: 'What is the purpose of a primary key?',
      options: [
        'Uniquely identify each row',
        'Sort rows automatically',
        'Encrypt a table',
        'Join every table in a database',
      ],
      correctIndex: 0,
    },
    {
      id: 'sql-6',
      prompt: 'Which statement safely selects rows matching a parameterized value?',
      options: [
        'Build SQL by concatenating user input',
        'Use a parameterized query',
        'Escape only single quotes',
        'Disable database constraints',
      ],
      correctIndex: 1,
    },
    {
      id: 'sql-7',
      prompt: 'What does a transaction provide?',
      options: [
        'A group of operations committed or rolled back together',
        'An automatic backup',
        'A table index',
        'A read-only connection',
      ],
      correctIndex: 0,
    },
    {
      id: 'sql-8',
      prompt: 'Which index is generally useful for filtering on a frequently queried column?',
      options: ['A B-tree index', 'A foreign key only', 'A view', 'A trigger'],
      correctIndex: 0,
    },
  ],
} as const

async function main() {
  for (const [category, questions] of Object.entries(questionSets)) {
    for (const question of questions) {
      await prisma.skillQuestion.upsert({
        where: { id: question.id },
        create: {
          ...question,
          category,
          options: [...question.options],
        },
        update: {
          prompt: question.prompt,
          category,
          options: [...question.options],
          correctIndex: question.correctIndex,
        },
      })
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error('Skill assessment seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
