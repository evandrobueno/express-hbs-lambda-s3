const express = require("express")
const serverless = require("serverless-http");
const exphbs  = require("express-handlebars");
const { path } = require("express/lib/application");
const Handlebars = require("handlebars");
const request = require("request");
const app = express()

app.use("/public", express.static(__dirname + "/public"))
app.engine("hbs", exphbs.engine({extname: ".hbs", defaultLayout:"main.hbs"}));
app.set("view engine", "hbs");

async function getComponent(name, data)
{
  return new Promise(function(resolve)
  {
    var componentUrl = "http://lib-handlebars.s3-website-us-east-1.amazonaws.com/v.1.0/components/" + name + "/index.hbs";  
    request(componentUrl, async function (error, response, componentTemplate)
    { 
      resolve(Handlebars.compile(componentTemplate)(data)); 
    });
  });
}

async function getTemplate(name, data)
{
  return new Promise(async function(resolve)
  {
    var components = [];
    for (const component of data.components)
    { 
      components.push(await getComponent(component.name, component.data));
    }

    var componentUrl = "http://lib-handlebars.s3-website-us-east-1.amazonaws.com/v.1.0/templates/" + name + "/index.hbs";  
    request(componentUrl, async function (error, response, template)
    { 
      resolve(Handlebars.compile(template)({render: components}))
    });
  });
}

app.get("/", async (req, res) => 
{
  request('http://lib-handlebars.s3-website-us-east-1.amazonaws.com/data.json', async function (error, response, data)
  { 
    res.render("body", {title: data.title, description: data.description, author: data.author, render: await getTemplate("template", JSON.parse(data))})
  });  
})

app.listen(3000, () => {
  console.log("Server online")
})

module.exports.handler = serverless(app);