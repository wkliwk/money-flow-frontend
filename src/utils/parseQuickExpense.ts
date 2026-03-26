export interface ParsedExpense {
  description: string;
  amount: number;
  category: string;
}

const KNOWN_CATEGORIES = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Other',
] as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['food', 'restaurant', 'dinner', 'lunch', 'breakfast', 'cafe', 'coffee', 'pizza', 'burger', 'sushi', 'grocery', 'groceries', 'supermarket', 'market'],
  Transport: ['transport', 'uber', 'taxi', 'gas', 'petrol', 'bus', 'metro', 'mtr', 'parking', 'fuel'],
  Utilities: ['utilities', 'electricity', 'water', 'internet', 'phone', 'utility'],
  Entertainment: ['entertainment', 'movie', 'cinema', 'game', 'show', 'concert', 'netflix', 'gaming'],
  Shopping: ['shopping', 'clothes', 'fashion', 'dress', 'shoes', 'clothing'],
  Health: ['health', 'doctor', 'pharmacy', 'medicine', 'gym', 'medical'],
  Education: ['education', 'school', 'course', 'book', 'tuition', 'class'],
};

function matchCategory(word: string): string | null {
  const lower = word.toLowerCase();
  for (const cat of KNOWN_CATEGORIES) {
    if (cat.toLowerCase() === lower) return cat;
  }
  return null;
}

export function suggestCategory(description: string): string {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return 'Other';
}

export function parseQuickExpense(input: string): ParsedExpense | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);

  let amount = 0;
  let category = '';
  const descParts: string[] = [];
  let foundNumber = false;

  for (const part of parts) {
    const num = parseFloat(part);
    if (!isNaN(num) && num >= 0 && !foundNumber) {
      amount = num;
      foundNumber = true;
      continue;
    }
    const catMatch = matchCategory(part);
    if (catMatch && !category) {
      category = catMatch;
      continue;
    }
    descParts.push(part);
  }

  if (!foundNumber) return null;

  const description = descParts.join(' ').trim();

  if (!category && description) {
    category = suggestCategory(description);
  }
  if (!category) {
    category = 'Other';
  }

  return { description, amount, category };
}
