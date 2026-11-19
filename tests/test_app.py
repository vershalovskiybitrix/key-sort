from pathlib import Path
import sys
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import analyze_word


class MorphologyTests(unittest.TestCase):
    def test_verb_forms_share_key(self) -> None:
        self.assertEqual(analyze_word("бежит")["key"], analyze_word("бежать")["key"])

    def test_adjective_forms_share_key(self) -> None:
        self.assertEqual(
            analyze_word("психологические")["key"],
            analyze_word("психологический")["key"],
        )

    def test_different_parts_of_speech_do_not_share_key(self) -> None:
        self.assertNotEqual(analyze_word("автомат")["key"], analyze_word("автоматизировать")["key"])

    def test_invalid_token_stays_exact(self) -> None:
        self.assertEqual(analyze_word("слово!")["key"], "word:слово!")


if __name__ == "__main__":
    unittest.main()
