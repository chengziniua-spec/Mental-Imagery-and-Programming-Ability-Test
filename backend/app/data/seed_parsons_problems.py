# Parsons-problem style code-construction tasks (Parsons & Haden, 2006).
# Each problem gives a plain-language requirement plus a shuffled bag of code
# blocks -- some of which are distractors that must NOT be used -- and asks
# the participant to assemble the correct ordered subset. Distinct construct
# from the execution-tracing tasks: this measures requirement-to-logic
# construction, not "simulate what this code does".

SEED_PARSONS_PROBLEMS = [
    {
        "id": "parsons_sum",
        "title": "Sum a list",
        "difficulty": "easy",
        "requirement": "Compute the sum of all numbers in nums and store it in total.",
        "blocks": [
            {"id": "b1", "code": "total = 0"},
            {"id": "b2", "code": "for n in nums:"},
            {"id": "b3", "code": "    total += n"},
            {"id": "d1", "code": "total = 1"},
            {"id": "d2", "code": "    total = n"},
        ],
        "correct_order": ["b1", "b2", "b3"],
    },
    {
        "id": "parsons_max",
        "title": "Find the maximum",
        "difficulty": "medium",
        "requirement": "Find the largest number in nums and store it in biggest.",
        "blocks": [
            {"id": "b1", "code": "biggest = nums[0]"},
            {"id": "b2", "code": "for n in nums:"},
            {"id": "b3", "code": "    if n > biggest:"},
            {"id": "b4", "code": "        biggest = n"},
            {"id": "d1", "code": "biggest = 0"},
            {"id": "d2", "code": "    if n < biggest:"},
        ],
        "correct_order": ["b1", "b2", "b3", "b4"],
    },
    {
        "id": "parsons_count",
        "title": "Count occurrences",
        "difficulty": "medium",
        "requirement": "Count how many times target appears in items and store the result in count.",
        "blocks": [
            {"id": "b1", "code": "count = 0"},
            {"id": "b2", "code": "for item in items:"},
            {"id": "b3", "code": "    if item == target:"},
            {"id": "b4", "code": "        count += 1"},
            {"id": "d1", "code": "count = 1"},
            {"id": "d2", "code": "    if item != target:"},
            {"id": "d3", "code": "        count -= 1"},
        ],
        "correct_order": ["b1", "b2", "b3", "b4"],
    },
    {
        "id": "parsons_reverse",
        "title": "Reverse a string",
        "difficulty": "hard",
        "requirement": "Build the reverse of string s into result, one character at a time from the end.",
        "blocks": [
            {"id": "b1", "code": 'result = ""'},
            {"id": "b2", "code": "for i in range(len(s) - 1, -1, -1):"},
            {"id": "b3", "code": "    result += s[i]"},
            {"id": "d1", "code": "result = []"},
            {"id": "d2", "code": "for i in range(len(s)):"},
        ],
        "correct_order": ["b1", "b2", "b3"],
    },
    {
        "id": "parsons_filter",
        "title": "Filter positive numbers",
        "difficulty": "medium",
        "requirement": "Build a list positives containing only the positive numbers from nums.",
        "blocks": [
            {"id": "b1", "code": "positives = []"},
            {"id": "b2", "code": "for n in nums:"},
            {"id": "b3", "code": "    if n > 0:"},
            {"id": "b4", "code": "        positives.append(n)"},
            {"id": "d1", "code": "positives = {}"},
            {"id": "d2", "code": "    if n >= 0:"},
            {"id": "d3", "code": "        positives.add(n)"},
        ],
        "correct_order": ["b1", "b2", "b3", "b4"],
    },
]
