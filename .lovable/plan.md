

# Add "All" Option for Email Filter and Owner Signal

Add an "All" selection to both the Email Filter and Owner Signal dropdowns in the Query Generator, so clicking "Generate" or "Generate All Combos" rotates through every value in that category.

## Changes

**Single file: `src/components/leadgen/QueryGeneratorTab.tsx`**

1. Add an "All" option as the first item in the Email Filter dropdown and the Owner Signal dropdown.
2. Update the `generate` function: if emailFilter is "All", loop through every email filter value; if ownerSignal is "All", loop through every owner signal value. Produce one query row per combination.
3. Update the `generateAllCombos` function similarly -- it already loops email filters, so add the same logic for owner signals when "All" is selected.

## Result

- Selecting "All" for Email Filter produces queries for every email filter value (9 variants per platform).
- Selecting "All" for Owner Signal produces queries for every owner signal (8 variants per platform).
- Selecting "All" for both multiplies them together (72 variants per platform).
- Selecting a specific value works exactly as before.

