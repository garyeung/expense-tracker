import { addExpense, updateExpense, deleteExpense, listExpenses, summary, Expense,} from './expenseTracker'; 

let expenses: Expense[] = [];

describe('Expense Management', () =>{
     test('Add an expense', () => {

        addExpense(expenses,'Test Expense', 100, 'Food');

        expect(expenses).toHaveLength(1);
        expect(expenses[0]).toEqual(expect.objectContaining<Expense>({
            id: 1,
            date: '2024-09-20',
            description: 'Test Expense',
            amount: 100,
            category: 'Food',
        }));
    });

    test("Update an expense", () => {
       addExpense(expenses,'Another Expense', 200, 'Transport');        

       const id = expenses[1].id;
       updateExpense(expenses,id, 250, 'Travel');

       expect(expenses[1]).toEqual(expect.objectContaining({
            amount: 250,
            category: 'Travel',
        }));        

    });

    test('Delete an expense', () => {
    const expenseId = expenses[0].id; // Get the ID of the first expense
    const newExpenses = deleteExpense(expenses,expenseId);
    expect(newExpenses).toHaveLength(1);
    expect(newExpenses.find(exp => exp.id === expenseId)).toBeUndefined();
});

    test('List all expenses',() => {
        addExpense(expenses, 'Test Expense 1', 100, 'Food');
        addExpense(expenses, 'Test Expense 2', 200, 'Transport');

        const consoleTableSpy = jest.spyOn(console, 'table');

        listExpenses(expenses);

        expect(consoleTableSpy).toHaveBeenCalled();

         expect(consoleTableSpy).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ description: 'Test Expense 1', amount: 100, category: 'Food' }),
        expect.objectContaining({ description: 'Test Expense 2', amount: 200, category: 'Transport' })
    ]));``

        listExpenses(expenses, 'Food');
        expect(consoleTableSpy).toHaveBeenCalledWith(expect.not.arrayContaining([
        expect.objectContaining({ description: 'Test Expense 2' })
    ]));


        consoleTableSpy.mockRestore();
    });

    test('Summary of expenses',() => {
    addExpense(expenses,'Test Expense 3', 300, 'Food');
    
    const consoleLogSpy = jest.spyOn(console, 'log');

    summary(expenses);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total expenses:'));

    summary(expenses,8);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total expenses for'));
    consoleLogSpy.mockRestore();
    });

})