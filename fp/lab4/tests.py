from expenses import ExpensesCollection, Expense
from history import History

def run_tests():
    expenses = History(ExpensesCollection)

    # Test addition
    added_expense = expenses.do('add_one', 1, 1, 100)
    assert added_expense.get_day() == 1
    assert added_expense.get_type() == 1
    assert added_expense.get_sum() == 100

    added_expense = expenses.do('add_one', 2, 2, 1000)
    assert added_expense.get_day() == 2
    assert added_expense.get_type() == 2
    assert added_expense.get_sum() == 1000

    # Test update
    updated_expense = expenses.do('update_one', 1, 1, 500)
    assert updated_expense.get_sum() == 500

    # Test deletion for day
    expenses.do('delete', 1)
    collection = expenses.do('get')
    assert len(collection) == 1
    left_expense = collection[0]
    assert left_expense.get_day() == 2
    assert left_expense.get_type() == 2
    assert left_expense.get_sum() == 1000

    # Test deletion for interval
    added_expense = expenses.do('add_one', 1, 1, 100)
    assert added_expense.get_day() == 1
    assert added_expense.get_type() == 1
    assert added_expense.get_sum() == 100

    added_expense = expenses.do('add_one', 3, 1, 100)
    assert added_expense.get_day() == 3
    assert added_expense.get_type() == 1
    assert added_expense.get_sum() == 100

    expenses.do('delete', min_day=1, max_day=2)
    collection = expenses.do('get')
    assert len(collection) == 1
    left_expense = collection[0]
    assert left_expense.get_day() == 3
    assert left_expense.get_type() == 1
    assert left_expense.get_sum() == 100

    serialization = expenses.do('serialize')
    print(serialization)

run_tests()
print('Tests passed.')