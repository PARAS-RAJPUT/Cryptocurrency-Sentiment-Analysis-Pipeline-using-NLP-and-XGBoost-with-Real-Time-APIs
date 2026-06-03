"""
preprocess.py
Text cleaning pipeline: URLs → mentions → slang → punctuation → tokenise → stopwords → lemmatise
"""

import re
import nltk
from nltk.corpus   import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem     import WordNetLemmatizer

def _dl():
    for p in ["punkt", "punkt_tab", "stopwords", "wordnet", "omw-1.4"]:
        nltk.download(p, quiet=True)

_dl()

CRYPTO_KEEP = {
    "bitcoin","btc","ethereum","eth","crypto","blockchain","defi","nft","solana","sol",
    "cardano","ada","xrp","ripple","dogecoin","doge","altcoin","hodl","bull","bear",
    "moon","rekt","fud","fomo","whale","pump","dump","rug","dex","cex","dao","web3",
    "staking","mining","halving","wallet","exchange","token","coin","market",
}

SLANG = {
    "hodl":"hold","rekt":"wrecked","fud":"fear uncertainty doubt",
    "fomo":"fear of missing out","ath":"all time high","atl":"all time low",
    "dyor":"do your research","ngmi":"not going to make it",
    "wagmi":"we are all going to make it","safu":"safe","lfg":"lets go",
}

_STOP = set(stopwords.words("english")) - CRYPTO_KEEP
_LEM  = WordNetLemmatizer()


def clean_text(text: str) -> str:
    text = str(text) if text else ""
    # URLs
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    # mentions / hashtag symbols (keep word)
    text = re.sub(r"[@#](\w+)", r"\1", text)
    # lower + slang
    text = text.lower()
    text = " ".join(SLANG.get(w, w) for w in text.split())
    # ticker symbols $BTC → btc
    text = re.sub(r"\$(\w+)", r"\1", text)
    # punctuation / special chars
    text = re.sub(r"[^\w\s]", " ", text)
    # tokenise
    try:
        tokens = word_tokenize(text)
    except Exception:
        tokens = text.split()
    # stopwords + length filter
    tokens = [t for t in tokens if t not in _STOP and len(t) > 1]
    # lemmatise
    tokens = [_LEM.lemmatize(t) for t in tokens]
    return " ".join(tokens)


def clean_batch(texts) -> list:
    return [clean_text(t) for t in texts]


if __name__ == "__main__":
    samples = [
        "$BTC to the moon!! #Bitcoin #HODL best investment ever",
        "Crypto exchange REKT after hack. FUD spreading fast http://t.co/xyz",
        "Just another boring day in crypto. Nothing happening.",
    ]
    for s in samples:
        print(f"IN : {s}\nOUT: {clean_text(s)}\n")
