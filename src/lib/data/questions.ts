export const QUESTIONS: readonly string[] = [
  'If you could replace one bone in your body with a foreign object, which bone and which object?',
  'On a scale from "wet sand" to "a stranger\'s laugh", how do you feel about Tuesdays?',
  'What is the first thing you would say to a sentient refrigerator?',
  'Describe the texture of your inner monologue.',
  'If your shadow filed a complaint, what would the subject line read?',
  'What is the difference between being alone and being a room?',
  'List three sounds your name would make if it were an object dropped on tile.',
  'Pick a kitchen utensil that best represents your capacity for forgiveness.',
  'If you had to hide forever, which piece of furniture would you live inside?',
  'Finish the sentence: "The truth is, everyone eventually ______."'
];

export function questionId(index: number): string {
  return String(index);
}
