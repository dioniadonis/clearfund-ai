# ClearFund file worker (runs on the Mac mini)

Every 10 minutes it:

1. Emails the application and a private upload link to owners a VA marked **Qualified** (from mark@myclearfund.com through Zoho SMTP).
2. Sends reminders on day 1, 3 and 7 until statements arrive. After that the owner goes back on the VA's call list.
3. Downloads uploaded bank statements, reads them **on this Mac** (`pdftotext`, then OCR with `tesseract` for scans, then an optional local Ollama model), sends back summary figures only (month, total deposits, NSF count, negative ending balance) and deletes the copies.

The CRM then runs the eligible-file check (rule based) and marks the file **File ready** for Dioni, with the VA pay tier ($25 at $10k+ average monthly deposits, $20 below).

Nothing from statements is printed, logged or stored besides those figures. The database rejects any other field.

## One-time setup (for the Mac Claude session; never hand Dioni Terminal commands)

1. `brew install poppler tesseract` (Ollama is optional).
2. Create `~/clearfund/` and `~/clearfund/logs/`, copy `file-worker.env.example` to `~/clearfund/file-worker.env`, `chmod 600` it.
3. Worker login: generate a long random password on this Mac, sign up the worker email through `POST {SUPABASE_URL}/auth/v1/signup` with the anon key, and put both in the env file. Send the cloud session the worker **email only**. It adds the account to `file_workers` (the only account allowed to run the `fw_*` functions or read the `va-documents` bucket).
4. Zoho: Dioni creates an app password in Zoho Mail (My Account, Security, App Passwords) and pastes it into `ZOHO_APP_PASSWORD` in the env file himself. Open the file for him in TextEdit. Do not read it back or log it.
5. Run `python3 -m unittest` in this folder, then one manual `python3 worker.py`, then install the launchd job from `com.clearfund.file-worker.plist` (replace `__REPO__` and `__HOME__`).

## Limits

- `CF_DAILY_EMAIL_CAP` (default 20) keeps volume low on the new domain.
- Uploaded files expire after 60 days, and 7 days after a file is marked Submitted.
