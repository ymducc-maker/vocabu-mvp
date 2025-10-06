export type RawQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export const IT_QUESTIONS: RawQuestion[] = [
  {
    prompt: 'IT: "The server didn’t ___ due to a config error."',
    options: ['launch', 'deploy', 'compile', 'boot'],
    correctIndex: 3,
    difficulty: 'medium',
  },
  {
    prompt: 'Stack: "frontend" mainly refers to…',
    options: ['server logic', 'database', 'client UI', 'devops'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  {
    prompt: 'Networking: "latency" is…',
    options: ['throughput', 'delay', 'bandwidth', 'packet size'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Security: "encryption" provides…',
    options: ['compression', 'confidentiality', 'redundancy', 'latency'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    prompt: 'Git: "merge conflict" happens when…',
    options: ['two edits overlap', 'network lost', 'disk full', 'tag missing'],
    correctIndex: 0,
    difficulty: 'easy',
  },
  {
    prompt: 'API: typical auth token is…',
    options: ['stateful cookie', 'opaque string', 'HTML snippet', 'SQL query'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    prompt: 'Cloud: "container" is…',
    options: ['VM image', 'isolated runtime unit', 'backup file', 'script'],
    correctIndex: 1,
    difficulty: 'hard',
  },
];
