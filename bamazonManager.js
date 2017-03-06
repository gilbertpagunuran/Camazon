var Table = require('cli-table');
var mysql = require("mysql");
var inquirer = require("inquirer");

var table = new Table({
        head: ['Item #', 'Product', 'Department', 'Unit Price', 'Stock']
 , colWidths: [8, 30, 25, 15, 10]
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


var productArr = [];
var balance = 0;
var inQuery = "SELECT * FROM products";

// constructor for product object
function ProductObj(a, b, c, d, e, f) 
{   if (!(this instanceof ProductObj)) 
     {return new ProductObj(a, b, c, d, e, f)};
  this.item_id = a;
  this.product_name = b;
  this.department_name = c;
  this.price = d;
  this.stock_quantity = e;
  this.product_sales = f;
}

//------  Desk Top Activities --------------
var deskTop = function() {
  inquirer.prompt({
    name: "menuoption",
    type: "rawlist",
    choices: ["Product List", "Low Inventory", "Add Inventory", "Add Product"],
    message: " "
  }).then(function(answer) {
    switch (answer.menuoption.toUpperCase()) {
      case "PRODUCT LIST":
        inQuery = "SELECT * FROM products";
        productList();
        break;
      case "LOW INVENTORY":
        inQuery = "SELECT * FROM products Where stock_quantity < 5";
        productList();
        break;
      case "ADD INVENTORY":
        addInventory();
        break;
      case "ADD PRODUCT":
        addProduct();
        break;
    }
  });
};   //------- Desk Top ends ---------------

// --- List of Products  ---
var productList = function() {
  
	connection.query(inQuery,
		function(err, res) {
		//	console.log(res);
    productArr.length = 0;
        table.length = 0;
      
			for (var i = 0; i < res.length; i++) {
				 eachProduct = new ProductObj(
              					res[i].item_id,
              					res[i].product_name,
              					res[i].department_name,
              					res[i].price,
              					res[i].stock_quantity,
              					res[i].product_sales
              				  );
        
          productArr.push(eachProduct);

          var tArr = [];
        		tArr.push(res[i].item_id);
        		tArr.push(res[i].product_name);
        		tArr.push(res[i].department_name);
        		tArr.push(res[i].price);
        		tArr.push(res[i].stock_quantity);
        	
          table.push(tArr);        	
      }

    if (productArr.length == 0) {
      console.log("Product List is empty");
       deskTop();
    } else {
      console.log(table.toString());
        deskTop();
    }
    	        
  });
};  // List of Products ends  --

// ----  Add Inventory  ---
var addInventory = function() {
  inquirer.prompt([
   {name: "item",
    type: "input",
    message: "What is the item# to restock?",
    validate: function(value) {
        if (isNaN(value) === false) {return true;}
        return false;
       }
   }, 
   {name: "unit",
    type: "input",
    message: "Unit quantity to be added?",
    validate: function(value) {
        if (isNaN(value) === false) {return true;}
        return false;
      }
    }
    ]).then(function(answer) {

    inQuery = "SELECT * FROM products Where item_id =" + answer.item;
    connection.query(inQuery, function(err, res) 
    {
        if (res[0].item_id !== parseInt(answer.item)) {
          console.log("Item not in database...");
          deskTop();
        } else {
          if (res[0].stock_quantity > 4) {
            console.log(`There is enough stock for ${res[0].product_name}...`);
            deskTop();
          } else {
            var newStock = res[0].stock_quantity + parseInt(answer.unit);
            var xItem = parseInt(answer.item);
            connection.query(
              "UPDATE products SET ? WHERE ?", 
              [
                {stock_quantity: newStock}, 
                {item_id: xItem}
              ], function(err, res) 
              { inQuery = "SELECT * FROM products Where item_id =" + xItem;
                productList();
              }
              );
          }
        }
    });  
  });
};  //  --- Add Inventory  ends ---

// ----  Add New Product  ---
var addProduct = function() {
  inquirer.prompt([
   {name: "pname",
    type: "input",
    message: "Product Name",
    validate: function(value) {
        if (value === "") {return false;}
        return true;
       }
   },
   {name: "dname",
    type: "input",
    message: "Department Name",
    validate: function(value) {
        if (value === "") {return false;}
        return true;
       }
   }, 
   {name: "price",
    type: "input",
    message: "Price",
    validate: function(value) {
        if (isNaN(value) === false) {return true;}
        return false;
      }
    },
    {name: "unit",
    type: "input",
    message: "Stock Quantity",
    validate: function(value) {
        if (isNaN(value) === false) {return true;}
        return false;
      }
    }
    ]).then(function(answer) {

    inQuery = "INSERT INTO products SET ?";
    connection.query(inQuery,
      { product_name: answer.pname,
        department_name: answer.dname,
        price: parseFloat(answer.price),
        stock_quantity: parseInt(answer.unit),
        product_sales: 0
      },
      function(err, res)
      {console.log(`${answer.pname} has been added to the database.`);
      deskTop(); 
    }); // insert ends  
  }); // prompt ends 
};  //  --- Add Product  ends ---

deskTop();