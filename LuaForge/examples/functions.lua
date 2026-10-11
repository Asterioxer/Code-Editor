local function map(fn, items)
  local result = {}
  for i, item in ipairs(items) do result[i] = fn(item) end
  return result
end
local squares = map(function(n) return n*n end, {1,2,3,4,5})
print(table.concat(squares, ", "))
