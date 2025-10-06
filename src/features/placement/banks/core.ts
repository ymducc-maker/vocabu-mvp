export type RawQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export const CORE_QUESTIONS: RawQuestion[] = [
  {
    prompt: 'Choose the correct form: "I ___ to the store yesterday."',
    options: ['go', 'went', 'gone', 'going'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Article: "I have ___ umbrella."',
    options: ['a', 'an', 'the', '-'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Preposition: "I am interested ___ science."',
    options: ['in', 'on', 'at', 'for'],
    correctIndex: 0,
    difficulty: 'easy',
  },
  {
    prompt: 'Synonym of "rapid":',
    options: ['slow', 'late', 'fast', 'early'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  {
    prompt:
      'Meaning: "The meeting was postponed to next week." — "postponed" means…',
    options: ['cancelled', 'delayed', 'moved earlier', 'finished'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Phrasal verb: "Please ___ the form."',
    options: ['fill in', 'fill on', 'fill at', 'fill for'],
    correctIndex: 0,
    difficulty: 'easy',
  },
  {
    prompt: 'Perfect: "She has ___ this movie three times."',
    options: ['see', 'saw', 'seen', 'seeing'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  {
    prompt: 'Collocation: "make a ___" (future arrangements)',
    options: ['decision', 'plan', 'research', 'message'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Plural/there: "There ___ many people at the museum today."',
    options: ['is', 'are', 'be', 'was'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Conditionals: "If it ___ tomorrow, we will stay at home."',
    options: ['rains', 'rained', 'will rain', 'has rained'],
    correctIndex: 0,
    difficulty: 'medium',
  },
  {
    prompt: 'Word choice: "highly ___" (likely / probable)',
    options: ['possible', 'possibly', 'possibility', 'possessed'],
    correctIndex: 0,
    difficulty: 'medium',
  },
  {
    prompt: 'Register: formal synonym of "ask":',
    options: ['require', 'request', 'beg', 'invite'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Tense: "By 2026, they ___ the new campus."',
    options: ['build', 'built', 'will have built', 'are building'],
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    prompt: 'Word form: "This task is highly ___." (challenge)',
    options: ['challenging', 'challenge', 'challenged', 'challengeful'],
    correctIndex: 0,
    difficulty: 'medium',
  },
  {
    prompt: 'Collocation: "meet the ___" (requirements/criteria)',
    options: ['needs', 'criteria', 'goal', 'wish'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Register: polite request — "___ you possibly help me with this?"',
    options: ['Can', 'Could', 'May', 'Should'],
    correctIndex: 1,
    difficulty: 'easy',
  },
];
