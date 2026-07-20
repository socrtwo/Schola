# Sample Data

All files in this directory are **fully synthetic**. Every name, address, email
address, and phone number was randomly generated — none corresponds to a real
person or place. Phone numbers use the reserved `555` prefix and email addresses
use the reserved `example.com`/`.net`/`.org` domains.

| File | Purpose |
|------|---------|
| `directory-sample.csv` | Example of a member/resident directory export |
| `transactions-sample.csv` | Example of a Square payment transactions export |
| `items-sample.csv` | Example of a Square item detail export |

These files exist so the import/parsing features of Schola can be developed and
tested without ever handling real personal data. Regenerate them at any time —
the schemas match the exports the application is designed to consume.
