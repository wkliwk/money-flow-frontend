/**
 * Parse natural language expense input
 * Examples:
 *   "coffee 5" → { item: "coffee", amount: 5 }
 *   "lunch 12.50 usd" → { item: "lunch", amount: 12.50 }
 *   "5" → { item: "", amount: 5 }
 *   "groceries" → { item: "groceries", amount: 0 }
 */
export interface ParsedExpense {
  item: string;
  amount: number;
  currency?: string;
}

export function parseQuickExpense(input: string): ParsedExpense | null {
  if (!input.trim()) return null;

  const parts = input.trim().split(/\s+/);
  if (parts.length === 0) return null;

  let item = '';
  let amount = 0;
  let currency = '';

  // Check if first part is a number
  const firstIsNumber = !isNaN(parseFloat(parts[0]));

  if (firstIsNumber) {
    // Format: "5 usd" or "5"
    amount = parseFloat(parts[0]);
    currency = parts[1] || '';
  } else {
    // Format: "coffee 5 usd" or "coffee 5" or "coffee"
    // Find where the number starts
    let numberIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      if (!isNaN(parseFloat(parts[i]))) {
        numberIndex = i;
        break;
      }
    }

    if (numberIndex === -1) {
      // No number found, entire input is item name
      item = parts.join(' ');
    } else {
      // Everything before number is item name
      item = parts.slice(0, numberIndex).join(' ');
      amount = parseFloat(parts[numberIndex]);
      if (numberIndex + 1 < parts.length) {
        currency = parts[numberIndex + 1];
      }
    }
  }

  // Validate amount
  if (isNaN(amount) || amount < 0) {
    return null;
  }

  return {
    item: item.toLowerCase().trim(),
    amount,
    ...(currency && { currency: currency.toUpperCase() }),
  };
}

/**
 * Map common expense descriptions to categories
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  groceries: ['grocery', 'groceries', 'supermarket', 'market', 'shopping', 'food shopping'],
  food: ['restaurant', 'dinner', 'lunch', 'breakfast', 'cafe', 'coffee', 'pizza', 'burger', 'sushi', 'food'],
  transport: ['uber', 'taxi', 'gas', 'petrol', 'bus', 'metro', 'transport', 'parking', 'fuel'],
  entertainment: ['movie', 'cinema', 'game', 'show', 'concert', 'entertainment', 'netflix', 'gaming'],
  utilities: ['electricity', 'water', 'internet', 'phone', 'utility', 'utilities'],
  health: ['doctor', 'pharmacy', 'medicine', 'gym', 'health', 'medical'],
  clothing: ['clothes', 'shopping', 'fashion', 'dress', 'shoes', 'clothing'],
};

export function suggestCategory(item: string): string {
  const itemLower = item.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => itemLower.includes(kw))) {
      return category;
    }
  }

  // Default category
  return 'Miscellaneous';
}
