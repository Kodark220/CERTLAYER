# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class MinimalTest(gl.Contract):
    greeting: str

    def __init__(self):
        self.greeting = "hello bradbury"

    @gl.public.view
    def get_greeting(self) -> str:
        return self.greeting
