var Table = require('cli-table');
var mysql = require("mysql");
var inquirer = require("inquirer");

var table = new Table({
        head: ['Department ID', 'Department Name', 'Overhead Costs', 'Product Sales', 'Total Profit']
 , colWidths: [13, 20, 20, 15, 15]
          });

var connection = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: 'root',
	password: 'password',
	database: 'Bamazon'
});

connection.connect(function(err){
	if(err) throw err;
//	console.log("connected as id " + connection.threadId);
});


var deptArr = [];
var balance = 0;
var inQuery = "SELECT * FROM departments";

// constructor for product object
function DepartmentObj(a, b, c, d, e) 
{   if (!(this instanceof DepartmentObj)) 
     {return new DepartmentObj(a, b, c, d)};
  this.department_id = a;
  this.department_name = b;
  this.over_head_costs = c;
  this.total_sales = d;
  this.total_profit = e;
}

//------  Desk Top Activities --------------
var deskTop = function() {
  inquirer.prompt({
    name: "menuoption",
    type: "rawlist",
    choices: ["Sales By Department", "Create Department"],
    message: " "
  }).then(function(answer) {
    switch (answer.menuoption.toUpperCase()) {
      case "SALES BY DEPARTMENT":
        productList();
        break;
      case "CREATE DEPARTMENT":
        addDept();
        break;
    }
  });
};   //------- Desk Top ends ---------------

// --- List of Products  ---
var productList = function() {
  
  inQuery = "SELECT department_id, department_name, over_head_costs," +
            " total_sales as product_sales," +
            " (total_sales - over_head_costs) as total_profit " +
            "From departments";


	connection.query(inQuery,
		function(err, res) {
		//	console.log(res);

    if (res === undefined) {
      console.log("Department List is empty");
       deskTop();
    } else 
    {

    deptArr.length = 0;
        table.length = 0;
      
			for (var i = 0; i < res.length; i++) {
     //   var profit = res[i].total_sales - res[i].over_head_costs;
				 eachDepartment = new DepartmentObj(
              					res[i].department_id,
              					res[i].department_name,
              					res[i].over_head_costs,
              					res[i].product_sales,
                        res[i].total_profit
              				  );
        
          deptArr.push(eachDepartment);

          var tArr = [];
        		tArr.push(res[i].department_id);
        		tArr.push(res[i].department_name);
        		tArr.push(res[i].over_head_costs);
        		tArr.push(res[i].product_sales);
            tArr.push(res[i].total_profit);
        	
          table.push(tArr);        	
      }

      console.log(table.toString());
        deskTop();
    }
    	        
  });
};  // List of Products ends  --

// ----  Add New Department  ---
var addDept = function() {
  inquirer.prompt([
   {name: "dname",
    type: "input",
    message: "Department Name",
    validate: function(value) {
        if (value === "" || value === " ") {return false;}
        return true;
       }
   }, 
   {name: "cost",
    type: "input",
    message: "Overhead Costs",
    validate: function(value) {
        if (isNaN(value) === false) {return true;}
        return false;
      }
    }
    ]).then(function(answer) {

    inQuery = "INSERT INTO departments SET ?";
    connection.query(inQuery,
      { 
        department_name: answer.dname,
        over_head_costs: parseFloat(answer.cost),
        total_sales: 0
      },
      function(err, res)
      {console.log(`${answer.dname} has been added to the database.`);
      deskTop(); 
    }); // insert ends  
  }); // prompt ends 
};  //  --- Add Department  ends ---

deskTop();