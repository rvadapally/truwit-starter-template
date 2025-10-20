# Pre-Deployment Checklist

## Before Pushing to main

### Asset Validation
- [ ] Run `npm run verify:assets` - All assets tracked in git
- [ ] Run `npm run verify:gitignore` - No critical directories ignored
- [ ] Check `public/images/` contains all required badge images
- [ ] Check `app/src/assets/` contains all required badge images

### Build Validation  
- [ ] Run `npm run build` - Build succeeds locally
- [ ] Run `npm run verify:build` - dist/ contains all required files
- [ ] Check `dist/images/` has Astro assets
- [ ] Check `dist/app/assets/` has Angular assets
- [ ] Verify no build errors in console output

### Testing
- [ ] Run `npm run test:e2e` - All tests pass
- [ ] Test badge images load in local development
- [ ] Test both Astro site and Angular app locally

### Code Quality
- [ ] No console.log statements in production code
- [ ] All TypeScript errors resolved
- [ ] No linting errors
- [ ] Commit message follows conventional commits format

## After Deployment

### Immediate Verification (0-5 minutes)
- [ ] Wait 60 seconds for CDN propagation
- [ ] Run `npm run verify:deployment` - All assets accessible
- [ ] Check Cloudflare build logs - No errors
- [ ] Verify deployment URL is accessible

### Manual Testing (5-15 minutes)
- [ ] Test in incognito/private browser - No cache
- [ ] Navigate to `https://truwit.ai` - Astro site loads
- [ ] Navigate to `https://truwit.ai/app` - Angular app loads
- [ ] Check badge images display correctly
- [ ] Verify images load with DevTools Network tab
- [ ] Test on mobile device/browser

### Asset Verification
- [ ] `https://truwit.ai/images/verified-circular-badge.jpg` loads
- [ ] `https://truwit.ai/images/verified-by-truwit.png` loads
- [ ] `https://truwit.ai/app/assets/verified-circular-badge.jpg` loads
- [ ] `https://truwit.ai/app/assets/verified-by-truwit.png` loads
- [ ] `https://truwit.ai/favicon-truwit.svg` loads

### Performance Check
- [ ] Page load times are acceptable (< 3 seconds)
- [ ] Images load without broken image icons
- [ ] No 404 errors in Network tab
- [ ] No JavaScript console errors

## Troubleshooting

### If Assets Don't Load
1. **Check git tracking**: `git ls-files | grep verified-circular-badge`
2. **Check .gitignore**: `grep -n "public" .gitignore`
3. **Check build logs**: Look for "Error copying badge" messages
4. **Check CDN cache**: Add `?v=timestamp` to URLs
5. **Check file sizes**: Assets should be > 10KB

### If Build Fails
1. **Run asset validation**: `npm run verify:assets`
2. **Check file permissions**: Ensure files are readable
3. **Check disk space**: Ensure enough space for build
4. **Check Node.js version**: Use Node 18+
5. **Clear node_modules**: `rm -rf node_modules && npm install`

### If Deployment Fails
1. **Check Cloudflare logs**: Look for build errors
2. **Check API tokens**: Verify CF_API_TOKEN is valid
3. **Check project name**: Verify projectName in workflow
4. **Check build command**: Ensure `npm run build` works locally
5. **Check output directory**: Ensure `dist/` exists after build

## Emergency Rollback

If deployment breaks the site:
1. **Revert commit**: `git revert <commit-hash>`
2. **Force push**: `git push origin main --force`
3. **Wait for rebuild**: Monitor Cloudflare build logs
4. **Verify rollback**: Test site functionality

## Prevention

### Regular Maintenance
- [ ] Weekly: Run full test suite
- [ ] Monthly: Review .gitignore patterns
- [ ] Before major releases: Full deployment test
- [ ] After dependency updates: Verify assets still work

### Monitoring
- [ ] Set up uptime monitoring for critical URLs
- [ ] Monitor Cloudflare build success rate
- [ ] Track asset load times
- [ ] Monitor 404 errors for missing assets
