SEED_TASKS = [
    {
        "id": "var_swap_01",
        "title": "Variable Swap",
        "task_type": "variable",
        "difficulty": "easy",
        "code": (
            "a = 3\n"
            "b = 7\n"
            "a = a + b\n"
            "b = a - b\n"
            "a = a - b\n"
        ),
        "glossary": [],
        "trace_steps": [
            {
                "line": 3, "prompt": "What is a after this line?",
                "fields": [{"name": "a", "type": "number"}], "expected": {"a": 10},
            },
            {
                "line": 4, "prompt": "What is b after this line?",
                "fields": [{"name": "b", "type": "number"}], "expected": {"b": 3},
            },
            {
                "line": 5, "prompt": "What is a after this line?",
                "fields": [{"name": "a", "type": "number"}], "expected": {"a": 7},
            },
        ],
    },
    {
        "id": "loop_sum_01",
        "title": "Running Total",
        "task_type": "loop",
        "difficulty": "easy",
        "code": (
            "total = 0\n"
            "for i in range(1, 5):\n"
            "    total += i\n"
        ),
        "glossary": [
            {"term": "range(a, b)", "explanation": "Generates the integers from a up to, but not including, b."},
            {"term": "total += i", "explanation": "Shorthand for total = total + i."},
        ],
        "trace_steps": [
            {
                "line": 3, "iteration_label": "i=1", "prompt": "What is total after this iteration?",
                "fields": [{"name": "total", "type": "number"}], "expected": {"total": 1},
            },
            {
                "line": 3, "iteration_label": "i=2", "prompt": "What is total after this iteration?",
                "fields": [{"name": "total", "type": "number"}], "expected": {"total": 3},
            },
            {
                "line": 3, "iteration_label": "i=3", "prompt": "What is total after this iteration?",
                "fields": [{"name": "total", "type": "number"}], "expected": {"total": 6},
            },
            {
                "line": 3, "iteration_label": "i=4", "prompt": "What is total after this iteration?",
                "fields": [{"name": "total", "type": "number"}], "expected": {"total": 10},
            },
        ],
    },
    {
        "id": "cond_grade_01",
        "title": "Grade Branch",
        "task_type": "conditional",
        "difficulty": "medium",
        "code": (
            "score = 72\n"
            "if score >= 90:\n"
            "    grade = 'A'\n"
            "elif score >= 75:\n"
            "    grade = 'B'\n"
            "elif score >= 60:\n"
            "    grade = 'C'\n"
            "else:\n"
            "    grade = 'D'\n"
        ),
        "glossary": [],
        "trace_steps": [
            {
                "line": 9, "prompt": "Which branch runs, and what is the final value of grade?",
                "fields": [{"name": "grade", "type": "choice"}], "options": ["A", "B", "C", "D"],
                "expected": {"grade": "C"},
            },
        ],
    },
    {
        "id": "func_fib_01",
        "title": "Recursive Call",
        "task_type": "function",
        "difficulty": "hard",
        "code": (
            "def fib(n):\n"
            "    if n <= 1:\n"
            "        return n\n"
            "    return fib(n - 1) + fib(n - 2)\n"
            "\n"
            "result = fib(5)\n"
        ),
        "glossary": [
            {"term": "return", "explanation": "Ends the function call and sends a value back to whoever called it."},
            {"term": "recursion", "explanation": "fib(n) calls fib(...) again inside its own body, until n <= 1 stops it."},
        ],
        "trace_steps": [
            {
                "line": 6, "prompt": "What is the final value of result?",
                "fields": [{"name": "result", "type": "number"}], "expected": {"result": 5},
            },
        ],
    },
    {
        "id": "state_stack_01",
        "title": "List State Changes",
        "task_type": "state",
        "difficulty": "medium",
        "code": (
            "stack = []\n"
            "stack.append(1)\n"
            "stack.append(2)\n"
            "stack.append(3)\n"
            "stack.pop()\n"
            "stack.append(4)\n"
        ),
        "glossary": [
            {"term": "list.append(x)", "explanation": "Adds x to the end of the list."},
            {"term": "list.pop()", "explanation": "Removes and returns the last item of the list."},
        ],
        "trace_steps": [
            {
                "line": 2, "prompt": "What is stack after this line? (comma-separated)",
                "fields": [{"name": "stack", "type": "number_list"}], "expected": {"stack": [1]},
            },
            {
                "line": 3, "prompt": "What is stack after this line? (comma-separated)",
                "fields": [{"name": "stack", "type": "number_list"}], "expected": {"stack": [1, 2]},
            },
            {
                "line": 4, "prompt": "What is stack after this line? (comma-separated)",
                "fields": [{"name": "stack", "type": "number_list"}], "expected": {"stack": [1, 2, 3]},
            },
            {
                "line": 5, "prompt": "What is stack after this line? (comma-separated)",
                "fields": [{"name": "stack", "type": "number_list"}], "expected": {"stack": [1, 2]},
            },
            {
                "line": 6, "prompt": "What is stack after this line? (comma-separated)",
                "fields": [{"name": "stack", "type": "number_list"}], "expected": {"stack": [1, 2, 4]},
            },
        ],
    },
    {
        "id": "loop_nested_01",
        "title": "Nested Loop Counter",
        "task_type": "loop",
        "difficulty": "hard",
        "code": (
            "count = 0\n"
            "for i in range(3):\n"
            "    for j in range(2):\n"
            "        if (i + j) % 2 == 0:\n"
            "            count += 1\n"
        ),
        "glossary": [
            {"term": "range(n)", "explanation": "Generates the integers from 0 up to, but not including, n."},
            {"term": "a % b", "explanation": "Remainder of a divided by b (modulo)."},
        ],
        "trace_steps": [
            {
                "line": 4, "iteration_label": "i=0, j=0", "prompt": "What is count after this iteration?",
                "fields": [{"name": "count", "type": "number"}], "expected": {"count": 1},
            },
            {
                "line": 4, "iteration_label": "i=0, j=1", "prompt": "What is count after this iteration?",
                "fields": [{"name": "count", "type": "number"}], "expected": {"count": 1},
            },
            {
                "line": 4, "iteration_label": "i=1, j=0", "prompt": "What is count after this iteration?",
                "fields": [{"name": "count", "type": "number"}], "expected": {"count": 1},
            },
            {
                "line": 4, "iteration_label": "i=1, j=1", "prompt": "What is count after this iteration?",
                "fields": [{"name": "count", "type": "number"}], "expected": {"count": 2},
            },
            {
                "line": 4, "iteration_label": "i=2, j=0", "prompt": "What is count after this iteration?",
                "fields": [{"name": "count", "type": "number"}], "expected": {"count": 3},
            },
            {
                "line": 4, "iteration_label": "i=2, j=1", "prompt": "What is count after this iteration?",
                "fields": [{"name": "count", "type": "number"}], "expected": {"count": 3},
            },
        ],
    },
]
