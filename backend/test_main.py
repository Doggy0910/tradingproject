import unittest

from backend.main import Token, number, select_best_pairs


def make_token(address: str, pair_address: str, liquidity: float | None, volume: float | None) -> Token:
    return Token(
        address=address,
        pairAddress=pair_address,
        name="Token",
        symbol="T",
        dexId="test-dex",
        url="https://example.test",
        imageUrl=None,
        pairCreatedAt=None,
        priceUsd=1,
        marketCap=100,
        liquidityUsd=liquidity,
        volume24h=volume,
        volumeChange24h=None,
        priceChange24h=None,
        txns24h=None,
    )


class MarketDataTests(unittest.TestCase):
    def test_selects_highest_liquidity_pair_per_token(self):
        pairs = [
            make_token("mint-a", "pair-low", 10_000, 50_000),
            make_token("mint-b", "pair-b", None, 100),
            make_token("mint-a", "pair-high", 25_000, 1_000),
        ]

        selected = select_best_pairs(pairs)

        self.assertEqual([(token.address, token.pairAddress) for token in selected], [
            ("mint-a", "pair-high"),
            ("mint-b", "pair-b"),
        ])

    def test_uses_volume_to_break_equal_liquidity_ties(self):
        pairs = [
            make_token("mint-a", "pair-low-volume", 10_000, 1_000),
            make_token("mint-a", "pair-high-volume", 10_000, 2_000),
        ]

        self.assertEqual(select_best_pairs(pairs)[0].pairAddress, "pair-high-volume")

    def test_rejects_non_finite_provider_numbers(self):
        self.assertIsNone(number("NaN"))
        self.assertIsNone(number("Infinity"))
        self.assertEqual(number("12.5"), 12.5)


if __name__ == "__main__":
    unittest.main()
