export type RawQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export const SENIOR_QUESTIONS: RawQuestion[] = [
  {
    prompt: 'Healthcare: "pharmacy" is a place where you…',
    options: ['buy medicine', 'see a lawyer', 'repair shoes', 'take a taxi'],
    correctIndex: 0,
    difficulty: 'easy',
  },
  {
    prompt: 'Appointments: "reschedule" means…',
    options: [
      'cancel forever',
      'move to another time',
      'arrive late',
      'shorten',
    ],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Support: "caregiver" is…',
    options: [
      'family doctor',
      'person who provides help',
      'insurance agent',
      'neighbor',
    ],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Benefit: "discount" means…',
    options: ['extra payment', 'lower price', 'higher tax', 'free ticket'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Clinic: "balance exercises" help with…',
    options: ['cooking', 'fall prevention', 'insurance', 'translation'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Community: "volunteer" is someone who…',
    options: [
      'works for money',
      'serves by choice for free',
      'travels a lot',
      'studies law',
    ],
    correctIndex: 1,
    difficulty: 'easy',
  },
];
