# TruWit - Product Hunt Launch Materials

## Tagline (60 chars max)
**"Prove you made it first. Bitcoin-anchored content provenance."**

Alternative taglines:
- "Timestamp your creative work on the Bitcoin blockchain"
- "Fight AI theft with cryptographic proof of creation"
- "Your work, your proof, anchored to Bitcoin - free"

## One-liner (140 chars max)
TruWit creates Bitcoin-anchored proof that you created content before anyone else. Protect your art, photos, and videos from AI theft - free.

## Description

### Problem
In the age of AI, proving you created something is harder than ever. Art gets scraped for AI training. Photos get stolen and go viral without credit. When disputes happen, you need proof - but timestamps can be faked, metadata can be edited.

### Solution
TruWit creates tamper-proof, Bitcoin-anchored timestamps for your content. 

**How it works:**
1. Submit your content (image, video, URL)
2. We generate a cryptographic hash and timestamp
3. That timestamp gets anchored to the Bitcoin blockchain via OpenTimestamps
4. You get a shareable proof card and downloadable .ots file

**What makes it different:**
- **Bitcoin-anchored** - Your timestamp is anchored to an immutable public ledger, not just "trust us"
- **Free** - Thanks to OpenTimestamps batching, there are zero blockchain fees
- **Simple** - No crypto wallet needed. Paste a URL, get a proof
- **C2PA compatible** - Built on the industry-standard Content Provenance protocol

### Use Cases
- **Artists**: Prove you created artwork before it gets AI-scraped
- **Photographers**: Timestamp photos before publishing to prove original ownership
- **Journalists**: Create evidence chains for sensitive source material
- **Legal**: Establish prior art and creation dates for IP disputes

## First Comment (Maker's Story)

Hey Product Hunt! 👋

I built TruWit because I was frustrated watching artists get their work scraped for AI training with no recourse. "I made this" shouldn't be hard to prove.

The technical challenge was making blockchain timestamping accessible. Most solutions require crypto wallets and transaction fees. TruWit uses OpenTimestamps to batch thousands of proofs into single Bitcoin transactions - making it free for everyone.

Every TruWit proof is:
- ✅ Cryptographically signed
- ✅ Bitcoin-anchored (via OpenTimestamps)
- ✅ C2PA compatible (Adobe/Microsoft standard)
- ✅ Downloadable as a verifiable .ots file

I'm launching this for free because I believe content provenance should be a public good. If you're a creator worried about AI, this is for you.

Happy to answer any questions about the tech or roadmap!

## Keywords/Topics
- Content provenance
- Digital watermarking
- AI art protection
- Copyright protection
- Blockchain timestamping
- C2PA
- OpenTimestamps

## Screenshots Needed
1. Homepage with clear value prop
2. Proof creation flow (paste URL → get proof)
3. Proof card example (shareable image)
4. Verification page
5. OTS download showing Bitcoin anchoring

## Launch Checklist
- [ ] Update landing page with PH badge
- [ ] Prepare all screenshots
- [ ] Draft Twitter announcement thread
- [ ] Email existing users about launch
- [ ] Schedule launch for Tuesday 12:01 AM PT (best day)
- [ ] Prepare responses to common questions
- [ ] Have maker online for first 4 hours

## Anticipated Questions

**Q: How is this different from just taking a screenshot?**
A: Screenshots can be edited, TruWit proofs are cryptographically signed and anchored to Bitcoin. You can't fake a Bitcoin block timestamp.

**Q: Do I need a crypto wallet?**
A: No! TruWit handles all the blockchain stuff. You just paste a URL.

**Q: Is it really free?**
A: Yes. OpenTimestamps batches thousands of timestamps into single Bitcoin transactions, so there are no per-proof fees.

**Q: Will this hold up in court?**
A: TruWit proofs provide strong evidence of prior existence. Combined with RFC 3161 timestamps (coming soon), they're admissible as digital evidence in most jurisdictions. Consult a lawyer for specific legal advice.

**Q: What about privacy?**
A: We hash your content - we never store the actual content itself. The hash proves you had the content, without revealing what it is.
