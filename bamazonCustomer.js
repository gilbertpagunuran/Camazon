var Table = require('cli-table');
var mysql = require("mysql");
var inquirer = require("inquirer");

var table = new Table({
            head: ['Item #', 'Product', 'Department', 'Unit Price', 'Stock']
            , colWidths: [8, 30, 25, 10, 10]
          });

var connection= mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'Bamazon'
});

connection.connect(function(err){
  if(err) throw err;
  console.log("connected as id " + connection.threadId);
});


var productArr = [];
var balance = 0;

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

var productList = function() {
  connection.query("SELECT * FROM products",
    function(err, res) {
    //  console.log(res);
      
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
          // for (var i = 0; i < productArr.length; i++) {
          //  console.log(`${productArr[i].item_id} : ${productArr[i].product_name} : ${productArr[i].department_name} : ${productArr[i].price} : ${productArr[i].stock_quantity}`); 
          // }
          console.log(table.toString());
          console.log(`Your Total Purchase : $${balance}`);
          storeFront();
    }
  );
};

var storeFront = function() {
  inquirer.prompt([
   {name: "item",
    type: "input",
    message: "What is the item# you would like to buy?",
    validate: function(value) {
        if (isNaN(value) === false) {return true;}
        return false;
       }
   }, 
   {name: "unit",
    type: "input",
    message: "How many would you like to order?",
    validate: function(value) {
        if (isNaN(value) === false) {return true;}
        return false;
      }
    }
    ]).then(function(answer) {

      var pointer = 0; var foundIt = false;
      for (var i = 0; i < productArr.length; i++) {
        if (productArr[i].item_id == parseInt(answer.item)) 
          {pointer = i; foundIt = true; break}
      };

      if (!foundIt) {
        console.log("We do not have that item for sale!");
        storeFront();
      } else 
      {
         if (productArr[i].stock_quantity < parseInt(answer.unit)) {
          console.log("Our stock is insufficient for your order...");
          storeFront();
         } else 
         {
           // at this point, all inputs are valid
          var buy = answer.unit * productArr[i].price;
          console.log(`confirm your purchase of $${buy}`);

          sold(parseInt(answer.item), 
               parseInt(answer.unit), 
               productArr[i].stock_quantity, 
               productArr[i].department_name,
               productArr[i].product_sales,
               productArr[i].price);

          }
      }

    });
};

var sold = function(xItem, xUnit, preQty, xDept, xSales, xPrice) {
 inquirer.prompt([
  { name: "confirm",
    message: "Please confirm purchase: 1-Yes, 0-No"
  }]).then(function(ans) {
    if (ans.confirm !== '1') {
      console.log("Purchase is cancelled ......");
      storeFront();
    }
    else {
      console.log("posting......");
      var newStock = preQty - xUnit;
      var newSales = xUnit * xPrice;
      //balance = balance + (xUnit * xPrice);
      //console.log(`newQty=${newStock} newSales=${newSales} balance=${balance}`);
      connection.query(
        "UPDATE products SET ? WHERE ?", 
        [
         {stock_quantity: newStock,
          product_sales: xSales + newSales}, 
         {item_id: xItem}
        ], function(err, res) 
        { 
          inQuery = "UPDATE departments SET " +
            "total_sales = total_sales + " + newSales.toString() +
            " WHERE department_name = '" + xDept + "'";
    //     console.log(inQuery);
          connection.query(inQuery,
              function(err, res) 
              { balance = balance + newSales;
                productArr.length = 0;
                table.length = 0;
                productList();
              }
          );
        }
        );
      }
  });
}

productList();