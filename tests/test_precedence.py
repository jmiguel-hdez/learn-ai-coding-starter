from sloperator.runner import run_source


def test_multiplication_happens_before_addition():
    result = run_source("hallucinate(2 + 5 * 3)✨")
    assert result.stderr == "", result.stderr
    assert result.stdout == "17\n"
