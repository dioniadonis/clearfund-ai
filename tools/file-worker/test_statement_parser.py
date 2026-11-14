import unittest

from statement_parser import name_match, parse_statement

CHASE = """JPMorgan Chase Bank
September 1, 2026 through September 30, 2026
PEACHTREE PLUMBING LLC
CHECKING SUMMARY
Beginning Balance $4,210.33
Deposits and Additions 23,456.78
Electronic Withdrawals -19,100.00
Ending Balance $8,567.11
09/14 Returned Item Fee 34.00
"""

BOA = """Bank of America
Your Business Fundamentals Checking for Aug 01, 2026 to Aug 31, 2026
ACME TRUCKING INC
Account summary
Beginning balance on August 1, 2026 $1,000.00
Deposits and other credits 12,000.50
Withdrawals and other debits -13,500.00
Ending balance on August 31, 2026 ($499.50)
# of deposits/credits: 14
"""

GENERIC = """Statement Period: 10/01/26 - 10/31/26
Total Deposits $ 9,850.00
Total Withdrawals $ 9,000.00
Ending Balance 850.00
NSF fee charged
"""


class ParserTest(unittest.TestCase):
    def test_chase(self):
        r = parse_statement(CHASE)
        self.assertEqual(r["month"], "2026-09")
        self.assertEqual(r["deposits"], 23456.78)
        self.assertEqual(r["nsf"], 1)
        self.assertFalse(r["negative_end"])

    def test_boa(self):
        r = parse_statement(BOA)
        self.assertEqual(r["month"], "2026-08")
        self.assertEqual(r["deposits"], 12000.50)
        self.assertTrue(r["negative_end"])

    def test_generic(self):
        r = parse_statement(GENERIC)
        self.assertEqual(r, {"month": "2026-10", "deposits": 9850.0, "nsf": 1, "negative_end": False})

    def test_unreadable(self):
        self.assertIsNone(parse_statement("scanned image with no text"))

    def test_name_match(self):
        self.assertTrue(name_match(CHASE, "Peachtree Plumbing, LLC"))
        self.assertFalse(name_match(CHASE, "Acme Trucking Inc"))
        self.assertIsNone(name_match(CHASE, None))

    def test_only_summary_fields(self):
        self.assertEqual(set(parse_statement(CHASE)), {"month", "deposits", "nsf", "negative_end"})


if __name__ == "__main__":
    unittest.main()
