# Contributing to Prism

Welcome. If you're here, you believe ordinary people deserve better civic intelligence. So do we.

Prism is free, open-source, and owned by no one. Every contribution — code, data, a node, a translation, a correction — makes it better for everyone.

---

## Ways to Contribute

### 🔵 Run a Light Node (any computer)
The easiest way to contribute. Run a verifier or archive node on your machine.

```bash
docker run -d prismcivic/node:latest --role=verifier --country=GB
```
*(Node software coming soon — watch this repo for releases)*

No technical knowledge required beyond running Docker. Your machine joins the network while you sleep.

### 🟡 Start a Country Chapter
Own the civic intelligence layer for your country. This is the most impactful contribution.

Requirements:
- You live in the country (local knowledge is the point)
- You can run a small VPS (~€10–20/month) or have access to a server
- You're willing to maintain a source registry for your country

To apply: open an issue with the title `[Country Chapter] Your Country Name` and tell us about yourself and your country. We'll help you get set up.

### 🛠 Build
Check the [open issues](https://github.com/Prism-civic/prism/issues) for tasks tagged `good first issue` or `help wanted`.

Before starting work on something significant, open an issue or comment on an existing one so we can avoid duplication.

**Tech stack:**
- Node software: Rust or Go (TBD)
- Country mind API: Python (FastAPI) or Node.js
- Phone app: React Native
- Website: Next.js + Three.js

### 📚 Improve the Docs
Found something unclear? A typo? A missing explanation? Fix it and open a PR. Documentation contributions are just as valuable as code.

### 🌍 Translate
Help make Prism accessible in your language. Start by translating the README or the Humanitarian Charter — open a PR with the translated file.

### 🐛 Report Issues
Found a bug, a bad data source, or a scoring result that seems wrong? Open an issue. Be specific — what did you expect, what did you see?

---

## Ground Rules

1. **Read the Humanitarian Charter first.** It is the floor beneath this project. Contributions that violate it will not be accepted.

2. **Be honest.** If you're not sure something is right, say so. Uncertainty is a feature here, not a weakness.

3. **No hidden agendas.** Prism is politically neutral. Contributions that attempt to tilt the system toward any party, ideology, or interest will be rejected.

4. **Credit goes to contributors.** Your work will be acknowledged. The project grows through trust — that includes trusting contributors.

5. **Ask before big changes.** Open an issue to discuss significant architectural decisions before writing code. It saves everyone time.

---

## Pull Request Process

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write a clear commit message explaining what and why
5. Open a PR — describe what you changed and why

PRs are reviewed by the core team. We aim to respond within 7 days.

---

## Code of Conduct

Treat everyone with respect. This project is about civic trust — that starts here.

Harassment, abuse, or coordinated bad-faith participation will result in removal. No warnings for serious violations.

---

## Questions?

Open an issue or start a discussion. We read everything.

---

*Prism grows by word of mouth and community contribution. Thank you for being here.*
