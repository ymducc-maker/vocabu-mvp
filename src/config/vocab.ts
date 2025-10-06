import type { ContextId, VocabEntry } from '../types';

type VocabMap = Record<ContextId, VocabEntry[]>;

export const VOCAB: VocabMap = {
  travel: [
    {
      id: 'tr_1',
      en: 'boarding pass',
      ru: 'посадочный талон',
      sample: {
        simple: 'Show your boarding pass at the gate.',
        professional:
          'Please present your boarding pass for verification at the gate.',
        academic:
          'A boarding pass authorizes a passenger to enter the aircraft.',
      },
    },
    {
      id: 'tr_2',
      en: 'reservation',
      ru: 'бронь',
      sample: {
        simple: 'I have a hotel reservation.',
        professional:
          'Your reservation has been confirmed for the stated dates.',
        academic:
          'A reservation guarantees service availability within specified terms.',
      },
    },
    {
      id: 'tr_3',
      en: 'luggage',
      ru: 'багаж',
      sample: {
        simple: 'My luggage is too heavy.',
        professional: 'Your luggage exceeds the allowed weight limit.',
        academic: 'Checked luggage is subject to safety inspection.',
      },
    },
    {
      id: 'tr_4',
      en: 'customs',
      ru: 'таможня',
      sample: {
        simple: 'We go through customs after landing.',
        professional: 'Please declare goods at customs if required.',
        academic:
          'Customs control regulates the movement of goods across borders.',
      },
    },
  ],
  law: [
    {
      id: 'law_1',
      en: 'contract',
      ru: 'договор',
      sample: {
        simple: 'We signed a contract.',
        professional: 'The parties executed a contract outlining obligations.',
        academic: 'A contract is a binding agreement enforceable by law.',
      },
    },
    {
      id: 'law_2',
      en: 'evidence',
      ru: 'доказательство',
      sample: {
        simple: 'There is no evidence.',
        professional: 'The court found the evidence insufficient.',
        academic: 'Evidence supports or refutes a legal claim.',
      },
    },
    {
      id: 'law_3',
      en: 'plaintiff',
      ru: 'истец',
      sample: {
        simple: 'The plaintiff filed a claim.',
        professional: 'The plaintiff submitted a statement of claim.',
        academic: 'A plaintiff initiates a lawsuit seeking remedy.',
      },
    },
    {
      id: 'law_4',
      en: 'defendant',
      ru: 'ответчик',
      sample: {
        simple: 'The defendant disagreed.',
        professional: 'The defendant submitted a written response.',
        academic: 'A defendant is the party against whom a claim is brought.',
      },
    },
  ],
  it: [
    {
      id: 'it_1',
      en: 'deployment',
      ru: 'развёртывание',
      sample: {
        simple: 'We start the deployment.',
        professional: 'Deployment to production begins at 2 PM.',
        academic: 'Deployment is the process of releasing software to users.',
      },
    },
    {
      id: 'it_2',
      en: 'database',
      ru: 'база данных',
      sample: {
        simple: 'The database is slow.',
        professional: 'Database performance degraded under peak load.',
        academic: 'A database stores structured information for retrieval.',
      },
    },
    {
      id: 'it_3',
      en: 'bug',
      ru: 'ошибка',
      sample: {
        simple: 'We fixed a bug.',
        professional: 'A critical bug was patched in the latest build.',
        academic: 'A software bug is an unintended program behavior.',
      },
    },
    {
      id: 'it_4',
      en: 'encryption',
      ru: 'шифрование',
      sample: {
        simple: 'Encryption protects data.',
        professional: 'Encryption keys must be rotated regularly.',
        academic: 'Encryption transforms readable data into cipher text.',
      },
    },
  ],
  senior: [
    {
      id: 'sen_1',
      en: 'retirement',
      ru: 'пенсия',
      sample: {
        simple: 'She is planning retirement.',
        professional: 'Retirement benefits are paid monthly.',
        academic: 'Retirement marks the end of regular employment.',
      },
    },
    {
      id: 'sen_2',
      en: 'medication',
      ru: 'лекарство',
      sample: {
        simple: 'Take your medication daily.',
        professional: 'Medication must be taken as prescribed.',
        academic: 'Medication adherence improves treatment outcomes.',
      },
    },
    {
      id: 'sen_3',
      en: 'appointment',
      ru: 'запись на приём',
      sample: {
        simple: "I have a doctor's appointment.",
        professional: 'Your appointment is scheduled for Friday.',
        academic: 'An appointment is an agreed time for a consultation.',
      },
    },
    {
      id: 'sen_4',
      en: 'pension',
      ru: 'пенсионная выплата',
      sample: {
        simple: 'He receives a pension.',
        professional: 'Pension payments will be adjusted for inflation.',
        academic: 'A pension is a periodic benefit after retirement.',
      },
    },
  ],
};
