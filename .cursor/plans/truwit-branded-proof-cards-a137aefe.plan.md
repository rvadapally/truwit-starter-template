<!-- a137aefe-31c7-48d0-8ff6-40c611cabbd9 e3af2cc6-16bf-42b4-bc6f-4db81bead637 -->
# Refined TruWit Proof Card Implementation

## Overview

Replace the current proof card system with the exact SVG template and minimal generator provided by the user. This will achieve the refined 3D badge look shown in `truwit_badge.png` with minimal code changes.

## Changes Required

### 1. Replace SVG Template

**File:** `api/CardTemplates/proof-card.svg`

Replace entire file with the user's provided SVG template featuring:

- Refined 3D badge with wider teal ring and smaller dark core
- Gradient backgrounds for depth
- White checkmark
- Soft shadow filter
- "Verified by TruWit • PROVENANCE • PROOF • TRUST" text
- White card at bottom with placeholders for `{PROOF_ID}`
- QR code placeholder area

### 2. Simplify ProofCardSvgGenerator

**File:** `api/Application/Services/ProofCardSvgGenerator.cs`

Replace with the user's minimal implementation:

- Single class, no fallback complexity
- Reads SVG template
- Replaces `{PROOF_ID}` and `{VERIFICATION_URL}` placeholders
- Renders at any size (scales from 1024 design size)
- Draws QR code at exact coordinates (x=778, y=730, size=120 in 1024, scaled proportionally)
- Clean, straightforward code

### 3. Verify NuGet Packages

**File:** `api/HumanProof.Api.csproj`

Ensure these packages are referenced:

- SkiaSharp
- SkiaSharp.NativeAssets.Linux.NoDependencies  
- SkiaSharp.Extended.Svg (instead of Svg.Skia)
- QRCoder

Update if needed to use `SkiaSharp.Extended.Svg` instead of current `Svg.Skia`.

### 4. Verify .gitignore

**File:** `api/.gitignore`

Ensure proof card images are ignored:

```
wwwroot/assets/proof/*.png
!wwwroot/assets/proof/.gitkeep
```

### 5. Test Locally

- Rebuild Docker container
- Generate test proof card
- Verify it matches the refined 3D badge design
- Test both static serving and regenerate-on-miss

## Files to Modify

- `api/CardTemplates/proof-card.svg` - Complete replacement
- `api/Application/Services/ProofCardSvgGenerator.cs` - Simplified implementation  
- `api/HumanProof.Api.csproj` - Verify/update packages if needed
- `api/.gitignore` - Verify gitignore rules

## Key Differences from Current Implementation

- Cleaner SVG with exact design specifications
- No manual SkiaSharp composition fallback (SVG is designed to work)
- Uses `SkiaSharp.Extended.Svg` (simpler API) instead of `Svg.Skia`
- Generator is ~40 lines instead of ~240 lines
- No complexity, just: load SVG → replace text → render → draw QR → save

## Testing

1. Build succeeds without errors
2. Generate proof card for test ID
3. Verify output matches `truwit_badge.png` design
4. Verify QR code is positioned correctly
5. Test at multiple sizes (640, 800, 1024)

### To-dos

- [ ] Replace proof-card.svg with user's refined 3D badge SVG template
- [ ] Update NuGet packages to use SkiaSharp.Extended.Svg instead of Svg.Skia
- [ ] Replace ProofCardSvgGenerator with user's minimal 40-line implementation
- [ ] Verify .gitignore has correct proof card rules
- [ ] Test proof card generation matches refined 3D badge design