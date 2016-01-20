var util = require("util");
var fs = require('fs')

if ( process.argv.lenght < 2 || process.argv[2] == "-h" || process.argv[2] == "--help")
{
    console.log("Usage: bbanalyze <browserify>\n")
    process.exit(1);
}


var spaces = "          ";

function align(s, len)
{
    s = String(s);

    var indent = len - String(s).length;

    var out = "";
    do
    {
        if (indent > 10)
        {
            out += spaces;
            indent -= 10;
        }
        else
        {
            out += spaces.substring(0, indent);
            indent = 0;
        }

    } while (indent > 0);

    return out + s;
}

var NODE_MODULES = "node_modules/";

fs.readFile(process.argv[2], 'utf8', function (err,content) {
    if (err) {
        return console.log(err);
    }

    var level = 0;

    for (var i=0; i<content.length; i++)
    {
        var c = content[i];
        if (c === "(")
        {
            level++;
        }
        else if (c === ")")
        {
            level--;
            if (level === 0)
            {
                var code = "(function(map) { return map })" + content.substring(i + 1);

                var map = eval(code);

                var name;
                var sum = 0;
                var weights = {};
                for (name in map)
                {
                    if (map.hasOwnProperty(name))
                    {
                        if (/^\d+/.test(name))
                        {
                            throw new Error("Bundle must be generated with option fullPaths : true");
                        }

                        var pos = name.indexOf(NODE_MODULES);
                        if (pos >= 0)
                        {
                            pos += NODE_MODULES.length;
                            var end = name.indexOf("/", pos);
                            var lib = name.substring(pos, end);

                            var w = map[name].toString().length;

                            var weight = weights[lib];
                            if (!weight)
                            {
                                weights[lib] = w;
                            }
                            else
                            {
                                weights[lib] = weight + w;
                            }

                            sum += w;
                        }
                    }
                }


                var l = [];

                var maxName = 0;
                var maxWeight = 0;

                for (name in weights)
                {
                    if (weights.hasOwnProperty(name))
                    {

                        var w = weights[name];
                        l.push({
                            name: name,
                            weight: w
                        });
                    }

                    maxName = Math.max(name.length, maxName);
                    maxWeight = Math.max(String(w).length, maxWeight);
                }

                l.sort(function(a,b){
                   return b.weight - a.weight;
                });

                console.log (align("All" , maxName) + ": " + align(sum, maxWeight));
                for (var j = 0; j < l.length; j++)
                {
                    var e = l[j];
                    console.log(align(e.name, maxName) + ": " + align(e.weight, maxWeight) + " - " + (Math.round(e.weight / sum * 10000) / 100) + "%");
                }
                break;
            }
        }
    }

});
