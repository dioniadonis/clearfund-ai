import hashlib
import re
import unittest

import worker


class WorkerTest(unittest.TestCase):
    def test_link_and_hash(self):
        link, token_hash = worker.new_link({"CF_APP_URL": "https://clearfundai.com/"})
        token = link.split("token=")[1]
        self.assertTrue(link.startswith("https://clearfundai.com/merchant-resume?token="))
        self.assertRegex(token, r"^[a-f0-9]{48}$")
        self.assertEqual(token_hash, hashlib.sha256(token.encode()).hexdigest())

    def test_email_copy_rules(self):
        job = {"business_name": "Acme Trucking", "owner_name": "Ann Rivera", "reminder_number": 3}
        for subject, body in (worker.app_email(job, "LINK", "Mark"), worker.reminder_email(job, "LINK", "Mark")):
            text = (subject + body).lower()
            self.assertIn("hi ann,", text)
            self.assertIn("link", text)
            self.assertIn("atlanta", text)
            for banned in ("rate", "approved", "guarantee", "24 hours", "same day", "factor", "text me"):
                self.assertNotIn(banned, text)
            self.assertIsNone(re.search(r"\d+%", text))

    def test_first_name_fallback(self):
        self.assertEqual(worker.first_name(None), "there")
        self.assertEqual(worker.first_name("  "), "there")


if __name__ == "__main__":
    unittest.main()
