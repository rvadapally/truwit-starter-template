# OpenTimestamps: How Bitcoin Timestamps Your Content for Free

*A technical explainer for the curious*

---

## The Problem

You need to prove you created something at a specific time. Traditionally, this meant:
- Paying a notary
- Mailing yourself a sealed envelope
- Registering with a government office
- Trusting a company to maintain records

All of these require trusting someone else and usually cost money.

## The Bitcoin Solution

Bitcoin's blockchain is the most secure, immutable ledger in existence. Every 10 minutes, a new block is added containing a cryptographic hash of all transactions. This hash depends on the previous block, creating an unbreakable chain going back to 2009.

**Key insight:** If you can get your data's fingerprint into a Bitcoin block, you have permanent, verifiable proof that data existed at that time.

## The Cost Problem

Writing directly to Bitcoin costs money (transaction fees). At $1-50 per transaction, timestamping every photo or document becomes impractical.

## OpenTimestamps: The Clever Solution

[OpenTimestamps](https://opentimestamps.org) (OTS) solves this through **Merkle trees**:

1. Thousands of timestamps are collected
2. They're combined into a Merkle tree (a binary tree of hashes)
3. Only the tree's root hash goes into a Bitcoin transaction
4. Each original timestamp gets a "proof path" showing how it connects to the root

**Result:** One Bitcoin transaction timestamps thousands of documents. The cost is shared, making individual timestamps essentially free.

## How It Works (Step by Step)

### Timestamping:
```
Your file → SHA256 hash → Submit to OTS calendar servers → 
Wait for Bitcoin block → Receive .ots proof file
```

### Verifying:
```
Your file + .ots proof → Recalculate hash → 
Follow Merkle path → Compare to Bitcoin block → 
Verified timestamp
```

## The .ots Proof File

The proof file contains:
- Your file's original hash
- The Merkle path (series of hashes to combine)
- The Bitcoin transaction ID and block height
- Instructions for verification

Anyone with the original file and the .ots proof can verify the timestamp. No account needed. No trust required.

## Calendar Servers

OTS uses calendar servers that:
- Collect pending timestamps
- Build Merkle trees
- Submit to Bitcoin
- Return completed proofs

Public calendars include:
- alice.btc.calendar.opentimestamps.org
- bob.btc.calendar.opentimestamps.org
- finney.calendar.eternitywall.com

You can also run your own.

## Timeline

- **Immediate:** You get a pending proof (not yet in Bitcoin)
- **~10 minutes:** Proof is included in a Bitcoin block
- **~1 hour:** 6 confirmations (considered permanent)

## Verification Tools

- **Command line:** `ots verify document.ots`
- **Web:** opentimestamps.org has an online verifier
- **Libraries:** Available in Python, JavaScript, Go, etc.

## Security Properties

- **Immutable:** Can't change timestamps after the fact
- **Decentralized:** No single company controls it
- **Permanent:** Lasts as long as Bitcoin exists
- **Verifiable:** Anyone can check, no account needed
- **Private:** Only the hash is public, not your content

## Use Cases

- **Creators:** Prove when you made something
- **Journalists:** Verify when evidence was captured
- **Legal:** Establish document existence dates
- **Research:** Timestamp findings before publication
- **Code:** Prove when commits were made

## Limitations

- **Not instant:** Takes ~10 minutes for Bitcoin confirmation
- **Proves existence, not creation:** Timestamp shows you HAD the file, not that you MADE it
- **Requires keeping the original:** The proof is useless without the exact original file

## Why Bitcoin?

- 15+ years of unbroken operation
- $1+ trillion network value
- Most distributed and decentralized
- Highest attack resistance
- Most tooling and verification support

## Getting Started

Several services make OTS accessible:
- opentimestamps.org (command line + web)
- Various apps and integrations
- DIY with the open source tools

The key is finding a workflow that fits your needs—ideally one where timestamping becomes automatic.

---

*OpenTimestamps is open source and free. This explainer is intended to help more people understand and use this powerful technology.*
