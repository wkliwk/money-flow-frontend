# Debugging Participants Field Bug

## How to Reproduce and Debug

1. **Open the app in your browser**
2. **Open browser Developer Tools (F12)**
3. **Go to Console tab**
4. **Create a new expense with participants:**
   - Click "+ Add Expense" or press `n`
   - Fill in description/item and amount
   - Scroll down to **"With"** section
   - Add participants (e.g., "Alice", "Bob")
   - Click "Save"

5. **Check the console logs** - you should see:
   - `[DEBUG] Expense request:` - shows what's being SENT to the API
   - `[DEBUG] ParticipantPicker: Adding participant` - shows when participants are added to state
   - `[DEBUG] Expense response:` - shows what the API RETURNS

## What to Look For

### If participants are NOT in the request:
- The `[DEBUG] Expense request` log should show `participants: [...]`
- If it's missing or empty, the issue is in AddExpenseModal or ParticipantPicker

### If participants are in the request but NOT in the response:
- The API received the data but didn't store it
- Check backend logs for errors

### If participants are in the response but NOT showing in UI:
- The data is stored correctly but the frontend isn't displaying it
- Check ExpenseList component

## Key Code Locations

- **Frontend Request**: `src/axiosInstance.ts` - logs all expense requests
- **ParticipantPicker**: `src/components/expenses/ParticipantPicker.tsx` - logs when participants are added
- **AddExpenseModal**: `src/components/expenses/AddExpenseModal.tsx` - line 128 includes participants in submission
- **ExpenseList Display**: `src/components/expenses/ExpenseList.tsx` - lines 169-172 (mobile), 227 (desktop) display participants

## Example Debug Output

```
[DEBUG] ParticipantPicker: Adding participant {current: [], adding: "Alice", newArray: ["Alice"]}
[DEBUG] Expense request: {url: "/api/expenses", method: "post", data: {..., participants: ["Alice"]}}
[DEBUG] Expense response: {url: "/api/expenses", status: 201, data: {..., participants: ["Alice"]}}
```

## Next Steps if Issue Persists

1. Share the console logs when you try to add an expense with participants
2. Check if ParticipantPicker section is even rendering (should see "With" header)
3. Verify the "With" section is inside AddExpenseModal (not in a different modal)
