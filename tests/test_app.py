from pathlib import Path
import sys
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import MAX_WORDS, analyze_word, normalize_requested_words


class MorphologyTests(unittest.TestCase):
    def test_verb_forms_share_key(self) -> None:
        self.assertEqual(analyze_word("бежит")["key"], analyze_word("бежать")["key"])

    def test_adjective_forms_share_key(self) -> None:
        self.assertEqual(
            analyze_word("психологические")["key"],
            analyze_word("психологический")["key"],
        )

    def test_participle_and_gerund_share_verb_key(self) -> None:
        verb_key = analyze_word("делать")["key"]
        self.assertEqual(analyze_word("делающий")["key"], verb_key)
        self.assertEqual(analyze_word("делая")["key"], verb_key)

    def test_comparative_shares_adjective_key(self) -> None:
        self.assertEqual(analyze_word("красивее")["key"], analyze_word("красивый")["key"])

    def test_ambiguous_part_of_speech_stays_exact(self) -> None:
        analysis = analyze_word("печь")
        self.assertTrue(analysis["ambiguous"])
        self.assertEqual(analysis["key"], "word:печь")

    def test_different_parts_of_speech_do_not_share_key(self) -> None:
        self.assertNotEqual(analyze_word("автомат")["key"], analyze_word("автоматизировать")["key"])

    def test_invalid_token_stays_exact(self) -> None:
        self.assertEqual(analyze_word("слово!")["key"], "word:слово!")

    def test_request_words_are_normalized(self) -> None:
        self.assertEqual(normalize_requested_words(["Слово ", "слово"]), {"слово"})

    def test_request_rejects_non_string_values(self) -> None:
        for invalid in ([123], [True], [{"word": "слово"}], [None]):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                normalize_requested_words(invalid)

    def test_request_rejects_too_many_words(self) -> None:
        with self.assertRaises(ValueError):
            normalize_requested_words(["слово"] * (MAX_WORDS + 1))


if __name__ == "__main__":
    unittest.main()
