# Post-Deploy Validation Checklist

## Overview
This checklist ensures that deployments are validated before considering them successful. Run this after every deployment to prevent embarrassing production issues.

## Pre-Deploy Checklist (Before Pushing)

### 1. Asset Verification
- [ ] **Logo exists**: Check `public/logo.svg` and `app/src/assets/logo.svg`
- [ ] **Badge exists**: Check `public/images/verified-circular-badge.jpg` and `app/src/assets/verified-circular-badge.jpg`
- [ ] **Asset paths**: Verify all asset references use correct paths:
  - Astro: `/logo.svg`, `/images/verified-circular-badge.jpg`
  - Angular: `assets/logo.svg`, `assets/verified-circular-badge.jpg`

### 2. Build Verification
- [ ] **Astro build**: Run `npm run build` in root directory
- [ ] **Angular build**: Run `npm run build` in `app/` directory
- [ ] **No build errors**: Check console for TypeScript/compilation errors
- [ ] **Asset copying**: Verify assets are copied to `dist/` folder

### 3. Component Integration
- [ ] **All Astro pages**: Check that all 8 pages use new `Header` component
- [ ] **No duplicate content**: Verify homepage has only one hero section
- [ ] **Theme variables**: Confirm `theme-variables.css` is imported in `global.css`

## Post-Deploy Checklist (After Deployment)

### 1. Critical Page Checks
- [ ] **Homepage loads**: `https://truwit.ai/` displays correctly
- [ ] **Logo displays**: Header shows logo.svg (not broken image)
- [ ] **No empty spaces**: Content is properly positioned
- [ ] **Footer badge**: Footer shows verified-circular-badge.jpg

### 2. Navigation Checks
- [ ] **All Astro pages**: Test `/about`, `/how-it-works`, `/contact`, etc.
- [ ] **Angular app**: Test `/app/#/verify` loads correctly
- [ ] **Header consistency**: All pages show same header with logo
- [ ] **Footer consistency**: All pages show same footer with badge

### 3. Theme Synchronization
- [ ] **Theme toggle works**: Click theme toggle in Astro header
- [ ] **Angular sync**: Navigate to `/app/#/verify` - theme should match
- [ ] **Persistence**: Refresh page - theme should persist
- [ ] **Default theme**: New visitors see dark theme by default

### 4. Asset Loading
- [ ] **No 404s**: Check browser dev tools for missing assets
- [ ] **Images load**: All logos and badges display correctly
- [ ] **No broken links**: All internal links work

### 5. Responsive Design
- [ ] **Desktop (1440px)**: Layout looks correct
- [ ] **Tablet (768px)**: Layout adapts properly
- [ ] **Mobile (480px)**: Layout is mobile-friendly
- [ ] **Theme toggle**: Works on all screen sizes

## Automated Validation Scripts

### Run E2E Tests
```bash
# Test badge consistency
./run-badge-consistency-tests.bat

# Test comprehensive functionality
./run-comprehensive-e2e-tests.bat
```

### Manual Validation Commands
```bash
# Check asset paths
ls public/logo.svg
ls public/images/verified-circular-badge.jpg
ls app/src/assets/logo.svg
ls app/src/assets/verified-circular-badge.jpg

# Test builds locally
npm run build
cd app && npm run build
```

## Emergency Rollback Plan

If deployment fails validation:

1. **Immediate rollback**:
   ```bash
   git checkout v1.0.0-mvp
   git push origin main --force
   ```

2. **Identify issues**:
   - Check deployment logs
   - Run local builds
   - Test asset paths

3. **Fix and redeploy**:
   - Fix issues locally
   - Test thoroughly
   - Deploy incrementally

## Common Issues & Solutions

### Issue: Logo not displaying
- **Cause**: Wrong asset path (`/assets/` vs `/logo.svg`)
- **Fix**: Update component asset paths

### Issue: Empty spaces on homepage
- **Cause**: Duplicate hero sections
- **Fix**: Remove old hero content from `index.astro`

### Issue: Theme not syncing
- **Cause**: Missing theme service or localStorage
- **Fix**: Check `ThemeService` and `main.ts` initialization

### Issue: Build failures
- **Cause**: Missing imports or standalone component issues
- **Fix**: Check Angular module imports and component declarations

## Success Criteria

✅ **Deployment is successful when**:
- All pages load without errors
- Logo displays in header on all pages
- Footer badge displays on all pages
- Theme toggle works and syncs between Astro/Angular
- No console errors
- No missing assets (404s)
- Responsive design works on all screen sizes
- E2E tests pass

## Notes

- **Always test locally first**: Run builds and check asset paths
- **Deploy incrementally**: Fix one issue at a time
- **Use MVP baseline**: `v1.0.0-mvp` tag for rollback
- **Document issues**: Update this checklist with new common issues

---

**Last Updated**: January 2025
**Version**: 1.0
