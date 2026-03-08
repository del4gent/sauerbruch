from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class Section:
    title: str
    key: str
    items: List[any] = field(default_factory=list)
    is_table: bool = False

@dataclass
class Room:
    name: str
    path: str
    content: str = ""
    area: float = 0.0
    area_derivation: str = ""
    total_cost: float = 0.0
    sections: List[Section] = field(default_factory=list)
    status: str = "In Planung"
    images: dict = field(default_factory=lambda: {
        'plan': [],
        'ist': [],
        'inspiration': [],
        'material': []
    })
