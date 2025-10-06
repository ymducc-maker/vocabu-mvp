export type RawQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export const TRAVEL_QUESTIONS: RawQuestion[] = [
  {
    prompt: 'Travel: "Where can I collect my luggage?" — at the…',
    options: ['check-in', 'baggage claim', 'security', 'gate'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: '"non-refundable" ticket means…',
    options: [
      'you can’t get money back',
      'you can change date free',
      'luggage included',
      'seat not assigned',
    ],
    correctIndex: 0,
    difficulty: 'medium',
  },
  {
    prompt: 'At a hotel: "I’d like to ___ my reservation."',
    options: ['cancel', 'calculate', 'conclude', 'construct'],
    correctIndex: 0,
    difficulty: 'easy',
  },
  {
    prompt: 'Airport: "Your flight has been ___ due to weather."',
    options: ['advanced', 'delayed', 'returned', 'landed'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Tourism: "local ___" (typical food)',
    options: ['cuisine', 'kitchen', 'meal', 'cook'],
    correctIndex: 0,
    difficulty: 'medium',
  },
  {
    prompt: 'Direction: "Go straight and then ___ left."',
    options: ['take', 'do', 'make', 'get'],
    correctIndex: 0,
    difficulty: 'easy',
  },
  {
    prompt: 'Phrase: "fully booked" means…',
    options: [
      'no rooms available',
      'half price',
      'breakfast included',
      'late check-out',
    ],
    correctIndex: 0,
    difficulty: 'easy',
  },
  {
    prompt: 'Safety: "Watch your belongings" is closest to…',
    options: [
      'buy souvenirs',
      'mind your possessions',
      'ask for help',
      'exchange money',
    ],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt:
      'At the border: "Do you have anything to declare?" — "declare" means…',
    options: ['throw away', 'state officially', 'borrow', 'hide'],
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    prompt: 'Transport: "single ticket" vs "return ticket" — return means…',
    options: ['one-way', 'round-trip', 'multi-ride', 'transfer'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Accommodation: "amenities" are…',
    options: ['problems', 'comforts/facilities', 'payments', 'neighbors'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Problem: "Our room ___ hot water."',
    options: ['lacks', 'misses', 'loses', 'drops'],
    correctIndex: 0,
    difficulty: 'hard',
  },
];
