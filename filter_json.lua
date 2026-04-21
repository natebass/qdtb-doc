local dkjson = require("dkjson")
return function(t)
    return dkjson.encode(t, { indent = true })
end
