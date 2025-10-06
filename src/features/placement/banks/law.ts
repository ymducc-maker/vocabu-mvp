export type RawQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export const LAW_QUESTIONS: RawQuestion[] = [
  {
    prompt: 'Law: "The judge dismissed the case." — "dismissed" means…',
    options: ['continued', 'restarted', 'threw out', 'won'],
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    prompt: 'Contract: "This clause is legally ___."',
    options: ['binding', 'tying', 'closing', 'locking'],
    correctIndex: 0,
    difficulty: 'medium',
  },
  {
    prompt: 'Court: "witness" is…',
    options: ['lawyer', 'person who saw/knows facts', 'judge', 'accused'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Document: "evidence" refers to…',
    options: ['opinions', 'proofs', 'rumors', 'predictions'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Agreement: "breach of contract" means…',
    options: ['improvement', 'violation', 'translation', 'registration'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Term: "liability" is…',
    options: ['responsibility', 'permission', 'payment', 'ignorance'],
    correctIndex: 0,
    difficulty: 'medium',
  },
  {
    prompt: 'Process: "appeal the decision" means…',
    options: [
      'enforce it',
      'challenge it in higher court',
      'ignore it',
      'publish it',
    ],
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    prompt: 'Civil vs criminal: "plaintiff" is…',
    options: ['prosecutor', 'accused', 'complainant', 'witness'],
    correctIndex: 2,
    difficulty: 'easy',
  },
];
