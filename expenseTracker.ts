import { Command } from 'commander';
import * as fs from 'fs-extra';
const csv =  require('csv-parser');
import { stringify } from 'csv-stringify';
import path from 'path';

function getMonthName(monthNumber:number) {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    // Ensure the month number is valid (1-12)
    if (monthNumber < 1 || monthNumber > 12) {
        return "Invalid month number";
    }
    
    return monthNames[monthNumber-1];
}

enum ExpenseKeys {
    ID = 'id',
    DATE = 'date',
    DESCRIPTION = 'description',
    AMOUNT = 'amount',
    CATEGORY = 'category',

}


export interface Expense {
    id: number,
    date: string,
    description: string,
    amount: number,
    category: string,

}

const EXPENSES_FILE = path.join(__dirname,'expenses.csv');
const program = new Command();

export async function saveExpenses(expenses: Expense[],filePath:string){
    try{

        const dir = path.dirname(filePath);
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir, {recursive: true});
        }

        const output = fs.createWriteStream(filePath);
        const stringifier = stringify({
            header: true,
            columns: Object.values(ExpenseKeys),
        })
        expenses.forEach((exp) => stringifier.write(exp));
        stringifier.pipe(output);
   }
   catch (error){
    console.error("Error saving tasks: ", error);
   }
    

}

export function loadExpenses(filePath: string):Promise<Expense[]> {
    return new Promise((resolve, reject)=> {
        const expenses: Expense[] = []

        if(!fs.existsSync(filePath)){
            fs.writeFileSync(filePath,"");
        }
           fs.createReadStream(filePath)
             .pipe(csv())
             .on('data', (data:Expense) => {
                const exp:Expense = {
                    ...data,
                    id: Number(data.id),
                    amount: Number(data.amount)
                }
                expenses.push(exp)
              })
             .on('end', () => resolve(expenses))
             .on('error', reject);
    })
    }

export function addExpense(expenses:Expense[],description: string, amount: number, category?:string){
     const expense: Expense = {
        id: expenses.length+1,
        date: new Date().toISOString().split('T')[0], // yy-mm-dd
        description: description,
        amount: amount,
        category: category ||  'None',
     }

     expenses.push(expense);
     console.log(`Expense added successfully (ID: ${expense.id})`);
}

export function updateExpense(expenses:Expense[], id: number, amount?: number, category?:string){

    const expense = expenses.find(exp => exp.id === id);
    if(!expense){
        console.error("Expense not found");
        return;
    }
    if(amount) expense.amount = amount;
    if(category) expense.category = category;
    console.log(`Expense updated successfully (ID: ${expense.id})`)

}

export function deleteExpense(expenses:Expense[], id:number):Expense[]{

    const orginLen = expenses.length;
    const updateExpense = expenses.filter(exp => exp.id !== id);
    if(updateExpense.length === orginLen){
            console.error("Expense not found");
            return expenses;
    }

    console.log('Expense deleted.');
    return updateExpense;

}

export function summary(expenses:Expense[], month?: number){
    const selectedYear = new Date().getFullYear();
    let filterExpenses = [...expenses];
    if(month){
        const selectedMonth = month;
        filterExpenses = filterExpenses.filter((exp) => {
            const expDate = new Date(exp.date);
            const year = expDate.getFullYear();
            const month = expDate.getMonth()+1;
            return year === selectedYear && month === selectedMonth;
        })
    }
    const total = filterExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    if(month){
       console.log(`Total expenses for ${getMonthName(month)}: $${total}`);
       return;
    }
    
    console.log(`Total expenses: $${total}`);

}


export function listExpenses(expenses:Expense[], category?:string){
        const filterExpenses = category?
        expenses.filter(exp => exp.category === category)
        : expenses;

        console.table(filterExpenses);

}
program.command('add')
       .description("add an expense")
       .requiredOption('--description <description>', 'Expense desription')       
       .requiredOption("--amount <amount>", "Expense amount", parseFloat)
       .option("--category <category>", "Expense category", "None")
       .action( async (options:{description: string, 
                        amount: number,
                        category?:string }) =>{

            let expenses = await loadExpenses(EXPENSES_FILE);
           addExpense(expenses,options.description,options.amount, options.category)
           saveExpenses(expenses, EXPENSES_FILE);

       });

// update expense
program.command('update')
       .description("update an expense") 
       .requiredOption('--id <id>', 'ID of the expense to update', parseInt)
       .option('--amount <amount>', 'Update amount', parseFloat)
       .option('--category <category>', 'Update category')
       .action( async (options:{
                id: number
                amount?:number,
                category?:string,
       })=> {

        let expenses = await loadExpenses(EXPENSES_FILE);
        updateExpense(expenses,options.id,options.amount,options.category);
        saveExpenses(expenses, EXPENSES_FILE);

       });

// delete expense
program
    .command('delete')
    .description("delete an expense")
    .requiredOption('--id <id>', 'ID of the expense to delete', parseInt )
    .action(async (options:{id:number}) => {

      const expenses = await loadExpenses(EXPENSES_FILE);
      const newExpenses = deleteExpense(expenses,options.id);
      saveExpenses(newExpenses, EXPENSES_FILE);

    });

 program.command('summary')      
        .description("view a summary of all expenses or of expenses for a specific month (of current year)")
        .option('--month <month>', 'a month of current year', parseInt)
        .action( async (options: {month?: number}) => {

            let expenses = await loadExpenses(EXPENSES_FILE);
            summary(expenses,options.month)
            saveExpenses(expenses, EXPENSES_FILE);
        });

// List expenses
program.command('list')
       .description("view all expenses")
       .option('--category <category>', 'Filter by category')
       .action(async (options: {category?:string}) => {
            let expenses = await loadExpenses(EXPENSES_FILE);
            listExpenses(expenses, options.category);
            saveExpenses(expenses, EXPENSES_FILE);
       })



program.parse(process.argv);

