from enum import Enum


class Color(str, Enum):
    black = "black"
    white = "white"


class Winner(str, Enum):
    black = "black"
    white = "white"
    draw = "draw"


class EndCondition(str, Enum):
    resignation = "resignation"
    time = "time"
    score = "score"


class Rules(str, Enum):
    chinese = "chinese"
    japanese = "japanese"
